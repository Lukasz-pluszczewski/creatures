import { getIndexFromCoordinates, times } from './arrayUtils';
import { FoodData, WorldData } from './types';
import { Config } from './config';

export const growFood = (foodData: FoodData, world: WorldData, config: Config) => {
  let foodIndex = 1;
  times(config.worldSizeX * config.worldSizeY, index => {
    if (foodIndex < config.foodLimit && Math.random() < config.foodDensity) {
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
  times(maxFoodIndex + 1, index => {
    if (!foodData.energy[index]) {
      const worldIndex = foodData.y[index] * config.worldSizeX + foodData.x[index];
      world.food[worldIndex] = index;
      foodData.energy[index] = config.foodNutrition;
      newFoodNumber++;
    }
  });

  return newFoodNumber;
}
