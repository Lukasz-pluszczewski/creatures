import simpleExpress from 'simple-express-framework';
import { Config, config } from './config';
import { generateNeurons } from './neuronsUtils';
import { createSimulator } from './simulator';
import { Simulator } from './types';
import { createArray } from './arrayUtils';
import { clamp, mapNumberToDifferentRange } from './numberUtils';
import { MAX_16_BIT_INTEGER } from './constants';

const neuronsData = generateNeurons(config);

console.log('Starting...');
Object.entries(config).forEach(([value, key]) => {
  console.log(`${key}: ${value}`);
});
console.log(`Input neurons (${neuronsData.inputNeurons.length}):`);
neuronsData.inputNeurons.forEach(neuron => console.log(`    ${neuron.id}: ${neuron.label}`));
console.log(`Internal neurons (${neuronsData.internalNeurons.length}):`);
neuronsData.internalNeurons.forEach(neuron => console.log(`    ${neuron.id}: ${neuron.label}`));
console.log(`Output neurons (${neuronsData.outputNeurons.length}):`);
neuronsData.outputNeurons.forEach(neuron => console.log(`    ${neuron.id}: ${neuron.label}`));

const resultCondition = (creatureIndex: number, config: Config, simulator: Simulator) => {
  // const x = simulator.state.creaturesData.x[creatureIndex];
  // const y = simulator.state.creaturesData.y[creatureIndex];
  const energy = simulator.state.creaturesData.energy[creatureIndex];

  // const rightWallDistance = (config.worldSizeX - x) / config.worldSizeX;
  // const leftWallDistance = x / config.worldSizeX;
  // const topWallDistance = (config.worldSizeY - y) / config.worldSizeY;
  // const bottomWallDistance = y / config.worldSizeY;
  // const distanceFromCenter = Math.sqrt(
  //   Math.pow(x - config.worldSizeX / 2, 2) +
  //   Math.pow(y - config.worldSizeY / 2, 2),
  // );

  // const reproductionProbability = distanceFromCenter < 40 ? 1 : 0;
  // const reproductionProbability = 1 - mapNumberToDifferentRange(
  //   clamp(distanceFromCenter, 0, 20),
  //   0,
  //   20,
  //   0,
  //   1
  // );
  const reproductionProbability = mapNumberToDifferentRange(
    clamp(energy, 0, Math.floor(0.1 * MAX_16_BIT_INTEGER)),
    0,
    Math.floor(0.1 * MAX_16_BIT_INTEGER),
    0,
    1
  );

  return { reproductionProbability };
};

let simulator: Simulator;
const newSimulator = () => {
  simulator = createSimulator(
    config,
    neuronsData,
    resultCondition
  );
};
newSimulator();


simpleExpress({
  port: 8080,
  routes: [
    ['/', {
      get: () => {
        const getCreatureView = (creatureId) => {
          const x = simulator.state.creaturesData.x[creatureId];
          const y = simulator.state.creaturesData.y[creatureId];
          const energy = simulator.state.creaturesData.energy[creatureId];
          const additionalData = simulator.state.creaturesData.additionalData[creatureId];

          return {
            x,
            y,
            energy,
            additionalData,
          };
        };
        // TODO: create something frontend-readable from typed arrays


        // const getCreatureView = (creature: Creature) => ({
        //   ...creature,
        //   color: genomeToColor(creature.genome, creaturesGenomeVariation),
        //   genome: creature.parsedGenome,
        //   parsedGenome: undefined,
        //   ancestors: creature.ancestors
        //     ? creature.ancestors.map(ancestor => ({
        //       ...ancestor,
        //       genome: ancestor.parsedGenome,
        //       parsedGenome: undefined,
        //     }))
        //     : undefined,
        // });

        return ({
          status: 200,
          body: {
            config,
            step: simulator.state.step,
            generation: simulator.state.generation,
            // food: getAllFood(simulator.world),
            neurons: neuronsData,
            history: simulator.generationsHistory,
          },
        });
      },
      delete: () => {
        newSimulator();
        return {
          status: 200,
          body: { message: 'OK' },
        };
      },
    }],
    ['/step', {
      post: () => {
        simulator.simulateStep();
        return {
          status: 200,
          body: { message: 'OK' },
        };
      },
    }],
    ['/generation', {
      post: () => {
        simulator.simulateGeneration();
        return {
          status: 200,
          body: { message: 'OK' },
        };
      },
    }],
    ['/generation/:number', {
      post: ({ params: { number } }) => {
        let timeStart = performance.now();
        console.time(`Simulated ${number} generations`);
        createArray(parseInt(number)).forEach((__, index) => {
          if (performance.now() - timeStart > 10000) {
            console.log(`Simulated ${index} generations`);
            timeStart = performance.now();
          }
          simulator.simulateGeneration();
        });
        console.timeEnd(`Simulated ${number} generations`);

        return {
          status: 200,
          body: { message: 'OK' },
        };
      },
    }]
  ],
});
