import { Config } from './config';

import { getIndexFromCoordinates, sample, times } from './arrayUtils';
import { nonUniformRandomInteger, randomInteger, randomSign } from './numberUtils';
import { cleanGenome, getRawConnectionMap, traverseOutputNeurons } from './graphUtils';

import { CreaturesData, Genomes, NeuronsData, WorldData } from './types';
import { MAX_16_BIT_SIGNED_INTEGER } from './constants';
import { doWithProbability } from './probabilityUtils';

type CreateCreatureParams = {
  index: number,
  parentIndex: number | null,
  genomes: Genomes,
  creaturesData: CreaturesData,
  lastGenomes: Genomes,
  lastCreaturesData: CreaturesData,
  world: WorldData,
  neurons: NeuronsData,
  config: Config,
};
export const createCreature = (
  {
    index,
    parentIndex,
    genomes,
    creaturesData,
    lastGenomes,
    lastCreaturesData,
    world,
    neurons,
    config,
  }: CreateCreatureParams,
): void => {
  creaturesData.x[index] = randomInteger(0, config.worldSizeX);
  creaturesData.y[index] = randomInteger(0, config.worldSizeY);
  world.creatures[getIndexFromCoordinates(creaturesData.x[index], creaturesData.y[index], config.worldSizeX)] = index;

  creaturesData.energy[index] = config.initialEnergy;

  if (parentIndex === null) {
    // creating random genome
    times(config.genomeLength, geneIndex => {
      genomes.sourceId[index * config.genomeLength + geneIndex] =
        parseInt(sample(Object.keys(neurons.possibleConnectionsFrom)));
      genomes.targetId[index * config.genomeLength + geneIndex] =
        sample(neurons.possibleConnectionsFrom[genomes.sourceId[index * config.genomeLength + geneIndex]]);
      genomes.weight[index * config.genomeLength + geneIndex] = randomInteger(-32768, 32767);
    });
  } else {
    // mutating parent genome
    times(config.genomeLength, geneIndex => {
      const absoluteGenomeIndex = index * config.genomeLength + geneIndex;
      const parentAbsoluteGenomeIndex = parentIndex * config.genomeLength + geneIndex;

      // mutating sourceId
      doWithProbability(
        config.mutationProbabilityMatrix.sourceId,
        () => {
          const possibleSourceNeurons = Object.keys(neurons.possibleConnectionsFrom);
          const sourceNeuronIdIndex = possibleSourceNeurons.findIndex(sourceNeuronId =>
            parseInt(sourceNeuronId) === lastGenomes.sourceId[parentAbsoluteGenomeIndex]
          );
          const newSourceNeuronIdIndex = (
            sourceNeuronIdIndex + randomSign() * nonUniformRandomInteger(1, 10, 1 / 5)
          ) % possibleSourceNeurons.length;
          genomes.sourceId[absoluteGenomeIndex] =
            parseInt(possibleSourceNeurons[newSourceNeuronIdIndex]);
        },
        () => {
          genomes.sourceId[index * config.genomeLength + geneIndex] =
            lastGenomes.sourceId[parentAbsoluteGenomeIndex];
        }
      );

      // mutating targetId
      doWithProbability(
        config.mutationProbabilityMatrix.targetId,
        () => {
          const possibleTargetNeurons =
            neurons.possibleConnectionsFrom[genomes.sourceId[absoluteGenomeIndex]];
          const targetNeuronIdIndex = possibleTargetNeurons.findIndex(targetNeuronId =>
            targetNeuronId === lastGenomes.targetId[parentAbsoluteGenomeIndex]
          );
          const newTargetNeuronIdIndex = (
            targetNeuronIdIndex + nonUniformRandomInteger(1, 10, 1 / 5)
          ) % possibleTargetNeurons.length;
          genomes.sourceId[absoluteGenomeIndex] = possibleTargetNeurons[newTargetNeuronIdIndex];
        },
        () => {
          const possibleTargetNeurons =
            neurons.possibleConnectionsFrom[genomes.sourceId[index * config.genomeLength + geneIndex]];
          if (possibleTargetNeurons.includes(lastGenomes.targetId[parentAbsoluteGenomeIndex])) {
            genomes.targetId[absoluteGenomeIndex] = lastGenomes.targetId[parentAbsoluteGenomeIndex];
          } else {
            sample(neurons.possibleConnectionsFrom[genomes.sourceId[absoluteGenomeIndex]]);
          }
        }
      );

      // mutating weight
      doWithProbability(config.mutationProbabilityMatrix.weight,
        () => {
          genomes.weight[absoluteGenomeIndex] =
            lastGenomes.weight[parentIndex * config.genomeLength + geneIndex]
            + randomSign() * nonUniformRandomInteger(1, MAX_16_BIT_SIGNED_INTEGER, 1 / 10);
        },
        () => {
          genomes.weight[absoluteGenomeIndex] = lastGenomes.weight[parentAbsoluteGenomeIndex];
        }
      );
    });
  }

  const rawConnectionMap = getRawConnectionMap(index, genomes, config);
  const validNeurons = traverseOutputNeurons(neurons, rawConnectionMap);
  cleanGenome(index, genomes, validNeurons);

  // saving validNeurons
  validNeurons.forEach((validNeuronId, validNeuronIdIndex) => {
    creaturesData[index * neurons.numberOfNeurons + validNeuronIdIndex] = validNeuronId;
  });
};
