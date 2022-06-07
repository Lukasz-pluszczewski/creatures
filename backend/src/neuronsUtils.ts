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
import type { CreaturesData, Neuron, NeuronsData, Simulator } from './types';
import { randomSign } from './numberUtils';
import { getCachedValue } from './cacheUtils';

export const generateNeurons = (config: Config): NeuronsData => {
  const inputNeurons: Neuron[] = [
    {
      label: `bias`,
      getValue: () => 1,
    },
    {
      label: 'northWallDistance',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) =>
        (config.worldSizeY - state.creaturesData.y[creatureIndex]) / config.worldSizeY,
    },
    {
      label: 'eastWallDistance',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) =>
        (config.worldSizeX - state.creaturesData.x[creatureIndex]) / config.worldSizeX,
    },
    {
      label: 'southWallDistance',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) =>
        state.creaturesData.y[creatureIndex] / config.worldSizeY,
    },
    {
      label: 'westWallDistance',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) =>
        state.creaturesData.x[creatureIndex] / config.worldSizeX,
    },
    {
      label: 'closestFoodHorizontalDistance',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) => {
        const x = state.creaturesData.x[creatureIndex];
        const y = state.creaturesData.y[creatureIndex];

        const closestFoodIndex = getCachedValue(
          state.stepCache.closestFood,
          x * config.worldSizeY + y,
          async () => findClosestFood(x, y, state.world, state.foodData, config),
        );

        if (!closestFoodIndex) {
          return randomSign() * 1;
        }
        return (state.foodData.x[closestFoodIndex] - x) / config.worldSizeX;
      },
    },
    {
      label: 'closestFoodVerticalDistance',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) => {
        const x = state.creaturesData.x[creatureIndex];
        const y = state.creaturesData.y[creatureIndex];

        const closestFoodIndex = getCachedValue(
          state.stepCache.closestFood,
          x * config.worldSizeY + y,
          async () => findClosestFood(x, y, state.world, state.foodData, config),
        );

        if (!closestFoodIndex) {
          return randomSign() * 1;
        }
        return (state.foodData.y[closestFoodIndex] - y) / config.worldSizeX;
      },
    },
    {
      label: 'energy',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) =>
        state.creaturesData.energy[creatureIndex],
    },
    {
      label: 'age',
      getValue: (creatureIndex: number, config: Config, state: Simulator['state']) =>
        state.step / config.generationLength,
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
    // {
    //   label: 'reproduce',
    //   act: async () => {},
    //   activation: x => x,
    // },
    {
      label: 'moveHorizontal',
      act: async (output: number, creatureIndex: number, config: Config, simulator: Simulator) => swich([
        [() => output > 0.5, () => simulator.moveCreature(creatureIndex, 1, 0)],
        [() => output < -0.5, () => simulator.moveCreature(creatureIndex, -1, 0)],
      ])(),
    },
    {
      label: 'moveVertical',
      act: async (output: number, creatureIndex: number, config: Config, simulator: Simulator) => swich([
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
    // reproduceNeuronId: outputNeurons.find(({ label }) => label.startsWith('reproduce')).id,
    possibleConnectionsFrom,
    possibleConnectionsTo,
    numberOfPossibleSourceNeurons: Object.keys(possibleConnectionsFrom).length,
    numberOfPossibleTargetNeurons: Object.keys(possibleConnectionsTo).length,
  };
};

export const getNeuronIdByLabel = (neuronsData: NeuronsData, labelToFind: string) => {
  const neurons = [
    ...neuronsData.inputNeurons,
    ...neuronsData.internalNeurons,
    ...neuronsData.outputNeurons,
  ];
  const id = neurons.find(({ label }) => labelToFind === label.split('[')[0])?.id;
  if (!id) {
    throw new Error(`Neuron ${labelToFind} not found. Available labels: ${neurons.map(({ label }) => label).join(', ')}`);
  }
  return id;
}
