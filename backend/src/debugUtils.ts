import fs from 'fs';
import { getIndexFromCoordinates, iterateOverRange, sample, times } from './arrayUtils';
import { Config, config } from './config';
import { CreaturesData, FoodData, Simulator, WorldData } from './types';

export const saveToFile = (name, data) => {
  return fs.writeFileSync(`./${name}.json`, JSON.stringify(data, null, 2));
};

export const time = (label) => config.enableLogs ? console.time(label) : null;
export const timeEnd = (label) => config.enableLogs ? console.timeEnd(label) : null;

export const once = cb => {
  if (!once.state.triggered) {
    once.state.triggered = true;
    return cb();
  }
};
once.state = { triggered: false };
once.reset = () => once.state.triggered = false;

export const worldDataValidator = (world: WorldData, creaturesData: CreaturesData, foodData: FoodData, config: Config) => {
  let creatureIndex = 1;
  while (creaturesData.alive[creatureIndex]) {
    const x = creaturesData.x[creatureIndex];
    const y = creaturesData.y[creatureIndex];
    if (x < 0 || x >= config.worldSizeX || y < 0 || y >= config.worldSizeY) {
      throw new Error(`Creature out of world bounds (index: ${creatureIndex}, x: ${x}, y: ${y})`);
    }

    // we don't validate world creatures because for now there can be two creatures in the same place
    // const worldIndex = getIndexFromCoordinates(x, y, config.worldSizeX);
    // if (world.creatures[worldIndex] !== creatureIndex) {
    //   throw new Error(`Creature not in world (index: ${creatureIndex}, worldIndex: ${worldIndex}, x: ${x}, y: ${y}, foundInWorld: ${world.creatures[worldIndex]})`);
    // }
    creatureIndex++;
  }

  times(config.foodLimit, index => {
    if (!foodData.energy[index + 1]) {
      return;
    }
    const x = foodData.x[index + 1];
    const y = foodData.y[index + 1];
    if (x < 0 || x >= config.worldSizeX || y < 0 || y >= config.worldSizeY) {
      throw new Error(`Food out of world bounds (index: ${index + 1}, x: ${x}, y: ${y})`);
    }

    const worldIndex = getIndexFromCoordinates(x, y, config.worldSizeX);
    if (world.food[worldIndex] !== (index + 1)) {
      throw new Error(`Food not in world (index: ${index + 1}, worldIndex: ${worldIndex}, x: ${x}, y: ${y}, foundInWorld: ${world.food[worldIndex]})`);
    }
  });

  times(config.worldSizeX * config.worldSizeY, index => {
    const x = index % config.worldSizeX;
    const y = Math.floor(index / config.worldSizeX);

    if (world.food[index]) {
      const foodIndex = world.food[index];
      if (foodData.x[foodIndex] !== x || foodData.y[foodIndex] !== y) {
        throw new Error(`Unknown food in world (index: ${foodIndex}, worldIndex: ${index}, x: ${x}, y: ${y})`);
      }
    }

    if (world.creatures[index]) {
      const creatureIndex = world.creatures[index];
      if (creaturesData.x[creatureIndex] !== x || creaturesData.y[creatureIndex] !== y) {
        throw new Error(`Unknown creature in world (index: ${creatureIndex}, worldIndex: ${index}, x: ${x}, y: ${y})`);
      }
    }
  });
};

export const analyzeCreatures = (config: Config, simulator: Simulator) => {
  const stats = {
    creaturesWithNoValidGenes: [],
    validCreaturesWithFirstGeneInvalid: [],
    creaturesWithSomeInvalidGenes: [],
    creaturesWithValidGenes: [],
  };
  iterateOverRange(1, config.population, index => {
    let foundValidGene = false;
    let firstGeneValid = false;
    let foundInvalidGene = false;
    times(config.genomeLength, geneIndex => {
      if (
        simulator.state.genomes.sourceId[index * config.genomeLength + geneIndex]
        && simulator.state.genomes.targetId[index * config.genomeLength + geneIndex]
      ) {
        foundValidGene = true;
      }
      if (
        !geneIndex
          && simulator.state.genomes.sourceId[index * config.genomeLength + geneIndex]
          && simulator.state.genomes.targetId[index * config.genomeLength + geneIndex]
      ) {
        firstGeneValid = true;
      }


      if (!simulator.state.genomes.sourceId[index * config.genomeLength + geneIndex] || !simulator.state.genomes.targetId[index * config.genomeLength + geneIndex]) {
        foundInvalidGene = true;
      }
    });

    if (foundValidGene) {
      if (!firstGeneValid) {
        stats.validCreaturesWithFirstGeneInvalid.push(index);
      }
      stats.creaturesWithValidGenes.push(index);
    } else {
      stats.creaturesWithNoValidGenes.push(index);
    }

    if (foundInvalidGene) {
      stats.creaturesWithSomeInvalidGenes.push(index);
    }
  });

  return stats;
};
