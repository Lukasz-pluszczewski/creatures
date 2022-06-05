import { iterateOverRange, iterateOverRangeAsync, times, timesAsync } from './arrayUtils';
import { FoodData, WorldData } from './types';
import { Config } from './config';

export const growFood = async (foodData: FoodData, world: WorldData, config: Config) => {
  let foodIndex = 1;
  await timesAsync(config.worldSizeX * config.worldSizeY, async index => {
    if (foodIndex < config.foodLimit && Math.random() < config.foodDensity) {
      if (world.food[index]) {
        throw new Error(`Trying to grow food that already exists in the world (index: ${index}, foodIndex: ${foodIndex})`);
      }
      foodData.x[foodIndex] = index % config.worldSizeX;
      foodData.y[foodIndex] = Math.floor(index / config.worldSizeX);

      foodData.energy[foodIndex] = config.foodNutrition;
      world.food[index] = foodIndex;

      foodIndex++;
    }
  });

  return foodIndex - 1;
};

export const regrowFood = async (foodData: FoodData, world: WorldData, config: Config, maxFoodIndex: number) => {
  let newFoodNumber = 0;
  await iterateOverRangeAsync(1, maxFoodIndex, async index => {
    if (!foodData.energy[index]) {
      const worldIndex = foodData.y[index] * config.worldSizeX + foodData.x[index];
      world.food[worldIndex] = index;
      foodData.energy[index] = config.foodNutrition;
      newFoodNumber++;
    }
  });

  return newFoodNumber;
}
