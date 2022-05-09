import {
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
} from './constants';
import { Config } from './config';

import {
  cleanGenome,
  getRawConnectionMap,
  traverseOutputNeurons,
} from './graphUtils';

import { testGenome, testValidGenome } from './testEntities';


const configForTest = {
  population: 100,
  generationLength: 200,
  genomeLength: 13,
  internalNeurons: 5,
  worldSizeX: 128,
  worldSizeY: 128,

  maxInputNeuronId: MIN_INPUT_NEURON_ID + 4,
  maxInternalNeuronId: MIN_INTERNAL_NEURON_ID + 4,
  maxOutputNeuronId: MIN_OUTPUT_NEURON_ID + 1,

  mutationProbabilityMatrix: {
    sourceType: 0,
    sourceId: 0.01,
    targetType: 0,
    targetId: 0.01,
    weight: 0.1,
  },
  weightMultiplier: 0.0002,
} as unknown as Config;



describe('graphUtils', () => {
});
