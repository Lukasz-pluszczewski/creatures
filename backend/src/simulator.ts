import { Config } from './config';

import { createArray, times } from './arrayUtils';
import { calculateGraph } from './graphUtils';
import { createCreature } from './creatureUtils';

import { Creature, InputValues, Neuron, SimulationNeurons, SimulationStats, Simulator, World } from './types';
import { clamp } from './numberUtils';
import {
  createEmptyWorld,
  getAllFood,
  getFood,
  populateWorldWithFood,
  removeFood
} from './worldUtils';


export const createSimulator = (
  config: Config,
  neurons: SimulationNeurons,
  resultCondition: (creature: Creature, config: Config, creatures: Creature[]) =>
    ({ survivalProbability: number, reproductionProbability: number }),
) => {
  const {
  } = config;

  const generationLength = createArray(config.generationLength);

  const simulator: Partial<Simulator> = {
    config,
    neurons,
    step: 0,
    generation: 0,
    history: [],
    lastGenerationCreatures: [],
    lastGenerationSteps: [],
    world: createEmptyWorld(config),
    stepCache: {},
  };

  simulator.world = populateWorldWithFood(simulator.world, config.foodDensity, config.foodNutrition);

  simulator.creatures = createArray(config.population).map(() => createCreature(
    neurons,
    config,
  ));

  simulator.moveCreature = (creature: Creature, deltaX: number, deltaY: number) => {
    let newX = creature.x;
    let newY = creature.y;
    if (deltaX > 0 && creature.x < config.worldSizeX) {
      newX = creature.x + deltaX;
    }
    if (deltaX < 0 && creature.x > 0) {
      newX = creature.x + deltaX;
    }
    if (deltaY > 0 && creature.y < config.worldSizeY) {
      newY = creature.y + deltaY;
    }
    if (deltaY < 0 && creature.y > 0) {
      newY = creature.y + deltaY;
    }
    // if (getCreature(simulator.world, newX, newY)) {
    //   if (!getCreature(simulator.world, creature.x, newY)) {
    //     newX = creature.x;
    //   } else if (!getCreature(simulator.world, newX, creature.y)) {
    //     newY = creature.y;
    //   } else {
    //     newX = creature.x;
    //     newY = creature.y;
    //   }
    // }
    // removeCreature(simulator.world, creature);
    creature.x = newX;
    creature.y = newY;
    // addCreature(simulator.world, creature);

    const food = getFood(simulator.world, creature.x, creature.y);
    if (food) {
      creature.creatureState.energy += food;
      removeFood(simulator.world, creature.x, creature.y);
    }

    creature.creatureState.energy -= config.moveEnergyCost;
  };

  simulator.simulateStep = () => {
    const creaturesInStep = [];
    simulator.creatures.forEach(creature => {
      if (creature.creatureState.energy <= 0) {
        return;
      }
      creature.creatureState.energy -= config.stepEnergyCost;
      const inputValues = sensorsData(creature, config, simulator as Simulator);
      const outputValues = calculateGraph(inputValues, creature.parsedGenome, simulator.neurons, creature.validNeurons);

      Object.entries(outputValues).forEach(([neuronId, outputValue]) => {
        const outputNeuron = simulator.neurons.neuronMap[neuronId];
        outputNeuron.act(outputValue, creature, config, simulator);
      });

      creaturesInStep.push({ id: creature.id, x: creature.x, y: creature.y, energy: creature.creatureState.energy });
    });
    simulator.lastGenerationSteps.push({ creatures: creaturesInStep, food: getAllFood(simulator.world) });
    simulator.step++;
    simulator.stepCache = {};
  };

  simulator.simulateGeneration = () => {
    simulator.lastGenerationCreatures = simulator.creatures;
    simulator.lastGenerationSteps = [];

    // stats
    const populationInGeneration = simulator.creatures.length;
    let totalEnergy = 0;
    let totalOffspring = 0;

    // simulating
    generationLength.forEach((__, step) => {
      if (simulator.step <= step) {
        simulator.simulateStep();
      }
    });



    // calculating result and killing
    const creaturesThatReproduced = [];
    const newPopulation: Creature[] = [];
    simulator.creatures.forEach(creature => {
      totalEnergy += creature.creatureState.energy;
      const {
        reproductionProbability,
      } = resultCondition(creature, config, simulator.creatures);

      if (reproductionProbability > Math.random()) {
        creaturesThatReproduced.push(creature);
      }
    });

    // reproducing

    // conventional reproduction where number of offspring depends on the general population
    // creaturesThatReproduced.forEach(creature => {
    //   const numberOfOffspring = clamp(
    //     Math.floor(config.population / creaturesThatReproduced.length),
    //     config.minNumberOfOffspring,
    //     config.maxNumberOfOffspring
    //   );
    //   times(numberOfOffspring, () => {
    //     if (newPopulation.length < config.populationLimit) {
    //       newPopulation.push(createCreature(
    //         neurons,
    //         config,
    //         creature,
    //       ));
    //     }
    //   });
    // });

    // energy based reproduction
    creaturesThatReproduced.forEach(creature => {
      const inputValues = sensorsData(creature, config, simulator as Simulator);
      const outputValues = calculateGraph(inputValues, creature.parsedGenome, simulator.neurons, creature.validNeurons);

      const reproduceValue = outputValues[neurons.reproduceNeuronId];
      const numberOfOffspring = clamp(Math.ceil(reproduceValue), 1, config.maxNumberOfOffspring);
      times(numberOfOffspring, () => {
        if (newPopulation.length < config.populationLimit) {
          totalOffspring++;
          newPopulation.push(createCreature(
            neurons,
            config,
            creature,
            // creature.energy / numberOfOffspring,
            // creature.energy,
          ));
        }
      });
    });


    // creating random creatures to keep the population size in each simulation step constant
    if (config.keepPopulationConstant) {
      times(config.population - newPopulation.length, () => {
        newPopulation.push(createCreature(
          neurons,
          config,
        ));
      });
    }
    if (!newPopulation.length && config.repopulateWhenPopulationDiesOut) {
      times(config.population, () => {
        newPopulation.push(createCreature(
          neurons,
          config,
        ));
      });
    }
    simulator.creatures = newPopulation;


    const stats: SimulationStats = {
      step: simulator.step,
      generation: simulator.generation,
      populationInGeneration,
      reproduced: creaturesThatReproduced.length,
      averageEnergy: totalEnergy / populationInGeneration,
      averageOffspring: totalOffspring / creaturesThatReproduced.length,
    };
    simulator.history.push(stats);

    simulator.generation++;
    simulator.step = 0;

    // regrowing food
    if (getAllFood(simulator.world).length < config.foodLimit) {
      simulator.world = populateWorldWithFood(simulator.world, config.foodDensity, config.foodNutrition);
    }
  };

  simulator.getStepCached = (key: string, getter: () => any) => {
    simulator.stepCache[key] = (key in simulator.stepCache) ? simulator.stepCache[key] : getter();
    return simulator.stepCache[key];
  };

  return simulator as Simulator;
};

const sensorsData = (creature: Creature, config: Config, simulator: Simulator): InputValues => {
  const inputValues: InputValues = {};
  simulator.neurons.inputNeurons.forEach((inputNeuron) => {
    const { id, getValue } = inputNeuron;
    if (getValue) {
      const sensorValue = getValue(creature, config, simulator);
      inputValues[id] = sensorValue;
    }
  });

  return inputValues;
};

