import { iterateOverRange, times } from './arrayUtils';
import { FoodData, WorldData } from './types';
import { Config } from './config';

export const growFood = (foodData: FoodData, world: WorldData, config: Config) => {
  let foodIndex = 1;
  times(config.worldSizeX * config.worldSizeY, index => {
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

export const regrowFood = (foodData: FoodData, world: WorldData, config: Config, maxFoodIndex: number) => {
  let newFoodNumber = 0;
  iterateOverRange(1, maxFoodIndex, index => {
    if (!foodData.energy[index]) {
      const worldIndex = foodData.y[index] * config.worldSizeX + foodData.x[index];
      world.food[worldIndex] = index;
      foodData.energy[index] = config.foodNutrition;
      newFoodNumber++;
    }
  });

  return newFoodNumber;
}
