import { MIN_INPUT_NEURON_ID, MIN_INTERNAL_NEURON_ID, MIN_OUTPUT_NEURON_ID } from './constants';

const internalNeurons = 5;
export const config = {
  population: 100,
  generationLength: 200,
  genomeLength: 10,
  internalNeurons,
  worldSizeX: 128,
  worldSizeY: 128,

  minNumberOfOffspring: 1,
  maxNumberOfOffspring: 5,

  maxInputNeuronId: MIN_INPUT_NEURON_ID + 4,
  maxInternalNeuronId: MIN_INTERNAL_NEURON_ID + internalNeurons - 1,
  maxOutputNeuronId: MIN_OUTPUT_NEURON_ID + 1,

  mutationProbabilityMatrix: {
    sourceType: 0,
    sourceId: 0.01,
    targetType: 0,
    targetId: 0.01,
    weight: 0.1,
  },
  weightMultiplier: 0.0002, // weight can be in range [-32768 * weightMultiplier, 32767 * weightMultiplier]; [-6.55, 6.55]
} as const;

export type Config = typeof config;

const validateConfig = (config: Config) => {
  if (!config.internalNeurons) {
    if (config.mutationProbabilityMatrix.sourceType) {
      throw new Error('Without internal neurons probability of mutating sourceType must be 0')
    }
    if (config.mutationProbabilityMatrix.targetType) {
      throw new Error('Without internal neurons probability of mutating targetType must be 0')
    }
  }
};
validateConfig(config);

