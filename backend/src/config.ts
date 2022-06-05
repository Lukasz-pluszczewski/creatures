import {
  MAX_16_BIT_INTEGER,
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  OFFSPRING_NUMBER_CALCULATION_TYPES,
} from './constants';
import { generateNeurons } from './neuronsUtils';
import { ValueOf } from './typesUtilities';

export type Config = {
  population: number,
  generationLength: number,
  genomeLength: number,
  internalNeurons: number,
  worldSizeX: number,
  worldSizeY: number,

  offspringCalculationType: ValueOf<typeof OFFSPRING_NUMBER_CALCULATION_TYPES>,
  minNumberOfOffspring: number,
  maxNumberOfOffspring: number,

  repopulateWhenPopulationDiesOut: boolean,
  populationLimit: number,

  initialEnergy: number,
  maximumEnergy: number,
  foodDensity: number,
  foodNutrition: number,
  moveEnergyCost: number,
  stepEnergyCost: number,
  foodRegrowLimit: number,
  foodLimit: number,

  foodSensorRange: number,

  maxInputNeuronId: number,
  maxInternalNeuronId: number,
  maxOutputNeuronId: number,

  mutationProbabilityMatrix: {
    sourceId: number,
    targetId: number,
    weight: number,
  },
  weightMultiplier: number,

  stepLogFrequency: number,
  generationStepsLogFrequency: number,
  generationGenomeLogFrequency: number,
};

const internalNeurons = 2;
export const getConfig = (): Config => {
  const config: Config = {
    population: 100,
    generationLength: 1000,
    genomeLength: 100,
    internalNeurons,
    worldSizeX: 128,
    worldSizeY: 128,

    offspringCalculationType: OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY,
    minNumberOfOffspring: 2,
    maxNumberOfOffspring: 20,

    repopulateWhenPopulationDiesOut: true,
    populationLimit: 500,

    // energy is in range [0, MAX_16_BIT_INTEGER = 65535]
    initialEnergy: Math.floor(0.01 * MAX_16_BIT_INTEGER),
    maximumEnergy: Math.floor(0.03 * MAX_16_BIT_INTEGER),
    foodDensity: 0.02, // probability of spawning food in a cell
    foodNutrition: Math.floor(0.01 * MAX_16_BIT_INTEGER),
    moveEnergyCost: Math.floor(0.0001 * MAX_16_BIT_INTEGER),
    stepEnergyCost: Math.floor(0.0001 * MAX_16_BIT_INTEGER),
    foodRegrowLimit: 20, // food will not be regrown if there is at least this amount of it
    foodLimit: 5000, // highest number of food to grow at the beginning of the generation

    foodSensorRange: 10,

    maxInputNeuronId: 0,
    maxInternalNeuronId: 0,
    maxOutputNeuronId: 0,

    mutationProbabilityMatrix: {
      sourceId: 0.2,
      targetId: 0.2,
      weight: 0.2,
    },
    weightMultiplier: 0.0002, // weight can be in range [-32768 * weightMultiplier, 32767 * weightMultiplier]; [-6.55, 6.55]

    stepLogFrequency: 1, // n % stepLogFrequency === 0 => log n-th step; 0 => logging disabled; first step is always logged
    generationStepsLogFrequency: 50, // n % generationStepsLogFrequency === 0 => log steps for n-th generation; 0 => logging disabled; first generation is always logged
    generationGenomeLogFrequency: 50, // n % generationLogFrequency === 0 => log genome for n-th generation; 0 => logging disabled; first generation is always logged
  };

  const { inputNeuronsIds, internalNeuronsIds, outputNeuronsIds } = generateNeurons(config as Config);

  config.maxInputNeuronId = MIN_INPUT_NEURON_ID + inputNeuronsIds.length;
  config.maxInternalNeuronId = MIN_INTERNAL_NEURON_ID + internalNeuronsIds.length;
  config.maxOutputNeuronId = MIN_OUTPUT_NEURON_ID + outputNeuronsIds.length;

  return config;
};



const validateConfig = (config: Config) => {
  if (config.population > config.populationLimit) {
    throw new Error(
      `populationLimit (${config.populationLimit}) is smaller than population (${config.population})`
    );
  }
};
validateConfig(getConfig());

