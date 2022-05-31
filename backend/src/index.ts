import simpleExpress from 'simple-express-framework';
import cloneDeep from 'lodash.clonedeep';
import { Config, config } from './config';
import { generateNeurons } from './neuronsUtils';
import { createSimulator } from './simulator';
import { CreaturesData, Simulator } from './types';
import { createArray } from './arrayUtils';
import { clamp, mapNumberToDifferentRange } from './numberUtils';
import { MAX_16_BIT_INTEGER } from './constants';
import { getCreaturesDataView, getFoodDataView, getGenomesView } from './objectUtils';
import { analyzeCreatures } from './debugUtils';

const neuronsData = generateNeurons(config);

console.log('Starting...');
console.dir(config);
console.log(`Input neurons (${neuronsData.inputNeurons.length}):`);
neuronsData.inputNeurons.forEach(neuron => console.log(`  ${neuron.id}: ${neuron.label}`));
console.log(`Internal neurons (${neuronsData.internalNeurons.length}):`);
neuronsData.internalNeurons.forEach(neuron => console.log(`  ${neuron.id}: ${neuron.label}`));
console.log(`Output neurons (${neuronsData.outputNeurons.length}):`);
neuronsData.outputNeurons.forEach(neuron => console.log(`  ${neuron.id}: ${neuron.label}`));

const resultCondition = (creatureIndex: number, creaturesData: CreaturesData, config: Config, simulator: Simulator) => {
  // const x = simulator.state.creaturesData.x[creatureIndex];
  // const y = simulator.state.creaturesData.y[creatureIndex];
  const energy = creaturesData.energy[creatureIndex];

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
    clamp(energy, 0, config.maximumEnergy),
    0,
    config.maximumEnergy,
    0,
    1
  );

  // console.log(`Reproducing gen: ${simulator.state.generation}; creature: ${creatureIndex}; energy ${energy}; reprodProb`,reproductionProbability);
  return { reproductionProbability };
};

let simulator: Simulator;
const newSimulator = () => {
  simulator = createSimulator(
    config,
    neuronsData,
    resultCondition
  );

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

  simulator.simulateStep();
};
newSimulator();
// simulator.simulateGeneration();
// simulator.simulateGeneration();
// simulator.simulateGeneration();

simpleExpress({
  port: 8080,
  routes: [
    ['/', {
      get: () => {
        const creaturesDataView = getCreaturesDataView(simulator.state.creaturesData, simulator.neurons);
        const genomesView = getGenomesView(simulator.state.creaturesData, simulator.state.genomes, config);

        return ({
          status: 200,
          body: {
            config,
            current: {
              creaturesData: creaturesDataView,
              genomes: genomesView,
              generation: simulator.state.generation,
              step: simulator.state.step,
            },
            generations: simulator.generationsHistory.map((generation, index) => ({
              stepHistory: generation.stepHistory.map(step => ({
                creaturesData: step?.state?.creaturesData
                  ? getCreaturesDataView(step.state.creaturesData, simulator.neurons)
                  : null,
                foodData: step?.state?.foodData
                  ? getFoodDataView(step.state.foodData, simulator)
                  : null,
                creaturesNumber: step?.creaturesNumber,
                creaturesWithEnergy: step?.creaturesWithEnergy,
                timeStart: step?.timeStart,
                timeEnd: step?.timeEnd,
              })),
              totalEnergy: generation.totalEnergy,
              creaturesNumber: generation.creaturesNumber,
              totalOffspring: generation.totalOffspring,
              timeStart: generation.timeStart,
              timeEnd: generation.timeEnd,
              state: generation.state
                ? {
                  genomes: getGenomesView(
                    generation.stepHistory[0].state.creaturesData,
                    generation.state.genomes,
                    config
                  ),
                }
                : null,
            })),
            neurons: neuronsData,
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
        let lastTime = timeStart;
        let lastIndex = 0;
        console.time(`Simulated ${number} generations`);
        createArray(parseInt(number)).forEach((__, index) => {
          const now = performance.now();
          if (now - lastTime > 10000) {
            console.log(`Simulated ${index} generations in ${(now - lastTime).toFixed(2)}ms (${((index - lastIndex) * 1000 / (now - lastTime)).toFixed(2)} per second)`);
            lastTime = now;
            lastIndex = index;
          }
          console.log('Start generation', index);
          simulator.simulateGeneration();
          console.log('End generation', index);
        });
        console.timeEnd(`Simulated ${number} generations`);
        console.log(`(ave: ${(number * 1000 / (performance.now() - timeStart)).toFixed(2)} per second)`);

        return {
          status: 200,
          body: { message: 'OK' },
        };
      },
    }]
  ],
});
