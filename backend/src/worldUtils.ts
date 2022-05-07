import { Config } from './config';
import { Creature, Food, World } from './types';
import { createArray } from './arrayUtils';

export const createEmptyWorld = (config: Config): World => {
  return createArray(config.worldSizeX + 1).map(() => createArray(config.worldSizeY + 1).map(() => ({
    creatureId: null,
    food: null,
  })));
};

export const addCreature = (world: World, creature: Creature) => {
  if (world[creature.x][creature.y] !== null) {
    throw new Error('Cannot add creature to occupied cell');
  }
  world[creature.x][creature.y].creatureId = creature.id;

  return world;
};

export const removeCreature = (world: World, creature: Creature) => {
  world[creature.x][creature.y].creatureId = null;

  return world;
};

export const getCreature = (world: World, x, y) => {
  return world[x][y].creatureId;
};

export const getFood = (world: World, x, y) => {
  return world[x][y].food;
};

export const removeFood = (world: World, x, y) => {
  world[x][y].food = null;
}

export const populateWorldWithFood = (world: World, foodDensity: number, foodNutrition: number) => {
  world.forEach((row, x) => row.forEach((cell, y) =>{
    if (Math.random() < foodDensity) {
      cell.food = Math.random() * foodNutrition;
    }
  }));

  return world;
};

export const getAllFood = (world: World) => {
  const food: { x: number, y: number, value: number }[] = [];
  world.forEach((row, x) => row.forEach((cell, y) =>{
    if (cell.food) {
      food.push({ x, y, value: cell.food });
    }
  }));

  return food;
};

export const findClosestFood = (world: World, x, y) => {
  const food = getAllFood(world);
  if (food.length === 0) {
    return { food: null, distance: 99999999999 };
  }
  const closestFood = food.reduce<{ food: Food | null, distance: number }>((closest, curr) => {
    const distance = Math.sqrt(Math.pow(x - curr.x, 2) + Math.pow(y - curr.y, 2));
    if (distance < closest.distance) {
      return { food: curr, distance };
    }
    return closest;
  }, { food: null, distance: 99999999999 });

  return closestFood;
}
