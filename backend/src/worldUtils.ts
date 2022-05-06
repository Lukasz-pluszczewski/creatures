import { Config } from './config';
import { Creature, World } from './types';
import { createArray } from './arrayUtils';

export const createEmptyWorld = (config: Config): World => {
  return createArray(config.worldSizeX + 1).map(() => createArray(config.worldSizeY + 1).map(() => null));
};

export const addCreature = (world, creature: Creature) => {
  if (world[creature.x][creature.y] !== null) {
    throw new Error('Cannot add creature to occupied cell');
  }
  world[creature.x][creature.y] = { id: creature.id };

  return world;
};

export const removeCreature = (world, creature: Creature) => {
  world[creature.x][creature.y] = null;

  return world;
};

export const getCreature = (world, x, y) => {
  return world[x][y];
};
