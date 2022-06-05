import swich from 'swich';
import cloneDeep from 'lodash.clonedeep';

import { MAX_16_BIT_INTEGER, OFFSPRING_NUMBER_CALCULATION_TYPES } from './constants';

import { forEachAsync, iterateOverRange, iterateOverRangeAsync, times, timesAsync } from './arrayUtils';
import { calculateGraph } from './graphUtils';
import { createCreature } from './creatureUtils';
import { clamp, mapNumberToDifferentRange, randomInteger } from './numberUtils';
import {
  clearDataStorage,
  cloneDataStorage,
  copyDataStorage,
  createFoodDataStorage,
  createPopulationDataStorage
} from './memoryUtils';
import { doWithProbability, doWithProbabilityAsync } from './probabilityUtils';

import { analyzeCreatures, genomeValidator, time, timeEnd, worldDataValidator } from './debugUtils';

import { Config } from './config';
import {
  InputValues,
  NeuronsData,
  Simulator,
  WorldData
} from './types';
import { growFood, regrowFood } from './foodUtils';

export const createSimulator = async (
  config: Config,
  neurons: NeuronsData,
  resultCondition: Simulator['resultCondition']
): Promise<Simulator> => {
  // creating storage for creatures data
  const { genomes, creaturesData } = await createPopulationDataStorage(config, neurons);
  const { genomes: lastGenomes, creaturesData: lastCreaturesData } = await createPopulationDataStorage(config, neurons);

  // creating storage for food data
  const foodData = await createFoodDataStorage(config);

  // creating world data with creatures and food positions
  const world: WorldData = {
    creatures: new Uint16Array(config.worldSizeX * config.worldSizeY),
    food: new Uint16Array(config.worldSizeX * config.worldSizeY),
  };
  const lastWorld: WorldData = {
    creatures: new Uint16Array(config.worldSizeX * config.worldSizeY),
    food: new Uint16Array(config.worldSizeX * config.worldSizeY),
  }

  // creating creatures
  iterateOverRangeAsync(1, config.population, async index => {
    await createCreature({
      index,
      parentIndex: null,
      genomes,
      creaturesData,
      lastGenomes,
      lastCreaturesData,
      world,
      neurons,
      config,
    })
  });

  // creating food
  const maxFoodIndex = await growFood(foodData, world, config);

  const simulator: Simulator = {
    neurons,
    config,
    resultCondition,
    generationsHistory: [],
    stepCache: {},
    generationCache: {},
    state: {
      genomes,
      creaturesData,
      world,
      lastGenomes,
      lastCreaturesData,
      lastWorld,
      foodData,
      maxFoodIndex,
      numberOfFood: maxFoodIndex,
      generation: 0,
      step: 0,
    },
    cloneState: async <
      TOmit extends keyof Simulator['state'] = never,
      TPick extends keyof Simulator['state'] = keyof Simulator['state']
    >({ omit, pick }: { omit?: TOmit[], pick?: TPick[] } = {}): Promise<Omit<Pick<Simulator['state'], TPick>, TOmit>> => {
      const omitMap = omit && omit.length ? omit.reduce((acc, key) => ({ ...acc, [key]: true }), {}) : null;
      const pickMap = pick && pick.length ? pick.reduce((acc, key) => ({ ...acc, [key]: true }), {}) : null;

      const clonedState = {};
      Object.keys(simulator.state).forEach(key => {
        if (pickMap && !pickMap[key]) {
          return;
        }
        if (omitMap && omitMap[key]) {
          return;
        }
        clonedState[key] = cloneDataStorage(simulator.state[key]);
      });

      return clonedState as Omit<Pick<Simulator['state'], TPick>, TOmit>;
    },
    getStepCached: async (key: string, getter: () => any) => {
      simulator.stepCache[key] = (key in simulator.stepCache) ? simulator.stepCache[key] : getter();
      return simulator.stepCache[key];
    },
    getGenerationCached: async (key: string, getter: () => any) => {
      simulator.generationCache[key] = (key in simulator.generationCache) ? simulator.generationCache[key] : getter();
      return simulator.generationCache[key];
    },
    moveCreature: async (creatureIndex: number, x: number, y: number) => {
      const currentX = simulator.state.creaturesData.x[creatureIndex];
      const currentY = simulator.state.creaturesData.y[creatureIndex];
      const currentWorldIndex = currentY * config.worldSizeX + currentX;

      const newX = clamp(currentX + x, 0, config.worldSizeX - 1);
      const newY = clamp(currentY + y, 0, config.worldSizeY - 1);
      const newWorldIndex = newY * config.worldSizeX + newX;

      // in the future we will prevent two creatures from being in the same coordinates
      // if (simulator.state.world.creatures[newWorldIndex]) {
      //   return;
      // }

      if (newWorldIndex === currentWorldIndex) {
        return;
      }

      simulator.state.creaturesData.energy[creatureIndex] =
        clamp(simulator.state.creaturesData.energy[creatureIndex] - config.moveEnergyCost, 0, config.maximumEnergy);

      simulator.state.creaturesData.x[creatureIndex] = newX;
      simulator.state.creaturesData.y[creatureIndex] = newY;

      simulator.state.world.creatures[newWorldIndex] = creatureIndex;
      if (simulator.state.world.creatures[currentWorldIndex] === creatureIndex) {
        simulator.state.world.creatures[currentWorldIndex] = 0;
      }

      const newCoordinateFoodIndex = simulator.state.world.food[newWorldIndex];
      if (newCoordinateFoodIndex) {
        const foodEnergy = simulator.state.foodData.energy[newCoordinateFoodIndex];
        simulator.state.creaturesData.energy[creatureIndex] = clamp(
          foodEnergy + simulator.state.creaturesData.energy[creatureIndex],
          0,
          config.maximumEnergy
        );

        // simulator.state.world.food[newWorldIndex] = 0;
        // simulator.state.foodData.x[newCoordinateFoodIndex] = 0;
        // simulator.state.foodData.y[newCoordinateFoodIndex] = 0;
        simulator.state.foodData.energy[newCoordinateFoodIndex] = 0;

        simulator.state.numberOfFood--;
      }
    },
    simulateStep: async (generationStepLoggingEnabled = true) => {
      time('Step');
      // stats
      let creaturesNumber = 0;
      let creaturesWithEnergy = 0;
      const timeStart = performance.now();

      time('Simulating creatures');
      let creatureIndex = 1;
      // there are no neurons with id = 0, so we assume that index with sourceId = 0 is just empty
      while (creaturesData.alive[creatureIndex] && creatureIndex <= config.populationLimit + 1) {
        creaturesNumber++;
        if (creaturesData.energy[creatureIndex] <= 0) {
          // console.log('wat?', creatureIndex, creaturesData.energy[creatureIndex]);
          creatureIndex++;

          continue;
        }
        time('Simulating creature');
        creaturesWithEnergy++;

        creaturesData.energy[creatureIndex] =
          clamp(creaturesData.energy[creatureIndex] - config.stepEnergyCost, 0, config.maximumEnergy);

        time('Calculating sensors data');
        const inputValues = await sensorsData(creatureIndex, config, simulator);
        timeEnd('Calculating sensors data');
        time('Calculating graph');
        const outputValues = await calculateGraph(creatureIndex, inputValues, simulator);
        timeEnd('Calculating graph');

        time('Acting');
        await forEachAsync(Object.entries(outputValues), async ([neuronId, outputValue]) => {
          const outputNeuron = simulator.neurons.neuronMap[parseInt(neuronId)];
          return outputNeuron.act(outputValue, creatureIndex, config, simulator);
        });
        timeEnd('Acting');

        timeEnd('Simulating creature');
        creatureIndex++;
      }
      timeEnd('Simulating creatures');
      time('Logging step');
      simulator.generationsHistory[simulator.state.generation] =
        simulator.generationsHistory[simulator.state.generation] || {
          stepHistory: [],
          timeStart: 0,
          timeEnd: 0,
          totalOffspring: 0,
          creaturesNumber,
          totalEnergy: 0,
          state: config.generationGenomeLogFrequency && !(simulator.state.generation % config.generationGenomeLogFrequency)
            ? await simulator.cloneState({ pick: ['genomes', 'lastGenomes', 'creaturesData'] })
            : null,
        };

      const logStepState = generationStepLoggingEnabled && config.stepLogFrequency && !(simulator.state.step % config.stepLogFrequency);
      simulator.generationsHistory[simulator.state.generation].stepHistory[simulator.state.step] = {
        timeStart,
        timeEnd: performance.now(),
        creaturesNumber,
        creaturesWithEnergy,
        state: !simulator.state.step || logStepState
          ? await simulator.cloneState({ omit: ['genomes', 'lastGenomes'] })
          : null,
      };
      timeEnd('Logging step');

      time('Regrowing food');
      if (simulator.state.numberOfFood < config.foodRegrowLimit) {
        simulator.state.numberOfFood += await regrowFood(foodData, world, config, simulator.state.maxFoodIndex);
      }
      timeEnd('Regrowing food');


      timeEnd('Step');
      simulator.state.step++;
      simulator.stepCache = {};
    },

    simulateGeneration: async () => {
      console.log('Simulating generation', simulator.state.generation);
      time('Gathering generation stats 1');
      // stats
      let totalEnergy = 0;
      const timeStart = performance.now();
      const logGenerationState = config.generationGenomeLogFrequency && !(simulator.state.generation % config.generationGenomeLogFrequency);
      const clonedState = !simulator.state.generation || logGenerationState
        ? await simulator.cloneState({ pick: ['genomes', 'lastGenomes', 'creaturesData'] })
        : null;
      timeEnd('Gathering generation stats 1');

      time('Simulating generation steps');
      // simulating
      const logGenerationSteps = config.generationStepsLogFrequency && !(simulator.state.generation % config.generationStepsLogFrequency);
      await timesAsync(config.generationLength, async step => {
        if (simulator.state.step <= step) {
          await simulator.simulateStep(!simulator.state.generation || logGenerationSteps);
        }
      });
      timeEnd('Simulating generation steps');

      time('Moving state to "previous generation" storage');
      // moving creatures to "previous generation" storage
      copyDataStorage(simulator.state.genomes, simulator.state.lastGenomes);
      copyDataStorage(simulator.state.creaturesData, simulator.state.lastCreaturesData);
      copyDataStorage(simulator.state.world, simulator.state.lastWorld);
      timeEnd('Moving state to "previous generation" storage');

      time('Clearing current state');
      // clearing up current generation to make room for next one
      clearDataStorage(simulator.state.genomes);
      clearDataStorage(simulator.state.creaturesData);
      clearDataStorage(simulator.state.world);
      clearDataStorage(simulator.state.foodData);
      timeEnd('Clearing current state');

      time('Reproducing creatures');
      let creatureIndex = 1;
      let newCreatureIndex = 1;
      let numberOfCreaturesWithOffspring = 0;
      while (simulator.state.lastCreaturesData.alive[creatureIndex] && creatureIndex <= config.populationLimit + 1) {
        totalEnergy += simulator.state.lastCreaturesData.energy[creatureIndex];
        const {
          reproductionProbability,
        } = resultCondition(creatureIndex, simulator.state.lastCreaturesData, config, simulator);

        await doWithProbabilityAsync(reproductionProbability, async () => {
          const numberOfOffspring = swich([
            [OFFSPRING_NUMBER_CALCULATION_TYPES.RANDOM, () =>
              randomInteger(config.minNumberOfOffspring, config.maxNumberOfOffspring)],
            [OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY, () =>
              mapNumberToDifferentRange(
                clamp(simulator.state.lastCreaturesData.energy[creatureIndex], 0, config.maximumEnergy),
                0,
                config.maximumEnergy,
                config.minNumberOfOffspring,
                config.maxNumberOfOffspring,
              )],
          ])(config.offspringCalculationType);
          if (numberOfOffspring) {
            numberOfCreaturesWithOffspring++;
          }

          await timesAsync(numberOfOffspring, async () => {
            if (newCreatureIndex > config.populationLimit) {
              return;
            }
            await createCreature({
              index: newCreatureIndex++,
              parentIndex: creatureIndex,
              genomes,
              creaturesData,
              lastGenomes,
              lastCreaturesData,
              world,
              neurons,
              config,
            });
          });
        });
        creatureIndex++;
      }
      timeEnd('Reproducing creatures');

      time('Growing food');
      const newNumberOfFood = await growFood(foodData, world, config);
      simulator.state.maxFoodIndex = simulator.state.numberOfFood = newNumberOfFood;
      timeEnd('Growing food');

      time('Repopulating creatures');
      // repopulating
      if (newCreatureIndex === 1 && config.repopulateWhenPopulationDiesOut) {
        await iterateOverRangeAsync(1, config.population, async index => {
          await createCreature({
            index,
            parentIndex: null,
            genomes,
            creaturesData,
            lastGenomes,
            lastCreaturesData,
            world,
            neurons,
            config,
          });
        })
      }
      timeEnd('Repopulating creatures');
      genomeValidator(simulator.state.creaturesData, simulator.state.genomes, simulator.config);

      time('Gathering generation stats 2');
      // stats

      simulator.generationsHistory[simulator.state.generation].timeStart = timeStart;
      simulator.generationsHistory[simulator.state.generation].timeEnd = performance.now();
      simulator.generationsHistory[simulator.state.generation].totalOffspring = newCreatureIndex - 1;
      simulator.generationsHistory[simulator.state.generation].numberOfCreaturesWithOffspring = numberOfCreaturesWithOffspring - 1;
      simulator.generationsHistory[simulator.state.generation].creaturesNumber =
        simulator.generationsHistory[simulator.state.generation].stepHistory[0].creaturesNumber;
      simulator.generationsHistory[simulator.state.generation].totalEnergy = totalEnergy;
      simulator.generationsHistory[simulator.state.generation].state = clonedState;

      if (logGenerationState) {
        genomeValidator(
          simulator.generationsHistory[simulator.state.generation].state.creaturesData,
          simulator.generationsHistory[simulator.state.generation].state.genomes,
          simulator.config,
        );
      }

      simulator.generationCache = {};
      simulator.state.generation++;
      simulator.state.step = 0;

      timeEnd('Gathering generation stats 2');
      if (newCreatureIndex === 1 && !config.repopulateWhenPopulationDiesOut) {
        return false;
      }
      return true;
    }
  };

  // generated creatures validation
  const {
    // creaturesWithNoValidGenes,
    // validCreaturesWithFirstGeneInvalid,
    // creaturesWithSomeInvalidGenes,
    creaturesWithValidGenes,
  } = analyzeCreatures(config, simulator);

  if (!creaturesWithValidGenes.length) {
    throw new Error('No creatures with at least one gene valid');
  }

  // world data validator
  worldDataValidator(simulator.state.world, simulator.state.creaturesData, simulator.state.foodData, simulator.config);

  return simulator;
};

const sensorsData = async (creatureIndex: number, config: Config, simulator: Simulator): Promise<InputValues> => {
  const inputValues: InputValues = {};
  // TODO calculate only valid input neurons (should be minor improvement)
  await forEachAsync(simulator.neurons.inputNeurons, async (inputNeuron) => {
    const { id, getValue } = inputNeuron;
    if (getValue) {
      inputValues[id] = await getValue(creatureIndex, config, simulator);
    }
  });

  return inputValues;
};
