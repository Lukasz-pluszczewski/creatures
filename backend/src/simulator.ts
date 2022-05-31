import swich from 'swich';
import cloneDeep from 'lodash.clonedeep';

import { MAX_16_BIT_INTEGER, OFFSPRING_NUMBER_CALCULATION_TYPES } from './constants';

import { iterateOverRange, times } from './arrayUtils';
import { calculateGraph } from './graphUtils';
import { createCreature } from './creatureUtils';
import { clamp, mapNumberToDifferentRange, randomInteger } from './numberUtils';
import { clearDataStorage, copyDataStorage, createFoodDataStorage, createPopulationDataStorage } from './memoryUtils';
import { doWithProbability } from './probabilityUtils';

import { saveToFile, time, timeEnd } from './debugUtils';

import { Config } from './config';
import {
  InputValues,
  NeuronsData,
  Simulator,
  WorldData
} from './types';
import { omitPick } from './objectUtils';

export const createSimulator = (
  config: Config,
  neurons: NeuronsData,
  resultCondition: Simulator['resultCondition']
): Simulator => {
  // creating storage for creatures data
  const { genomes, creaturesData } = createPopulationDataStorage(config, neurons);
  const { genomes: lastGenomes, creaturesData: lastCreaturesData } = createPopulationDataStorage(config, neurons);

  // creating storage for food data
  const foodData = createFoodDataStorage(config);

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
  iterateOverRange(1, config.population, index => {
    createCreature({
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
  let foodIndex = 0;
  times(config.worldSizeX * config.worldSizeY, index => {
    if (foodIndex < config.foodLimit && Math.random() < config.foodDensity) {
      foodData.x[foodIndex] = index % config.worldSizeX;
      foodData.y[foodIndex] = Math.floor(index / config.worldSizeX);
      foodData.energy[foodIndex] = config.foodNutrition;
      world.food[index] = foodIndex;
      foodIndex++;
    }
  });

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
      maxFoodIndex: foodIndex - 1,
      generation: 0,
      step: 0,
    },
    cloneState: <
      TOmit extends keyof Simulator['state'] = never,
      TPick extends keyof Simulator['state'] = keyof Simulator['state']
    >({ omit, pick }: { omit?: TOmit[], pick?: TPick[] } = {}): Omit<Pick<Simulator['state'], TPick>, TOmit> => {
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
        clonedState[key] = structuredClone(simulator.state[key]);
      });

      return clonedState as Omit<Pick<Simulator['state'], TPick>, TOmit>;
    },
    getStepCached: (key: string, getter: () => any) => {
      simulator.stepCache[key] = (key in simulator.stepCache) ? simulator.stepCache[key] : getter();
      return simulator.stepCache[key];
    },
    getGenerationCached: (key: string, getter: () => any) => {
      simulator.generationCache[key] = (key in simulator.generationCache) ? simulator.generationCache[key] : getter();
      return simulator.generationCache[key];
    },
    moveCreature: (creatureIndex: number, x: number, y: number) => {
      const currentX = simulator.state.creaturesData.x[creatureIndex];
      const currentY = simulator.state.creaturesData.y[creatureIndex];
      const currentWorldIndex = currentY * config.worldSizeX + currentX;

      const newX = clamp(currentX + x, 0, config.worldSizeX - 1);
      const newY = clamp(currentY + y, 0, config.worldSizeY - 1);
      const newWorldIndex = newY * config.worldSizeX + newX;

      // in the future we will prevent two creatures from being in the same coordinates
      // if (simulator.state.world.creatures[newY * config.worldSizeX + newX]) {
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
        simulator.state.creaturesData.energy[creatureIndex] += clamp(foodEnergy, 0, config.maximumEnergy);

        simulator.state.world.food[newWorldIndex] = 0;
        simulator.state.foodData.x[newCoordinateFoodIndex] = 0;
        simulator.state.foodData.y[newCoordinateFoodIndex] = 0;
        simulator.state.foodData.energy[newCoordinateFoodIndex] = 0;
      }
    },
    simulateStep: () => {
      time('step');
      // stats
      let creaturesNumber = 0;
      let creaturesWithEnergy = 0;
      const timeStart = performance.now();

      let creatureIndex = 1;
      // there are no neurons with id = 0, so we assume that index with sourceId = 0 is just empty
      while (creaturesData.alive[creatureIndex] && creatureIndex <= config.populationLimit) {
        time('Step creature');
        creaturesNumber++;
        if (creaturesData.energy[creatureIndex] <= 0) {
          // console.log('wat?', creatureIndex, creaturesData.energy[creatureIndex]);
          creatureIndex++;

          timeEnd('Step creature');
          continue;
        }
        creaturesWithEnergy++;

        creaturesData.energy[creatureIndex] =
          clamp(creaturesData.energy[creatureIndex] - config.stepEnergyCost, 0, config.maximumEnergy);

        time('Step 1');
        const inputValues = sensorsData(creatureIndex, config, simulator);
        timeEnd('Step 1');
        time('Step 2');
        const outputValues = calculateGraph(creatureIndex, inputValues, simulator);
        timeEnd('Step 2');

        time('Step 3');
        Object.entries(outputValues).forEach(([neuronId, outputValue]) => {
          const outputNeuron = simulator.neurons.neuronMap[parseInt(neuronId)];
          outputNeuron.act(outputValue, creatureIndex, config, simulator);
        });
        timeEnd('Step 3');

        timeEnd('Step creature');
        creatureIndex++;
      }
      if (config.stepLogFrequency && !(simulator.state.step % config.stepLogFrequency)) {
        time('Step 4');
        simulator.generationsHistory[simulator.state.generation] =
          simulator.generationsHistory[simulator.state.generation] || {
            stepHistory: [],
            timeStart: 0,
            timeEnd: 0,
            totalOffspring: 0,
            creaturesNumber,
            totalEnergy: 0,
            state: simulator.cloneState({ pick: ['genomes', 'lastGenomes'] }),
          };

        simulator.generationsHistory[simulator.state.generation].stepHistory[simulator.state.step] = {
          timeStart,
          timeEnd: performance.now(),
          creaturesNumber,
          creaturesWithEnergy,
          state: simulator.cloneState({ omit: ['genomes', 'lastGenomes'] }),
        };
        timeEnd('Step 4');
      }


      timeEnd('step');
      simulator.state.step++;
      simulator.stepCache = {};
    },

    simulateGeneration: () => {
      time('1');
      // stats
      let totalEnergy = 0;
      const timeStart = performance.now();

      // simulating
      times(config.generationLength, (step) => {
        if (simulator.state.step <= step) {
          simulator.simulateStep();
        }
      });
      timeEnd('1');

      time('2');
      // moving creatures to "previous generation" storage
      copyDataStorage(simulator.state.genomes, simulator.state.lastGenomes);
      copyDataStorage(simulator.state.creaturesData, simulator.state.lastCreaturesData);
      copyDataStorage(simulator.state.world, simulator.state.lastWorld);
      timeEnd('2');

      time('3');
      // clearing up current generation to make room for next one
      clearDataStorage(simulator.state.genomes);
      clearDataStorage(simulator.state.creaturesData);
      clearDataStorage(simulator.state.world);
      timeEnd('3');

      time('4');
      let creatureIndex = 1;
      let newCreatureIndex = 1;
      while (simulator.state.lastCreaturesData.alive[creatureIndex] && creatureIndex <= config.populationLimit) {
        totalEnergy += simulator.state.lastCreaturesData.energy[creatureIndex];
        const {
          reproductionProbability,
        } = resultCondition(creatureIndex, simulator.state.lastCreaturesData, config, simulator);
        doWithProbability(reproductionProbability, () => {
          const numberOfOffspring = swich([
            [OFFSPRING_NUMBER_CALCULATION_TYPES.RANDOM, () =>
              randomInteger(config.minNumberOfOffspring, config.maxNumberOfOffspring)],
            [OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY, () =>
              mapNumberToDifferentRange(
                clamp(simulator.state.lastCreaturesData.energy[creatureIndex], 0, Math.floor(0.1 * MAX_16_BIT_INTEGER)),
                0,
                Math.floor(0.1 * MAX_16_BIT_INTEGER),
                config.minNumberOfOffspring,
                config.maxNumberOfOffspring,
              )],
          ])(config.offspringCalculationType);

          times(numberOfOffspring, () => {
            if (newCreatureIndex > config.populationLimit) {
              return;
            }
            createCreature({
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
      timeEnd('4');

      time('5');
      // repopulating
      if (newCreatureIndex === 1 && config.repopulateWhenPopulationDiesOut) {
        iterateOverRange(1, config.populationLimit, (index) => {
          createCreature({
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
      timeEnd('5');

      time('6');
      // stats
      if (config.generationLogFrequency && !(simulator.state.step % config.generationLogFrequency)) {
        simulator.generationsHistory[simulator.state.generation].timeStart = timeStart;
        simulator.generationsHistory[simulator.state.generation].timeEnd = performance.now();
        simulator.generationsHistory[simulator.state.generation].totalOffspring = newCreatureIndex - 1;
        simulator.generationsHistory[simulator.state.generation].creaturesNumber =
          simulator.generationsHistory[simulator.state.generation].stepHistory[0].creaturesNumber;
        simulator.generationsHistory[simulator.state.generation].totalEnergy = totalEnergy;
        simulator.generationsHistory[simulator.state.generation].state =
          simulator.cloneState({ pick: ['genomes', 'lastGenomes'] });
      }

      simulator.generationCache = {};
      simulator.state.generation++;
      simulator.state.step = 0;
      timeEnd('6');
    }
  };

  return simulator;
};

const sensorsData = (creatureIndex: number, config: Config, simulator: Simulator): InputValues => {
  const inputValues: InputValues = {};
  // TODO calculate only valid input neurons (should be minor improvement)
  simulator.neurons.inputNeurons.forEach((inputNeuron) => {
    time(`sensor ${inputNeuron.label}`);
    const { id, getValue } = inputNeuron;
    if (getValue) {
      inputValues[id] = getValue(creatureIndex, config, simulator);
    }
    timeEnd(`sensor ${inputNeuron.label}`);
  });

  return inputValues;
};
