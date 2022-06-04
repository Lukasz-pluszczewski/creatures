// import stringSimilarity from 'string-similarity';
// import { createNumber, mapNumberToDifferentRange, toBinString } from './numberUtils';
// import { MIN_INPUT_NEURON_ID, MIN_OUTPUT_NEURON_ID, SOURCE_INPUT, TARGET_OUTPUT } from './constants';
// import { buildGene } from './geneUtils';
// import { Creature, Genome } from './types';
//
// /**
//  *
//  * @param h {number} 0 - 360
//  * @param s {number} 0 - 100
//  * @param l {number} 0 - 100
//  */
// export const hslToHex = (h: number, s: number, l: number) => {
//   l /= 100;
//   const a = s * Math.min(l, 1 - l) / 100;
//   const f = n => {
//     const k = (n + h / 30) % 12;
//     const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
//     return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
//   };
//   return `#${f(0)}${f(8)}${f(4)}`;
// };
//
// export const generateMinimalGene = () => {
//   const sourceType = createNumber(SOURCE_INPUT, 1);
//   const sourceId = createNumber(MIN_INPUT_NEURON_ID, 8);
//   const targetType = createNumber(TARGET_OUTPUT, 1);
//   const targetId = createNumber(MIN_OUTPUT_NEURON_ID, 8);
//   const weight = createNumber(Math.pow(2, 16) / 2, 16);
//
//   const gene = buildGene(
//     sourceType,
//     sourceId,
//     targetType,
//     targetId,
//     weight,
//   );
//
//   return toBinString(gene * 2 as any);
// };
// const minimalGene = generateMinimalGene();
//
// export const calculateGenomeDiffVariation = (creatures: Creature[]) => {
//   const results = { min: 1, max: 0 };
//   creatures.forEach((creature) => {
//     const genomeString = creature.genome.map(gene => toBinString(gene, 34)).join('');
//     const baseGenomeString = creature.genome.map(() => minimalGene).join('');
//     const diff = stringSimilarity.compareTwoStrings(genomeString, baseGenomeString);
//     // console.log('diff! ->', parseInt(genomeString, 2));
//     // console.log('diff!', diff);
//     results.min = Math.min(results.min, diff);
//     results.max = Math.max(results.max, diff);
//   });
//
//   return results;
// };
//
// export const genomeToColor = (genome: Genome, genomeDiffVariation: { min: number, max: number }) => {
//   const genomeString = genome.map(gene => toBinString(gene, 34)).join('');
//   const baseGenomeString = genome.map(() => minimalGene).join('');
//
//   const diff = stringSimilarity.compareTwoStrings(genomeString, baseGenomeString);
//
//   // console.log('genomeDiffVariation', genomeDiffVariation);
//   const mappedDiff = mapNumberToDifferentRange(diff, genomeDiffVariation.min, genomeDiffVariation.max, 0, 360);
//   const hue = mappedDiff;
//   const color = hslToHex(hue, 100, 50);
//
//   // console.log('genomeToColor', diff, mappedDiff, hue, color);
//
//   return color;
// };
