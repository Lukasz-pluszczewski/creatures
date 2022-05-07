import { Tanh } from 'activation-functions';
import { Creature, Neuron, Simulator } from './types';
import { createNumber } from './numberUtils';
import {
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  NEURON_TYPE_INPUT,
  NEURON_TYPE_INTERNAL,
  NEURON_TYPE_OUTPUT,
} from './constants';
import { createArray } from './arrayUtils';
import { Config } from './config';
import swich from 'swich';
import { findClosestFood } from './worldUtils';

export const generateNeurons = (config: Config) => {
  const inputNeurons: Neuron[] = [
    {
      label: `random`,
      getValue: () => (Math.random() * 2 - 1),
    },
    {
      label: 'northWallDistance',
      getValue: (creature: Creature, config: Config) => (config.worldSizeY - creature.y) / config.worldSizeY,
    },
    {
      label: 'eastWallDistance',
      getValue: (creature: Creature, config: Config) => (config.worldSizeX - creature.x) / config.worldSizeX,
    },
    {
      label: 'southWallDistance',
      getValue: (creature: Creature) => creature.y / config.worldSizeY,
    },
    {
      label: 'westWallDistance',
      getValue: (creature: Creature) => creature.x / config.worldSizeX,
    },
    {
      label: 'closestFoodHorizontalDistance',
      getValue: (creature: Creature, config: Config, simulator: Simulator) => {
        const closestFood = simulator.getStepCached(
          `closestFood[${creature.x},${creature.y}]`,
          () => findClosestFood(simulator.world, creature.x, creature.y)
        );
        if (!closestFood.food) {
          return 1; // we return maximum value if there is no food
        }
        return (closestFood.food.x - creature.x) / config.worldSizeX;
      },
    },
    {
      label: 'closestFoodVerticalDistance',
      getValue: (creature: Creature, config: Config, simulator: Simulator) => {
        const closestFood = simulator.getStepCached(
          `closestFood[${creature.x},${creature.y}]`,
          () => findClosestFood(simulator.world, creature.x, creature.y)
        );
        if (!closestFood.food) {
          return 1; // we return maximum value if there is no food
        }
        return (closestFood.food.y - creature.y) / config.worldSizeY;
      },
    },
    {
      label: 'energy',
      getValue: (creature: Creature) => creature.creatureState.energy,
    },
    {
      label: 'age',
      getValue: (creature: Creature, config: Config, simulator: Simulator) => simulator.step / config.generationLength,
    },
  ].map((neuron, index) => {
    const id = createNumber(MIN_INPUT_NEURON_ID + index, 8);
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
    const id = createNumber(MIN_INTERNAL_NEURON_ID + index, 8);
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
      act: (output, creature, config, simulator) => swich([
        [() => output > 0.5, () => simulator.moveCreature(creature, 1, 0)],
        [() => output < -0.5, () => simulator.moveCreature(creature, -1, 0)],
      ])(),
    },
    {
      label: 'moveVertical',
      act: (output, creature, config, simulator) => swich([
        [() => output > 0.5, () => simulator.moveCreature(creature, 0, 1)],
        [() => output < -0.5, () => simulator.moveCreature(creature, 0, -1)],
      ])(),
    },
  ].map((neuron, index) => {
    const id = createNumber(MIN_OUTPUT_NEURON_ID + index, 8);
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

  return {
    inputNeurons,
    inputNeuronsIds,
    internalNeurons,
    internalNeuronsIds,
    outputNeurons,
    outputNeuronsIds,
    neuronMap,
    reproduceNeuronId: outputNeurons.find(({ label }) => label.startsWith('reproduce')).id,
  };
};
