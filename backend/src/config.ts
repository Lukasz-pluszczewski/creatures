import {
  MAX_16_BIT_INTEGER,
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  OFFSPRING_NUMBER_CALCULATION_TYPES,
} from './constants';

const internalNeurons = 10;
export const config = {
  population: 100,
  generationLength: 200,
  genomeLength: 100,
  internalNeurons,
  worldSizeX: 128,
  worldSizeY: 128,

  offspringCalculationType: OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY as keyof typeof OFFSPRING_NUMBER_CALCULATION_TYPES,
  minNumberOfOffspring: 1,
  maxNumberOfOffspring: 20,

  repopulateWhenPopulationDiesOut: true,
  populationLimit: 200,

  // energy is in range [0, 65535]
  initialEnergy: Math.floor(0.01 * MAX_16_BIT_INTEGER),
  maximumEnergy: Math.floor(0.03 * MAX_16_BIT_INTEGER),
  foodDensity: 0.05, // probability of spawning food in a cell
  foodNutrition: Math.floor(0.01 * MAX_16_BIT_INTEGER),
  moveEnergyCost: Math.floor(0.0001 * MAX_16_BIT_INTEGER),
  stepEnergyCost: Math.floor(0.0001 * MAX_16_BIT_INTEGER),
  foodRegrowLimit: 50, // food will not be regrown if there is at least this amount of it
  foodLimit: 5000, // highest number of food to grow at the beginning of the generation

  foodSensorRange: 10,

  maxInputNeuronId: MIN_INPUT_NEURON_ID + 8,
  maxInternalNeuronId: MIN_INTERNAL_NEURON_ID + internalNeurons - 1,
  maxOutputNeuronId: MIN_OUTPUT_NEURON_ID + 2,

  mutationProbabilityMatrix: {
    sourceId: 0.2,
    targetId: 0.2,
    weight: 0.2,
  },
  weightMultiplier: 0.0002, // weight can be in range [-32768 * weightMultiplier, 32767 * weightMultiplier]; [-6.55, 6.55]

  stepLogFrequency: 1, // n % stepLogFrequency === 0 => log n-th step; 0 => logging disabled; first step is always logged
  generationStepsLogFrequency: 1, // n % generationStepsLogFrequency === 0 => log steps for n-th generation; 0 => logging disabled; first generation is always logged
  generationGenomeLogFrequency: 1, // n % generationLogFrequency === 0 => log genome for n-th generation; 0 => logging disabled; first generation is always logged

  enableLogs: false,
} as const;

export type Config = typeof config;

const validateConfig = (config: Config) => {
  if (config.population > config.populationLimit) {
    throw new Error(
      `populationLimit (${config.populationLimit}) is smaller than population (${config.population})`
    );
  }
};
validateConfig(config);

