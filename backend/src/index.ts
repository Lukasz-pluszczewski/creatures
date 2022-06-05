import simpleExpress from 'simple-express-framework';
import { Config, getConfig } from './config';
import { generateNeurons } from './neuronsUtils';
import { createSimulator } from './simulator';
import { CreaturesData, Simulator } from './types';
import { timesAsync } from './arrayUtils';
import { clamp, mapNumberToDifferentRange } from './numberUtils';
import { getCreaturesDataView, getFoodDataView, getGenomesView } from './objectUtils';
import { genomeValidator } from './debugUtils';

(async () => {
  const config = getConfig();

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
    const x = simulator.state.lastCreaturesData.x[creatureIndex];
    const y = simulator.state.lastCreaturesData.y[creatureIndex];
    const energy = creaturesData.energy[creatureIndex];

    // const rightWallDistance = (config.worldSizeX - x) / config.worldSizeX;
    // const leftWallDistance = x / config.worldSizeX;
    // const topWallDistance = (config.worldSizeY - y) / config.worldSizeY;
    // const bottomWallDistance = y / config.worldSizeY;
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - config.worldSizeX / 2, 2) +
      Math.pow(y - config.worldSizeY / 2, 2),
    );

    // -- reproduction prop base on distance from the wall --
    // const reproductionProbability = mapNumberToDifferentRange(
    //   clamp(leftWallDistance, 0, 0.1),
    //   0,
    //   0.1,
    //   1,
    //   0
    // );

    // -- reproduction prop based on distance from center --
    // const reproductionProbability = distanceFromCenter < 40 ? 1 : 0;
    const reproductionPositionProbability = mapNumberToDifferentRange(
      clamp(distanceFromCenter, 0, 90),
      0,
      90,
      1,
      0
    );

    // -- reproduction prop based on energy --
    // const reproductionEnergyProbability = mapNumberToDifferentRange(
    //   clamp(energy, 0, config.maximumEnergy),
    //   0,
    //   config.maximumEnergy,
    //   0,
    //   1
    // );

    // -- reproduction prop based on energy (binary) --
    // const reproductionProbability = energy > 0 ? 1 : 0;

    // console.log(`Reproducing gen: ${simulator.state.generation}; creature: ${creatureIndex}; energy ${energy}; reprodProb`,reproductionProbability);
    return { reproductionProbability: reproductionPositionProbability };
  };

  let simulator: Simulator;
  const newSimulator = async () => {
    simulator = await createSimulator(
      config,
      neuronsData,
      resultCondition
    );

    await simulator.simulateGeneration();
  };
  await newSimulator();

  const simulateGenerations = async (number: number) => {
    let timeStart = performance.now();
    let lastTime = timeStart;
    let lastIndex = 0;
    console.time(`Simulated ${number} generations`);
    await timesAsync(number, async index => {
      const now = performance.now();
      if (now - lastTime > 10000) {
        console.log(`Simulated ${index} generations in ${(now - lastTime).toFixed(2)}ms (${((index - lastIndex) * 1000 / (now - lastTime)).toFixed(2)} per second; total: ${(now - timeStart).toFixed(2)}ms)`);
        lastTime = now;
        lastIndex = index;
      }

      await simulator.simulateGeneration();
    });
    console.timeEnd(`Simulated ${number} generations`);
    console.log(`(ave: ${(number * 1000 / (performance.now() - timeStart)).toFixed(2)} per second)`);
  };

  simpleExpress({
    port: 8080,
    routes: [
      ['/', {
        get: () => {
          const creaturesDataView = getCreaturesDataView(simulator.state.creaturesData, simulator.neurons);
          const genomesView = getGenomesView(simulator.state.creaturesData, simulator.state.genomes, simulator.config);

          const results = {
            config,
            current: {
              creaturesData: creaturesDataView,
              genomes: genomesView,
              generation: simulator.state.generation,
              step: simulator.state.step,
            },
            neurons: neuronsData,
            generations: simulator.generationsHistory.map((generation, index) => ({
              totalEnergy: generation.totalEnergy,
              creaturesNumber: generation.creaturesNumber,
              totalOffspring: generation.totalOffspring,
              numberOfCreaturesWithOffspring: generation.numberOfCreaturesWithOffspring,
              timeStart: generation.timeStart,
              timeEnd: generation.timeEnd,
            })),
          };

          return ({
            status: 200,
            body: results,
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
          simulateGenerations(1);
          return {
            status: 200,
            body: { message: 'OK' },
          };
        },
      }],
      ['/generation/:number', {
        post: ({ params: { number } }) => {
          simulateGenerations(parseInt(number, 10));
          return {
            status: 200,
            body: { message: 'OK' },
          };
        },
        get: ({ params: { number } }) => {
          if (!simulator.generationsHistory[number]) {
            return {
              status: 404,
              body: { message: 'Not found' },
            };
          }
          genomeValidator(
            simulator.generationsHistory[number].state.creaturesData,
            simulator.generationsHistory[number].state.genomes,
            simulator.config,
          )
          const generation = simulator.generationsHistory[number];

          return {
            status: 200,
            body: {
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
              numberOfCreaturesWithOffspring: generation.numberOfCreaturesWithOffspring,
              timeStart: generation.timeStart,
              timeEnd: generation.timeEnd,
              state: generation.state
                ? {
                  genomes: getGenomesView(
                    generation.state.creaturesData,
                    generation.state.genomes,
                    config
                  ),
                  creaturesData: generation?.state?.creaturesData
                    ? getCreaturesDataView(generation.state.creaturesData, simulator.neurons)
                    : null,
                }
                : null,
            }
          };
        },
      }]
    ],
  });
})();
