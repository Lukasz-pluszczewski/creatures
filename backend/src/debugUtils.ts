import { Creature } from './types';
import { parseGene } from './geneUtils';
import { SOURCE_MAPPING } from './constants';
import { toBinString } from './numberUtils';

export const logCreature = (creature: Creature) => {
  let toLog = `Creature ${creature.id} {${creature.x}, ${creature.y}}`;
  creature.genome.map(gene => {
    const [
      sourceType,
      sourceId,
      targetType,
      targetId,
      weight,
    ] = parseGene(gene);
    toLog += `\n\t${toBinString(gene)}`;
    toLog += `\n\t${SOURCE_MAPPING[sourceType]}[${sourceId}] -> ${SOURCE_MAPPING[targetType]}[${targetId}] (${weight})`;
    toLog += '\n';
  });

  console.log(toLog);
};
