import {
  MAX_16_BIT_INTEGER, MAX_16_BIT_SIGNED_INTEGER, MIN_16_BIT_SIGNED_INTEGER,
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID, MIN_OUTPUT_NEURON_ID,
  OFFSPRING_NUMBER_CALCULATION_TYPES
} from './constants';
import { Config } from './config';
import { generateNeurons } from './neuronsUtils';
import { CreaturesData, Simulator } from './types';
import { createSimulator } from './simulator';
import { clearDataStorage } from './memoryUtils';
import { getIndexFromCoordinates } from './arrayUtils';
import { cleanGenome, getRawConnectionMap, traverseOutputNeurons } from './graphUtils';
import { worldDataValidator } from './debugUtils';


const internalNeurons = 1;
export const testConfig = {
  population: 5,
  generationLength: 2,
  genomeLength: 5,
  internalNeurons,
  worldSizeX: 128,
  worldSizeY: 128,

  offspringCalculationType: OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY as keyof typeof OFFSPRING_NUMBER_CALCULATION_TYPES,
  minNumberOfOffspring: 2,
  maxNumberOfOffspring: 20,

  repopulateWhenPopulationDiesOut: true,
  populationLimit: 500,

  // energy is in range [0, 65535]
  initialEnergy: Math.floor(0.01 * MAX_16_BIT_INTEGER),
  maximumEnergy: Math.floor(0.03 * MAX_16_BIT_INTEGER),
  foodDensity: 0.08, // probability of spawning food in a cell
  foodNutrition: Math.floor(0.01 * MAX_16_BIT_INTEGER),
  moveEnergyCost: Math.floor(0.0001 * MAX_16_BIT_INTEGER),
  stepEnergyCost: Math.floor(0.0002 * MAX_16_BIT_INTEGER),
  foodRegrowLimit: 50000, // in tests, we usually regrow food every time
  foodLimit: 50000, // in tests there is no limit on food

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
} as unknown as Config;
const neuronsData = generateNeurons(testConfig);
const resultCondition = (creatureIndex: number, creaturesData: CreaturesData, config: Config, simulator: Simulator) => {
  return { reproductionProbability: 1 };
};
type TestCreature = {
  label: string,
  x: number,
  y: number,
  energy: number,
  genome: { sourceId: number, targetId: number, weight: number, invalid?: boolean }[],
  expect: { x: number, y: number, energy: number }[],
}
const dummyConnection = { sourceId: 1, targetId: 128, weight: 0 };
export const testCreatures: TestCreature[] = [
  {
    label: 'always down',
    x: 10,
    y: 120,
    energy: testConfig.initialEnergy,
    genome: [
      { sourceId: 1, targetId: 66, weight: MIN_16_BIT_SIGNED_INTEGER },
      dummyConnection,
      dummyConnection,
      dummyConnection,
      dummyConnection,
    ],

    expect: [
      { x: 10, y: 119, energy: testConfig.initialEnergy - testConfig.stepEnergyCost - testConfig.moveEnergyCost },
      { x: 10, y: 118, energy: testConfig.initialEnergy - 2 * (testConfig.stepEnergyCost + testConfig.moveEnergyCost) },
    ],
  },
  {
    label: 'always up and right',
    x: 10,
    y: 10,
    energy: testConfig.initialEnergy,
    genome: [
      { sourceId: 1, targetId: 66, weight: MAX_16_BIT_SIGNED_INTEGER },
      { sourceId: 1, targetId: 65, weight: MAX_16_BIT_SIGNED_INTEGER },
      dummyConnection,
      dummyConnection,
      dummyConnection,
    ],

    expect: [
      { x: 11, y: 11, energy: testConfig.initialEnergy - testConfig.stepEnergyCost - 2 * testConfig.moveEnergyCost },
      { x: 12, y: 12, energy: testConfig.initialEnergy - 2 * (testConfig.stepEnergyCost + 2 * testConfig.moveEnergyCost) },
    ],
  },
  {
    label: 'ded',
    x: 20,
    y: 20,
    energy: 0,
    genome: [
      { sourceId: 1, targetId: 66, weight: MAX_16_BIT_SIGNED_INTEGER },
      // invalid connection
      { sourceId: 1, targetId: 128, weight: 1 },
      dummyConnection,
      dummyConnection,
      dummyConnection,
    ],

    expect: [
      { x: 20, y: 20, energy: 0 },
      { x: 20, y: 20, energy: 0 },
    ],
  },
  {
    label: 'eating food',
    x: 15,
    y: 15,
    energy: Math.floor(0.01 * MAX_16_BIT_INTEGER),
    genome: [
      { sourceId: 1, targetId: 65, weight: MAX_16_BIT_SIGNED_INTEGER },
      dummyConnection,
      dummyConnection,
      dummyConnection,
      dummyConnection,
    ],

    expect: [
      { x: 16, y: 15, energy: testConfig.initialEnergy - testConfig.stepEnergyCost - testConfig.moveEnergyCost + testConfig.foodNutrition },
      { x: 17, y: 15, energy: testConfig.initialEnergy - 2 * (testConfig.stepEnergyCost + testConfig.moveEnergyCost) + 2 * testConfig.foodNutrition },
    ],
  },
  {
    label: 'trying to eat food too',
    x: 16,
    y: 13, // start 2p away from food to avoid being in the same spot as 'eating food' creature
    energy: Math.floor(0.01 * MAX_16_BIT_INTEGER),
    genome: [
      { sourceId: 1, targetId: 66, weight: MAX_16_BIT_SIGNED_INTEGER },
      dummyConnection,
      dummyConnection,
      dummyConnection,
      dummyConnection,
    ],

    expect: [
      { x: 16, y: 14, energy: testConfig.initialEnergy - testConfig.stepEnergyCost - testConfig.moveEnergyCost },
      { x: 16, y: 15, energy: testConfig.initialEnergy - 2 * (testConfig.stepEnergyCost + testConfig.moveEnergyCost) },
    ],
  },
];
export const testFood = [
  { x: 16, y: 15, energy: testConfig.foodNutrition },
  { x: 17, y: 15, energy: testConfig.foodNutrition },
  { x: 50, y: 50, energy: testConfig.foodNutrition },
];

