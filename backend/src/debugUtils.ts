import fs from 'fs';
import { getIndexFromCoordinates, iterateOverRange, sample, times } from './arrayUtils';
import { Config } from './config';
import { CreaturesData, FoodData, Simulator, WorldData } from './types';
import { getGenomesView } from './objectUtils';

export const saveToFile = (name, data) => {
  return fs.writeFileSync(`./${name}.json`, JSON.stringify(data, null, 2));
};

export const getTimer = ({ enableLogs = true } = {}) => {
  const timer = {
    enableLogs,
    timerState: {},
    timeStats: {} as Record<string, { total: number, count: number }>,
    setEnableLogs: (enable: boolean) => timer.enableLogs = enable,
    time: (label: string) => {
      if (!timer.enableLogs) {
        return;
      }
      if (timer.timerState[label]) {
        throw new Error(`Timer "${label}" already started (${performance.now() - timer.timerState[label]}ms ago)`);
      }
      return timer.timerState[label] = performance.now();
    },
    timeEnd: (label: string) => {
      if (!timer.enableLogs) {
        return;
      }
      if (!timer.timerState[label]) {
        throw new Error(`Timer "${label}" not started`);
      }
      const time = performance.now() - timer.timerState[label];
      timer.timeStats[label] = timer.timeStats[label] || { total: 0, count: 0 };
      timer.timeStats[label].total += time;
      timer.timeStats[label].count++;
      delete timer.timerState[label];

      return time;
    },
    getTimeStats: (
      additionalTimeAverages: Record<string, number> = {},
      additionalCountAverages: Record<string, number> = {}
    ) => {
      return Object.entries(timer.timeStats).reduce((accu, [key, value]) => {
        accu[key] = {
          ...value,
          average: value.total / value.count,
          perSecond: 1000 * value.count / value.total,
          ...(Object.entries(additionalTimeAverages).reduce((accu, [name, count]) => {
            accu[name] = value.total / count;
            return accu;
          }, {})),
          ...(Object.entries(additionalCountAverages).reduce((accu, [name, count]) => {
            accu[name] = value.count / count;
            return accu;
          }, {})),
        };

        return accu;
      }, {})
    },
    clearTimeStats: () => {
      Object.keys(timer.timeStats).forEach(key => {
        delete timer.timeStats[key];
      });
    }
  };

  return timer;
};
export const timer = getTimer();
export const setEnableLogs = timer.setEnableLogs;
export const time = timer.time;
export const timeEnd = timer.timeEnd;
export const getTimeStats = timer.getTimeStats;
export const clearTimeStats = timer.clearTimeStats;

export const once = cb => {
  if (!once.state.triggered) {
    once.state.triggered = true;
    return cb();
  }
};
once.state = { triggered: false };
once.reset = () => once.state.triggered = false;

export const genomeValidator = (creaturesData, genomes, config) => {
  const genomesView = getGenomesView(creaturesData, genomes, config);
  genomesView.forEach(genome => {
    genome.forEach(gene => {
      if (!gene.targetId) {
        throw new Error('gene.targetId is 0');
      }
      if (!gene.sourceId) {
        throw new Error('gene.sourceId is 0');
      }
    })
  })
};

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

  iterateOverRange(1, config.foodLimit, index => {
    if (!foodData.energy[index]) {
      return;
    }

    const x = foodData.x[index];
    const y = foodData.y[index];
    if (x < 0 || x >= config.worldSizeX || y < 0 || y >= config.worldSizeY) {
      throw new Error(`Food out of world bounds (index: ${index}, x: ${x}, y: ${y})`);
    }

    const worldIndex = getIndexFromCoordinates(x, y, config.worldSizeX);
    if (world.food[worldIndex] !== index) {
      throw new Error(`Food not in world (index: ${index}, worldIndex: ${worldIndex}, x: ${x}, y: ${y}, foundInWorld: ${world.food[worldIndex]})`);
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

export const logNumberOfCreaturesAlive = (label: string, creaturesData: CreaturesData) => {
  let creatureIndex = 1;
  while(creaturesData.alive[creatureIndex]) {
    creatureIndex++;
  }

  console.log(label, creatureIndex - 1);

  return false;
};
