import { Config } from './config';

import { createArray, times } from './arrayUtils';
import { calculateGraph } from './graphUtils';
import { createCreature } from './creatureUtils';

import { Creature, InputValues, Neuron, SimulationNeurons, SimulationStats, Simulator, World } from './types';
import { clamp } from './numberUtils';
import { addCreature, createEmptyWorld, getCreature, removeCreature } from './worldUtils';


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
  };

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
  };

  simulator.simulateStep = () => {
    const creaturesInStep = [];
    simulator.creatures.forEach(creature => {
      const inputValues = sensorsData(creature, config, simulator.neurons.inputNeurons, simulator.creatures);
      const outputValues = calculateGraph(inputValues, creature.parsedGenome, simulator.neurons, creature.validNeurons);

      Object.entries(outputValues).forEach(([neuronId, outputValue]) => {
        const outputNeuron = simulator.neurons.neuronMap[neuronId];
        outputNeuron.act(outputValue, creature, config, simulator);
      });

      creaturesInStep.push({ id: creature.id, x: creature.x, y: creature.y });
    });
    simulator.lastGenerationSteps.push(creaturesInStep);
    simulator.step++;
  };

  simulator.simulateGeneration = () => {
    simulator.lastGenerationCreatures = simulator.creatures;
    simulator.lastGenerationSteps = [];

    // simulating
    generationLength.forEach((__, step) => {
      if (simulator.step <= step) {
        simulator.simulateStep();
      }
    });

    const populationInGeneration = simulator.creatures.length;

    // calculating result and killing
    const creaturesThatReproduced = [];
    const newPopulation: Creature[] = [];
    simulator.creatures.forEach(creature => {
      const {
        reproductionProbability,
      } = resultCondition(creature, config, simulator.creatures);

      if (reproductionProbability > Math.random()) {
        creaturesThatReproduced.push(creature);
      }
    });

    // reproducing
    creaturesThatReproduced.forEach(creature => {
      const numberOfOffspring = clamp(
        Math.floor(config.population / creaturesThatReproduced.length),
        config.minNumberOfOffspring,
        config.maxNumberOfOffspring
      );
      times(numberOfOffspring, () => {
        if (newPopulation.length < config.populationLimit) {
          newPopulation.push(createCreature(
            neurons,
            config,
            creature,
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
    };
    simulator.history.push(stats);

    simulator.generation++;
    simulator.step = 0;
  };

  return simulator as Simulator;
};

const sensorsData = (creature: Creature, config: Config, inputNeurons: Neuron[], creatures: Creature[]): InputValues => {
  const inputValues: InputValues = {};
  inputNeurons.forEach((inputNeuron) => {
    const { id, getValue } = inputNeuron;
    if (getValue) {
      const sensorValue = getValue(creature, config, creatures);
      inputValues[id] = sensorValue;
    }
  });

  return inputValues;
};

