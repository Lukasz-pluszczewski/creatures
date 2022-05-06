import { nanoid } from 'nanoid';

import { Config } from './config';

import { createArray } from './arrayUtils';
import { buildGene, mutateGene, parseGene, randomGene } from './geneUtils';
import { randomInteger } from './numberUtils';
import { cleanGenome, getRawConnectionMap, traverseOutputNeurons } from './graphUtils';

import { Creature, Genome, SimulationNeurons } from './types';

// import { testGenome } from './testEntities';

export const createCreature = (
  neurons: SimulationNeurons,
  config: Config,
  parent?: Creature,
): Creature => {
  const rawGenome = (() => {
    if (parent) {
      return parent.genome.map(gene => mutateGene(gene, config));
    }
    return createArray(config.genomeLength)
      .map(randomGene(neurons, config));
  })();

  // const rawGenome = testGenome;

  const parsedRawGenome = rawGenome.map(parseGene);
  const rawConnectionMap = getRawConnectionMap(parsedRawGenome);
  const validNeurons = traverseOutputNeurons(neurons.outputNeurons, rawConnectionMap);
  const validGenome = cleanGenome(parsedRawGenome, validNeurons);

  const creature: Creature = {
    id: nanoid(),
    genome: validGenome.map(gene => buildGene(...gene)),
    parsedGenome: validGenome,
    validNeurons,
    x: randomInteger(0, config.worldSizeX),
    y: randomInteger(0, config.worldSizeY),
    neuronsState: {},
  };
  if (parent) {
    const { ancestors, ...rest } = parent;
    creature.ancestors = [rest, ...(parent.ancestors || [])];
  }

  return creature;
};
