import swich from 'swich';
import { Tanh } from 'activation-functions';

import {
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  NEURON_TYPE_INPUT,
  NEURON_TYPE_INTERNAL,
  NEURON_TYPE_OUTPUT,
} from './constants';


import { createArray } from './arrayUtils';
import { findClosestFood } from './worldUtils';

import type { Config } from './config';
import type { Neuron, NeuronsData, Simulator } from './types';
import { randomSign } from './numberUtils';

/**
 * Input neurons (10):
 *   1: bias[1]
 *   2: northWallDistance[2]
 *   3: eastWallDistance[3]
 *   4: southWallDistance[4]
 *   5: westWallDistance[5]
 *   6: closestFoodHorizontalDistance[6]
 *   7: closestFoodVerticalDistance[7]
 *   8: energy[8]
 *   9: age[9]
 *   10: random[10]
 * Internal neurons (10):
 *   128: internal0[128]
 *   129: internal1[129]
 *   130: internal2[130]
 *   131: internal3[131]
 *   132: internal4[132]
 *   133: internal5[133]
 *   134: internal6[134]
 *   135: internal7[135]
 *   136: internal8[136]
 *   137: internal9[137]
 * Output neurons (3):
 *   64: reproduce[64]
 *   65: moveHorizontal[65]
 *   66: moveVertical[66]
 * @param config
 */

