import { Config } from './config';

import { createArray, times } from './arrayUtils';
import { calculateGraph } from './graphUtils';
import { createCreature } from './creatureUtils';

import { Creature, InputValues, Neuron, SimulationNeurons } from './types';
import { clamp } from './numberUtils';

type Stats = {
  step: number,
  generation: number,
  reproduced: number,
};
type Simulator = {
  config: Config,
  neurons: SimulationNeurons,
  creatures: Creature[],
  simulateStep: () => void,
  simulateGeneration: () => void,
  step: number,
  generation: number,
  history: Stats[],
};
export const createSimulator = (
  config: Config,
  neurons: SimulationNeurons,
  resultCondition: (creature: Creature, config: Config, creatures: Creature[]) => ({ survivalProbability: number, reproductionProbability: number }),
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
  };

  simulator.creatures = createArray(config.population).map(() => createCreature(
    neurons,
    config,
  ));

  simulator.simulateStep = () => {
    simulator.creatures.forEach(creature => {
      const inputValues = sensorsData(creature, config, simulator.neurons.inputNeurons, simulator.creatures);
      const outputValues = calculateGraph(inputValues, creature.parsedGenome, simulator.neurons, creature.validNeurons);

      Object.entries(outputValues).forEach(([neuronId, outputValue]) => {
        const outputNeuron = simulator.neurons.neuronMap[neuronId];
        outputNeuron.act(outputValue, creature, config);
      });
    });
    simulator.step++;
  };

  simulator.simulateGeneration = () => {
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
      const {
        reproductionProbability,
      } = resultCondition(creature, config, simulator.creatures);

      if (reproductionProbability > Math.random()) {
        creaturesThatReproduced.push(creature);
      }
    });
    creaturesThatReproduced.forEach(creature => {
      const numberOfOffspring = clamp(
        Math.floor(config.population / creaturesThatReproduced.length),
        config.minNumberOfOffspring,
        config.maxNumberOfOffspring
      );
      times(numberOfOffspring, () => {
        newPopulation.push(createCreature(
          neurons,
          config,
          creature,
        ));
      });
    });

    // creating random creatures to keep the population size in each simulation step constant
    times(config.population - newPopulation.length, () => {
      newPopulation.push(createCreature(
        neurons,
        config,
      ));
    });
    simulator.creatures = newPopulation;


    const stats: Stats = {
      step: simulator.step,
      generation: simulator.generation,
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

