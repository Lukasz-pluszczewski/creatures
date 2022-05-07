import simpleExpress from 'simple-express-framework';
import { Config, config } from './config';
import { generateNeurons } from './neuronsUtils';
import { createSimulator } from './simulator';
import { Creature } from './types';
import { genomeToColor } from './colorUtils';
import { createArray } from './arrayUtils';
import { clamp, mapNumberToDifferentRange } from './numberUtils';
import { getAllFood } from './worldUtils';

const neurons = generateNeurons(config);

console.log('Starting...');
Object.entries(config).forEach(([value, key]) => {
  console.log(`${key}: ${value}`);
});
console.log(`Input neurons (${neurons.inputNeurons.length}):`);
neurons.inputNeurons.forEach(neuron => console.log(`    ${neuron.id}: ${neuron.label}`));
console.log(`Internal neurons (${neurons.internalNeurons.length}):`);
neurons.internalNeurons.forEach(neuron => console.log(`    ${neuron.id}: ${neuron.label}`));
console.log(`Output neurons (${neurons.outputNeurons.length}):`);
neurons.outputNeurons.forEach(neuron => console.log(`    ${neuron.id}: ${neuron.label}`));

const resultCondition = (creature: Creature, config: Config, creatures: Creature[]) => {
  // const rightWallDistance = (config.worldSizeX - creature.x) / config.worldSizeX;
  // const leftWallDistance = creature.x / config.worldSizeX;
  // const topWallDistance = (config.worldSizeY - creature.y) / config.worldSizeY;
  // const bottomWallDistance = creature.y / config.worldSizeY;
  // const distanceFromCenter = Math.sqrt(
  //   Math.pow(creature.x - config.worldSizeX / 2, 2) +
  //   Math.pow(creature.y - config.worldSizeY / 2, 2),
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
    clamp(creature.creatureState.energy, 0, 1),
    0,
    1,
    0.1,
    1
  );

  // console.log('rep prob:', creature.creatureState.energy, reproductionProbability);
  return {
    survivalProbability: 0,
    reproductionProbability,
  };
};

let simulator: ReturnType<typeof createSimulator>;
const newSimulator = () => {
  simulator = createSimulator(
    config,
    neurons,
    resultCondition
  );
};
newSimulator();


simpleExpress({
  port: 8080,
  routes: [
    ['/', {
      get: () => {
        // const creaturesGenomeVariation = calculateGenomeDiffVariation(simulator.creatures);
        const creaturesGenomeVariation = { min: 0, max: 1 };

        const getCreatureView = (creature: Creature) => ({
          ...creature,
          color: genomeToColor(creature.genome, creaturesGenomeVariation),
          genome: creature.parsedGenome,
          parsedGenome: undefined,
          ancestors: creature.ancestors
            ? creature.ancestors.map(ancestor => ({
              ...ancestor,
              genome: ancestor.parsedGenome,
              parsedGenome: undefined,
            }))
            : undefined,
        });

        return ({
          status: 200,
          body: {
            config,
            step: simulator.generation,
            generation: simulator.generation,
            food: getAllFood(simulator.world),
            neurons: neurons,
            history: simulator.history,
            lastGenerationCreatures: simulator.lastGenerationCreatures.map(getCreatureView),
            lastGenerationSteps: simulator.lastGenerationSteps,
            creatures: simulator.creatures.map(getCreatureView)
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