export const generateNeurons = (config: Config): NeuronsData => {
  const inputNeurons: Neuron[] = [
    {
      label: `bias`,
      getValue: () => 1,
    },
    {
      label: 'northWallDistance',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) =>
        (config.worldSizeY - simulator.state.creaturesData.y[creatureIndex]) / config.worldSizeY,
    },
    {
      label: 'eastWallDistance',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) =>
        (config.worldSizeX - simulator.state.creaturesData.x[creatureIndex]) / config.worldSizeX,
    },
    {
      label: 'southWallDistance',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) =>
        simulator.state.creaturesData.y[creatureIndex] / config.worldSizeY,
    },
    {
      label: 'westWallDistance',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) =>
        simulator.state.creaturesData.x[creatureIndex] / config.worldSizeX,
    },
    {
      label: 'closestFoodHorizontalDistance',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) => {
        const x = simulator.state.creaturesData.x[creatureIndex];
        const y = simulator.state.creaturesData.y[creatureIndex];

        const closestFoodIndex = simulator.getStepCached(
          `closestFoodIndex[${x},${y}]`,
          () => findClosestFood(x, y, simulator.state.world, simulator.state.foodData, config),
        );

        if (!closestFoodIndex) {
          return randomSign() * 1;
        }
        return (simulator.state.foodData.x[closestFoodIndex] - x) / config.worldSizeX;
      },
    },
    {
      label: 'closestFoodVerticalDistance',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) => {
        const x = simulator.state.creaturesData.x[creatureIndex];
        const y = simulator.state.creaturesData.y[creatureIndex];

        const closestFoodIndex = simulator.getStepCached(
          `closestFoodIndex[${x},${y}]`,
          () => findClosestFood(x, y, simulator.state.world, simulator.state.foodData, config),
        );

        if (!closestFoodIndex) {
          return randomSign() * 1;
        }
        return (simulator.state.foodData.y[closestFoodIndex] - y) / config.worldSizeX;
      },
    },
    {
      label: 'energy',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) =>
        simulator.state.creaturesData.energy[creatureIndex],
    },
    {
      label: 'age',
      getValue: (creatureIndex: number, config: Config, simulator: Simulator) =>
        simulator.state.step / config.generationLength,
    },
    {
      label: `random`,
      getValue: () => (Math.random() * 2 - 1),
    },
  ].map((neuron, index) => {
    const id = MIN_INPUT_NEURON_ID + index;
    return {
      id,
      activation: x => x,
      type: NEURON_TYPE_INPUT,
      ...neuron,
      label: `${neuron.label}[${id}]`,
    };
  });
  const inputNeuronsIds = inputNeurons.map(({ id }) => id);

  const internalNeurons: Neuron[] = createArray(config.internalNeurons).map((__, index) => {
    const id = MIN_INTERNAL_NEURON_ID + index;
    return {
      id,
      label: `internal${index}[${id}]`,
      activation: Tanh,
      type: NEURON_TYPE_INTERNAL,
    };
  });
  const internalNeuronsIds = internalNeurons.map(({ id }) => id);

  const outputNeurons: Neuron[] = [
    {
      label: 'reproduce',
      act: () => {},
      activation: x => x,
    },
    {
      label: 'moveHorizontal',
      act: (output: number, creatureIndex: number, config: Config, simulator: Simulator) => swich([
        [() => output > 0.5, () => simulator.moveCreature(creatureIndex, 1, 0)],
        [() => output < -0.5, () => simulator.moveCreature(creatureIndex, -1, 0)],
      ])(),
    },
    {
      label: 'moveVertical',
      act: (output: number, creatureIndex: number, config: Config, simulator: Simulator) => swich([
        [() => output > 0.5, () => simulator.moveCreature(creatureIndex, 0, 1)],
        [() => output < -0.5, () => simulator.moveCreature(creatureIndex, 0, -1)],
      ])(),
    },
  ].map((neuron, index) => {
    const id = MIN_OUTPUT_NEURON_ID + index;
    return {
      id,
      activation: Tanh,
      type: NEURON_TYPE_OUTPUT,
      ...neuron,
      label: `${neuron.label}[${id}]`,
    };
  });
  const outputNeuronsIds = outputNeurons.map(({ id }) => id);

  const neuronMap = [...inputNeurons, ...internalNeurons, ...outputNeurons]
    .reduce<{ [neuronId: number]: Neuron }>((accu, neuron) => {
      accu[neuron.id] = neuron;
      return accu;
    }, {});

  // calculating all possible connection to speed up creature generation and mutation
  const possibleConnectionsFrom = {};
  const possibleConnectionsTo = {};

  inputNeuronsIds.forEach(inputNeuronId => {
    possibleConnectionsFrom[inputNeuronId] = possibleConnectionsFrom[inputNeuronId] || [];

    internalNeuronsIds.forEach(internalNeuronId => {
      possibleConnectionsTo[internalNeuronId] = possibleConnectionsTo[internalNeuronId] || [];

      possibleConnectionsFrom[inputNeuronId].push(internalNeuronId);
      possibleConnectionsTo[internalNeuronId] = inputNeuronId;
    });
    outputNeuronsIds.forEach(outputNeuronId => {
      possibleConnectionsTo[outputNeuronId] = possibleConnectionsTo[outputNeuronId] || [];

      possibleConnectionsFrom[inputNeuronId].push(outputNeuronId);
      possibleConnectionsTo[outputNeuronId] = inputNeuronId;
    });
  });
  outputNeuronsIds.forEach(outputNeuronId => {
    internalNeuronsIds.forEach(internalNeuronId => {
      possibleConnectionsFrom[internalNeuronId] = possibleConnectionsFrom[internalNeuronId] || [];

      possibleConnectionsFrom[internalNeuronId].push(outputNeuronId);
      possibleConnectionsTo[outputNeuronId] = internalNeuronId;
    });
  });


  let el;
  if (el = Object.keys(possibleConnectionsFrom).find(el => !possibleConnectionsFrom[el])) {
    console.log('No connections from', el);
  }
  if (el = Object.keys(possibleConnectionsTo).find(el => !possibleConnectionsTo[el])) {
    console.log('No connections to', el);
  }

  return {
    inputNeurons,
    inputNeuronsIds,
    internalNeurons,
    internalNeuronsIds,
    outputNeurons,
    outputNeuronsIds,
    numberOfNeurons: inputNeurons.length + internalNeurons.length + outputNeurons.length,
    neuronMap,
    reproduceNeuronId: outputNeurons.find(({ label }) => label.startsWith('reproduce')).id,
    possibleConnectionsFrom,
    possibleConnectionsTo,
    numberOfPossibleSourceNeurons: Object.keys(possibleConnectionsFrom).length,
    numberOfPossibleTargetNeurons: Object.keys(possibleConnectionsTo).length,
  };
};
