import swich from 'swich';
import cloneDeep from 'lodash.clonedeep';

import { MAX_16_BIT_INTEGER, OFFSPRING_NUMBER_CALCULATION_TYPES } from './constants';

import { iterateOverRange, times } from './arrayUtils';
import { calculateGraph } from './graphUtils';
import { createCreature } from './creatureUtils';
import { clamp, mapNumberToDifferentRange, randomInteger } from './numberUtils';
import { clearDataStorage, copyDataStorage, createFoodDataStorage, createPopulationDataStorage } from './memoryUtils';
import { doWithProbability } from './probabilityUtils';

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
    if (Math.random() < config.foodDensity) {
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
      generation: 0,
      step: 0,
    },
    cloneState: <
      TOmit extends keyof Simulator['state'] = never,
      TPick extends keyof Simulator['state'] = keyof Simulator['state']
    >({ omit, pick }: { omit?: TOmit[], pick?: TPick[] } = {}): Omit<Pick<Simulator['state'], TPick>, TOmit> => {
      const clonedState = omitPick(simulator.state, { omit, pick });
      Object.keys(clonedState).forEach(key => {
        clonedState[key] = cloneDeep(clonedState[key]);
      });

      return clonedState;
    },
    getStepCached: (key: string, getter: () => any) => {
      simulator.stepCache[key] = (key in simulator.stepCache) ? simulator.stepCache[key] : getter();
      return simulator.stepCache[key];
    },
    getGenerationCached: (key: string, getter: () => any) => {
      simulator.generationCache[key] = (key in simulator.generationCache) ? simulator.generationCache[key] : getter();
      return simulator.generationCache[key];
    },
    simulateStep: () => {
      // stats
      let creaturesNumber = 0;
      let creaturesWithEnergy = 0;

      let creatureIndex = 1;
      // there are no neurons with id = 0, so we assume that index with sourceId = 0 is just empty
      while (genomes.sourceId[creatureIndex * config.genomeLength] && creatureIndex <= config.populationLimit) {
        creaturesNumber++;
        if (creaturesData.energy[creatureIndex] <= 0) {
          return;
        }
        creaturesWithEnergy++;

        creaturesData.energy[creatureIndex] -= config.stepEnergyCost;
        const inputValues = sensorsData(creatureIndex, config, simulator);
        const outputValues = calculateGraph(creatureIndex, inputValues, simulator);

        Object.entries(outputValues).forEach(([neuronId, outputValue]) => {
          const outputNeuron = simulator.neurons.neuronMap[neuronId];
          outputNeuron.act(outputValue, creatureIndex, config, simulator);
        });

        creatureIndex++;
      }
      simulator.generationsHistory[simulator.state.generation] =
        simulator.generationsHistory[simulator.state.generation] || {
          stepHistory: [],
        };

      simulator.generationsHistory[simulator.state.generation].stepHistory[simulator.state.step] = {
        creaturesNumber,
        creaturesWithEnergy,
        state: simulator.state.step % config.stepLogFrequency
          ? null
          : simulator.cloneState({ omit: ['genomes', 'lastGenomes'] }),
      };

      simulator.state.step++;
      simulator.stepCache = {};
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

      simulator.state.creaturesData.x[creatureIndex] = newX;
      simulator.state.creaturesData.y[creatureIndex] = newY;

      simulator.state.world.creatures[newWorldIndex] = creatureIndex;
      if (simulator.state.world.creatures[currentWorldIndex] === creatureIndex) {
        simulator.state.world.creatures[currentWorldIndex] = 0;
      }

      const newCoordinateFoodIndex = simulator.state.world.food[newWorldIndex];
      if (newCoordinateFoodIndex) {
        const foodEnergy = simulator.state.foodData.energy[newCoordinateFoodIndex];
        simulator.state.creaturesData.energy[creatureIndex] += foodEnergy;

        simulator.state.world.food[newWorldIndex] = 0;
        simulator.state.foodData.x[newCoordinateFoodIndex] = 0;
        simulator.state.foodData.y[newCoordinateFoodIndex] = 0;
        simulator.state.foodData.energy[newCoordinateFoodIndex] = 0;
      }
    },
    simulateGeneration: () => {
      // stats
      let totalEnergy = 0;

      // simulating
      times(config.generationLength, (step) => {
        if (simulator.state.step <= step) {
          simulator.simulateStep();
        }
      });

      // moving creatures to "previous generation" storage
      copyDataStorage(simulator.state.genomes, simulator.state.lastGenomes);
      copyDataStorage(simulator.state.creaturesData, simulator.state.lastCreaturesData);
      copyDataStorage(simulator.state.world, simulator.state.lastWorld);

      // clearing up current generation to make room for next one
      clearDataStorage(simulator.state.genomes);
      clearDataStorage(simulator.state.creaturesData);
      clearDataStorage(simulator.state.world);

      let creatureIndex = 1;
      let newCreatureIndex = 1;
      while (genomes.sourceId[creatureIndex * config.genomeLength] && creatureIndex <= config.populationLimit) {
        totalEnergy += simulator.state.creaturesData.energy[creatureIndex];
        const {
          reproductionProbability,
        } = resultCondition(creatureIndex, config, simulator);

        doWithProbability(reproductionProbability, () => {
          const numberOfOffspring = swich([
            [OFFSPRING_NUMBER_CALCULATION_TYPES.RANDOM, () =>
              randomInteger(config.minNumberOfOffspring, config.maxNumberOfOffspring)],
            [OFFSPRING_NUMBER_CALCULATION_TYPES.FROM_ENERGY, () =>
              mapNumberToDifferentRange(
                clamp(simulator.state.creaturesData.energy[creatureIndex], 0, Math.floor(0.1 * MAX_16_BIT_INTEGER)),
                0,
                Math.floor(0.1 * MAX_16_BIT_INTEGER),
                config.minNumberOfOffspring,
                config.maxNumberOfOffspring,
              )],
          ])(config.offspringCalculationType);

          times(numberOfOffspring, () => {
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
      }

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

      // stats
      simulator.generationsHistory[simulator.state.generation].totalOffspring = newCreatureIndex - 1;
      simulator.generationsHistory[simulator.state.generation].creaturesNumber =
        simulator.generationsHistory[simulator.state.generation].stepHistory[0].creaturesNumber;
      simulator.generationsHistory[simulator.state.generation].totalEnergy = totalEnergy;
      simulator.generationsHistory[simulator.state.generation].state = simulator.state.step % config.stepLogFrequency
        ? null
        : simulator.cloneState({ pick: ['genomes', 'lastGenomes'] });

      simulator.generationCache = {};
      simulator.state.generation++;
      simulator.state.step = 0;
    }
  };

  return simulator;
};

const sensorsData = (creatureIndex: number, config: Config, simulator: Simulator): InputValues => {
  const inputValues: InputValues = {};
  simulator.neurons.inputNeurons.forEach((inputNeuron) => {
    const { id, getValue } = inputNeuron;
    if (getValue) {
      inputValues[id] = getValue(creatureIndex, config, simulator);
    }
  });

  return inputValues;
};
