import { Config } from './config';

import { getIndexFromCoordinates, sample, times } from './arrayUtils';
import { clamp, nonUniformRandomInteger, randomInteger, randomSign } from './numberUtils';
import { cleanGenome, getRawConnectionMap, traverseOutputNeurons } from './graphUtils';

import { CreaturesData, Genomes, NeuronsData, WorldData } from './types';
import { MAX_16_BIT_SIGNED_INTEGER } from './constants';
import { doWithProbability } from './probabilityUtils';

export const isCreatureIndexValid = (creatureIndex: number, creaturesDataAlive: CreaturesData['alive']) =>
  !!creaturesDataAlive[creatureIndex];

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
  creaturesData.alive[index] = 1;
  creaturesData.x[index] = randomInteger(0, config.worldSizeX - 1);
  creaturesData.y[index] = randomInteger(0, config.worldSizeY - 1);
  world.creatures[getIndexFromCoordinates(creaturesData.x[index], creaturesData.y[index], config.worldSizeX)] = index;

  if (world.creatures[getIndexFromCoordinates(creaturesData.x[index], creaturesData.y[index], config.worldSizeX)] !== index) {
    throw new Error(`Incorrect index ${index}`);
  }


  creaturesData.energy[index] = config.initialEnergy;

  if (parentIndex === null) {
    // creating random genome
    times(config.genomeLength, geneIndex => {
      genomes.sourceId[index * config.genomeLength + geneIndex] =
        parseInt(sample(Object.keys(neurons.possibleConnectionsFrom)));

      if (!genomes.sourceId[index * config.genomeLength + geneIndex]) {
        throw new Error('No source neuron');
      }

      genomes.targetId[index * config.genomeLength + geneIndex] =
        sample(neurons.possibleConnectionsFrom[genomes.sourceId[index * config.genomeLength + geneIndex]]);
      genomes.weight[index * config.genomeLength + geneIndex] =
        randomInteger(-MAX_16_BIT_SIGNED_INTEGER - 1, MAX_16_BIT_SIGNED_INTEGER);
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
          if (lastGenomes.sourceId[parentAbsoluteGenomeIndex] && lastGenomes.validConnection[parentAbsoluteGenomeIndex]) {
            const sourceNeuronIdIndex = possibleSourceNeurons.findIndex(sourceNeuronId =>
              parseInt(sourceNeuronId) === lastGenomes.sourceId[parentAbsoluteGenomeIndex]
            );
            const newSourceNeuronIdIndex = clamp(
              (
                sourceNeuronIdIndex + randomSign() * nonUniformRandomInteger(1, 10, 1 / 5)
              ) % possibleSourceNeurons.length,
              0,
              possibleSourceNeurons.length - 1,
            );
            genomes.sourceId[absoluteGenomeIndex] =
              parseInt(possibleSourceNeurons[newSourceNeuronIdIndex]);
          } else {
            genomes.sourceId[absoluteGenomeIndex] =
              parseInt(sample(possibleSourceNeurons));
          }
        },
        () => {
          if (lastGenomes.sourceId[parentAbsoluteGenomeIndex] && lastGenomes.validConnection[parentAbsoluteGenomeIndex]) {
            genomes.sourceId[absoluteGenomeIndex] =
              lastGenomes.sourceId[parentAbsoluteGenomeIndex];
          } else {
            const possibleSourceNeurons = Object.keys(neurons.possibleConnectionsFrom);
            genomes.sourceId[absoluteGenomeIndex] =
              parseInt(sample(possibleSourceNeurons));
          }
        }
      );

      if (!genomes.sourceId[absoluteGenomeIndex]) {
        throw new Error('Source neuron is incorrect');
      }

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
          genomes.targetId[absoluteGenomeIndex] = possibleTargetNeurons[newTargetNeuronIdIndex];
        },
        () => {
          const possibleTargetNeurons =
            neurons.possibleConnectionsFrom[genomes.sourceId[absoluteGenomeIndex]];
          if (possibleTargetNeurons.includes(lastGenomes.targetId[parentAbsoluteGenomeIndex])) {
            genomes.targetId[absoluteGenomeIndex] = lastGenomes.targetId[parentAbsoluteGenomeIndex];
          } else {
            genomes.targetId[absoluteGenomeIndex] = sample(neurons.possibleConnectionsFrom[genomes.sourceId[absoluteGenomeIndex]]);
          }
        }
      );

      if (!genomes.targetId[absoluteGenomeIndex]) {
        throw new Error('Target neuron is incorrect');
      }

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
  cleanGenome(index, genomes, validNeurons, config);

  // if (validNeurons.size === 0) {
  //   throw new Error('Creature with no valid neurons');
  // }

  // saving validNeurons
  let validNeuronIdIndex = 0;
  validNeurons.forEach((validNeuronId) => {
    creaturesData.validNeurons[index * neurons.numberOfNeurons + validNeuronIdIndex++] = validNeuronId;
  });
};
