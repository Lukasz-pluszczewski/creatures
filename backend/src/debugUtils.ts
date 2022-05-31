import fs from 'fs';
import { iterateOverRange, sample, times } from './arrayUtils';
import { Config, config } from './config';
import { Simulator } from './types';

export const saveToFile = (name, data) => {
  return fs.writeFileSync(`./${name}.json`, JSON.stringify(data, null, 2));
};

export const time = (label) => config.enableLogs ? console.time(label) : null;
export const timeEnd = (label) => config.enableLogs ? console.timeEnd(label) : null;

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
