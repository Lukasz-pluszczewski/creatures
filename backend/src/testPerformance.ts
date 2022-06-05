import {
  MAX_16_BIT_INTEGER,
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID, MIN_OUTPUT_NEURON_ID,
  OFFSPRING_NUMBER_CALCULATION_TYPES
} from './constants';
import { Config } from './config';
import { generateNeurons } from './neuronsUtils';
import { CreaturesData, Simulator } from './types';
import { createSimulator } from './simulator';
import { time, timeEnd, getTimeStats, setEnableLogs, clearTimeStats, getTimer } from './debugUtils';
import { clearDataStorage } from './memoryUtils';


const internalNeurons = 10;
export const config = {
  population: 100,
  generationLength: 1000,
  genomeLength: 100,
  internalNeurons,
  worldSizeX: 128,
  worldSizeY: 128,

  offspringCalculationType: OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY,
  minNumberOfOffspring: 1,
  maxNumberOfOffspring: 1,

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

  stepLogFrequency: 0, // n % stepLogFrequency === 0 => log n-th step; 0 => logging disabled; first step is always logged
  generationStepsLogFrequency: 0, // n % generationStepsLogFrequency === 0 => log steps for n-th generation; 0 => logging disabled; first generation is always logged
  generationGenomeLogFrequency: 0, // n % generationLogFrequency === 0 => log genome for n-th generation; 0 => logging disabled; first generation is always logged
} as unknown as Config;
const neuronsData = generateNeurons(config);

config.maxInputNeuronId = MIN_INPUT_NEURON_ID + neuronsData.inputNeuronsIds.length - 1;
config.maxInternalNeuronId = MIN_INTERNAL_NEURON_ID + neuronsData.internalNeuronsIds.length - 1;
config.maxOutputNeuronId = MIN_OUTPUT_NEURON_ID + neuronsData.outputNeuronsIds.length - 1;

const resultCondition = (creatureIndex: number, creaturesData: CreaturesData, config: Config, simulator: Simulator) => {
  return { reproductionProbability: 1 };
};

const performanceTestParams = {
  generationsToSimulate: 100,
  enableTimers: true,
};

const clearSimulatorMemory = (simulator: Simulator) => {
  clearDataStorage(simulator.state.creaturesData);
  clearDataStorage(simulator.state.foodData);
  clearDataStorage(simulator.state.genomes);
  clearDataStorage(simulator.state.world);
  clearDataStorage(simulator.state.lastCreaturesData);
  clearDataStorage(simulator.state.lastWorld);
  clearDataStorage(simulator.state.lastGenomes);
  simulator.generationsHistory = [];
};

export const runPerformanceTest = async () => {
  console.log('Starting performance test');
  console.log('  Generations to simulate:', performanceTestParams.generationsToSimulate);
  console.log('  Simulating with timers enabled:', performanceTestParams.enableTimers);

  console.log('');
  console.log('# Config:');
  console.log(config);
  console.log('');

  if (performanceTestParams.enableTimers) {
    console.log('Starting performance test with timers...');
    setEnableLogs(true);
    const simulator = await createSimulator(config, neuronsData, resultCondition);

    const generationsTimes = {};
    time('Whole simulation (with timer)');
    for (let i = 0; i < performanceTestParams.generationsToSimulate; i++) {
      time('Simulating generation (with timer)');
      await simulator.simulateGeneration();
      generationsTimes[i] = timeEnd('Simulating generation (with timer)');
    }
    timeEnd('Whole simulation (with timer)');

    console.log('# Results with timers:');
    console.log(getTimeStats(
      { msPerGeneration: performanceTestParams.generationsToSimulate },
      { countPerGeneration: performanceTestParams.generationsToSimulate }
    ));
    console.log('');
    console.log('# Generations times:');
    console.log(generationsTimes);
    clearTimeStats();
    clearSimulatorMemory(simulator);

    console.log('');
    console.log('');
  } else {
    console.log('Starting performance test without timers...');
    setEnableLogs(false);
    const { time, timeEnd, getTimeStats } = getTimer();
    const simulator = await createSimulator(config, neuronsData, resultCondition);

    const generationsTimes = {};
    time('Whole simulation (with timer)');
    for (let i = 0; i < performanceTestParams.generationsToSimulate; i++) {
      time('Simulating generation (with timer)');
      await simulator.simulateGeneration();
      generationsTimes[i] = timeEnd('Simulating generation (with timer)');
    }
    timeEnd('Whole simulation (with timer)');

    console.log('# Results without timers:');
    console.log(getTimeStats());
    console.log('');
    console.log('# Generations times:');
    console.log(generationsTimes);
    clearSimulatorMemory(simulator);

    console.log('');
    console.log('');
  }

  console.log('Finished performance test');
  process.exit();
};

runPerformanceTest();