console.log('config', testConfig);

export const createTestSimulator = () => {
  const simulator = createSimulator(testConfig, neuronsData, resultCondition);
  clearDataStorage(simulator.state.genomes);
  clearDataStorage(simulator.state.world);
  clearDataStorage(simulator.state.creaturesData);
  clearDataStorage(simulator.state.foodData);

  testCreatures.forEach((creature, index) => {
    simulator.state.creaturesData.alive[index + 1] = 1;
    simulator.state.creaturesData.x[index + 1] = creature.x;
    simulator.state.creaturesData.y[index + 1] = creature.y;
    simulator.state.world.creatures[getIndexFromCoordinates(
      simulator.state.creaturesData.x[index + 1],
      simulator.state.creaturesData.y[index + 1],
      testConfig.worldSizeX
    )] = index + 1;

    simulator.state.creaturesData.energy[index + 1] = creature.energy;

    creature.genome.forEach((gene, geneIndex) => {
      simulator.state.genomes.sourceId[(index + 1) * testConfig.genomeLength + geneIndex] =
        gene.sourceId;
      simulator.state.genomes.targetId[(index + 1) * testConfig.genomeLength + geneIndex] =
        gene.targetId;
      simulator.state.genomes.weight[(index + 1) * testConfig.genomeLength + geneIndex] =
        gene.weight;
    });

    const rawConnectionMap = getRawConnectionMap(index + 1, simulator.state.genomes, testConfig);

    const validNeurons = traverseOutputNeurons(simulator.neurons, rawConnectionMap);
    cleanGenome(index + 1, simulator.state.genomes, validNeurons, testConfig);

    let validNeuronIdIndex = 0;
    validNeurons.forEach((validNeuronId) => {
      simulator.state.creaturesData.validNeurons[
      (index + 1) * simulator.neurons.numberOfNeurons + validNeuronIdIndex++
        ] = validNeuronId;
    });
  });
  testFood.forEach((food, index) => {
    simulator.state.foodData.x[index + 1] = food.x;
    simulator.state.foodData.y[index + 1] = food.y;
    simulator.state.foodData.energy[index + 1] = food.energy;

    const worldIndex = food.y * testConfig.worldSizeX + food.x;
    simulator.state.world.food[worldIndex] = index + 1;
  });
  simulator.state.maxFoodIndex = testFood.length;
  simulator.state.numberOfFood = testFood.length;

  worldDataValidator(simulator.state.world, simulator.state.creaturesData, simulator.state.foodData, simulator.config);

  return simulator;
};
