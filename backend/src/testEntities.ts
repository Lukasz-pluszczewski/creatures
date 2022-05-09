// import { Genome } from './types';
// import { buildGene } from './geneUtils';
// import { createNumber } from './numberUtils';

// export const testValidGenome: Genome = [
//   // connection from input neuron to internal neuron that in turn is connected to output - working connection
//   buildGene(
//     createNumber(0, 1),
//     createNumber(4, 8),
//     createNumber(1, 1),
//     createNumber(128, 8),
//     createNumber(2237, 16),
//   ),
//
//   // direct connections from input to output - working connections
//   buildGene(
//     createNumber(0, 1),
//     createNumber(4, 8),
//     createNumber(0, 1),
//     createNumber(65, 8),
//     createNumber(4241, 16),
//   ),
//   buildGene(
//     createNumber(0, 1),
//     createNumber(5, 8),
//     createNumber(0, 1),
//     createNumber(65, 8),
//     createNumber(19968, 16),
//   ),
//
//   // connection from internal neuron to output neuron - working connection
//   buildGene(
//     createNumber(1, 1),
//     createNumber(128, 8),
//     createNumber(0, 1),
//     createNumber(64, 8),
//     createNumber(28460, 16),
//   ),
//
//   // direct connection from input to output - working connection
//   buildGene(
//     createNumber(0, 1),
//     createNumber(3, 8),
//     createNumber(0, 1),
//     createNumber(64, 8),
//     createNumber(39572, 16),
//   ),
//
//   // valid connection to itself
//   buildGene(
//     createNumber(1, 1),
//     createNumber(128, 8),
//     createNumber(1, 1),
//     createNumber(128, 8),
//     createNumber(44332, 16),
//   ),
// ];
//
// export const testInvalidGenome: Genome = [
//   // duplicated connection from valid connections above
//   buildGene(
//     createNumber(0, 1),
//     createNumber(4, 8),
//     createNumber(1, 1),
//     createNumber(128, 8),
//     createNumber(30787, 16),
//   ),
//
//   // connection from input having only one connection to dead end internal neuron, rendering that input useless
//   buildGene(
//     createNumber(0, 1),
//     createNumber(4, 8),
//     createNumber(1, 1),
//     createNumber(130, 8),
//     createNumber(14801, 16),
//   ),
//
//   // connections from input having more connections to dead end internal neuron, connections are useless but input neurons are not
//   buildGene(
//     createNumber(0, 1),
//     createNumber(5, 8),
//     createNumber(1, 1),
//     createNumber(132, 8),
//     createNumber(58333, 16),
//   ),
//   buildGene(
//     createNumber(0, 1),
//     createNumber(2, 8),
//     createNumber(1, 1),
//     createNumber(130, 8),
//     createNumber(14801, 16),
//   ),
//
//   // connection from internal neuron without any other connections - useless connection
//   buildGene(
//     createNumber(1, 1),
//     createNumber(129, 8),
//     createNumber(0, 1),
//     createNumber(64, 8),
//     createNumber(57312, 16),
//   ),
//
//   // 2 connections from internal neuron without any other connections - useless and duplicated connections
//   buildGene(
//     createNumber(1, 1),
//     createNumber(131, 8),
//     createNumber(0, 1),
//     createNumber(65, 8),
//     createNumber(54332, 16),
//   ),
//   buildGene(
//     createNumber(1, 1),
//     createNumber(131, 8),
//     createNumber(0, 1),
//     createNumber(65, 8),
//     createNumber(10241, 16),
//   ),
// ];
//
// export const testGenome: Genome = [
//   ...testValidGenome,
//   ...testInvalidGenome,
// ];
