import { Tanh } from 'activation-functions';
import { Creature, Neuron } from './types';
import { createNumber, randomInteger } from './numberUtils';
import {
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  NEURON_TYPE_INPUT,
  NEURON_TYPE_INTERNAL, NEURON_TYPE_OUTPUT
} from './constants';
import { createArray } from './arrayUtils';
import { Config } from './config';
import swich from 'swich';

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
  ].map((neuron, index) => {
    const id = createNumber(MIN_INPUT_NEURON_ID + index, 8);
    return {
      ...neuron,
      id,
      label: `${neuron.label}[${id}]`,
      activation: x => x,
      type: NEURON_TYPE_INPUT,
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
      ...neuron,
      id,
      label: `${neuron.label}[${id}]`,
      activation: Tanh,
      type: NEURON_TYPE_OUTPUT,
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
  };
};
