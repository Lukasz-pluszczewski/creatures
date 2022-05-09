import {
  MAX_16_BIT_INTEGER,
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  OFFSPRING_NUMBER_CALCULATION_TYPES,
} from './constants';

const internalNeurons = 10;
export const config = {
  population: 1000,
  generationLength: 200,
  genomeLength: 30,
  internalNeurons,
  worldSizeX: 128,
  worldSizeY: 128,

  offspringCalculationType: OFFSPRING_NUMBER_CALCULATION_TYPES.RANDOM as keyof typeof OFFSPRING_NUMBER_CALCULATION_TYPES,
  minNumberOfOffspring: 1, // not used with energy-based reproduction, see simulator.ts:134
  maxNumberOfOffspring: 20,

  repopulateWhenPopulationDiesOut: true,
  populationLimit: 200,

  // energy is in range [0, 65535]
  initialEnergy: Math.floor(0.01 * MAX_16_BIT_INTEGER),
  foodDensity: 0.02, // probability of spawning food in a cell
  foodNutrition: Math.floor(0.01 * MAX_16_BIT_INTEGER),
  moveEnergyCost: Math.floor(0.0005 * MAX_16_BIT_INTEGER),
  stepEnergyCost: Math.floor(0.0001 * MAX_16_BIT_INTEGER),
  foodLimit: 250, // food will not be regrown if there is at least this amount of it

  maxInputNeuronId: MIN_INPUT_NEURON_ID + 8,
  maxInternalNeuronId: MIN_INTERNAL_NEURON_ID + internalNeurons - 1,
  maxOutputNeuronId: MIN_OUTPUT_NEURON_ID + 2,

  mutationProbabilityMatrix: {
    sourceId: 0.01,
    targetId: 0.01,
    weight: 0.1,
  },
  weightMultiplier: 0.0002, // weight can be in range [-32768 * weightMultiplier, 32767 * weightMultiplier]; [-6.55, 6.55]

  stepLogFrequency: 1, // n % stepLogFrequency === 0 => log n-th step
  generationLogFrequency: 1, // n % generationLogFrequency === 0 => log n-th generation
} as const;

export type Config = typeof config;

const validateConfig = (config: Config) => {

};
validateConfig(config);

