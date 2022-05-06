import { generateNeurons } from './neuronsUtils';
import { config } from './config';
import { createCreature } from './creatureUtils';
import { Creature, Gene } from './types';
import { logCreature } from './debugUtils';
import { genomeToColor } from './colorUtils';
import { parseGene } from './geneUtils';
import { getRawConnectionMap, traverseOutputNeurons } from './graphUtils';

describe('createCreature', () => {
  const neurons = generateNeurons(config);
  it('generates child based on parent', () => {
    const genome = [ 104923083 as Gene, 71313818 as Gene, 104944134 as Gene, 104981818 as Gene, 104900323 as Gene ];
    const parsedGenome = genome.map(parseGene);

    const rawConnectionMap = getRawConnectionMap(parsedGenome);
    const validNeurons = traverseOutputNeurons(neurons.outputNeurons, rawConnectionMap);

    const creature: Creature = {
      id: 'NV_04o4JsnoWFypB36Azo',
      genome,
      parsedGenome: genome.map(parseGene),
      validNeurons,
      x: 33,
      y: 13,
      neuronsState: {}
    }

    const child = createCreature(
      neurons,
      config,
      creature,
    );

    logCreature({ ...creature, id: 'Parent' });
    logCreature({ ...child, id: 'Child' });
    console.log('color', genomeToColor(child.genome, { min: 0.4, max: 0.7 }));
  });
});
