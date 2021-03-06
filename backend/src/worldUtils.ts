import { Config } from './config';
import { FoodData, WorldData } from './types';
import { getIndexFromCoordinates, iterateOverRange } from './arrayUtils';
import { time, timeEnd } from './debugUtils';


// Return list of coordinates around the point with horizontal and vertical distance of "level" from "index"
export const getLevel = (x: number, y: number, level: number, width: number, height: number) => {
  let iterationsCounter = 0;
  const yTooLarge = y + level > height - 1;
  const yTooSmall = y - level < 0;
  const xTooLarge = x + level > width - 1;
  const xTooSmall = x - level < 0;

  const results: [number, number][] = [];
  iterateOverRange(x - level, x + level, (currentX) => {
    iterationsCounter++;
    if (currentX < 0 || currentX > width - 1) {
      return;
    }

    if (!yTooLarge) {
      // results.push(getIndexFromCoordinates(currentX, y + level, width));
      results.push([currentX, y + level]);
    }
    if (!yTooSmall) {
      // results.push(getIndexFromCoordinates(currentX, y - level, width));
      results.push([currentX, y - level]);
    }
  });

  iterateOverRange(y - level + 1, y + level - 1, (currentY) => {
    iterationsCounter++;
    if (currentY < 0 || currentY > width - 1) {
      return;
    }
    if (!xTooLarge) {
      // results.push(getIndexFromCoordinates(x + level, currentY, width));
      results.push([x + level, currentY]);
    }

    if (!xTooSmall) {
      // results.push(getIndexFromCoordinates(x - level, currentY, width));
      results.push([x - level, currentY]);
    }
  });

  return results;
};


export const findClosestFood = (x, y, world: WorldData, foodData: FoodData, config: Config) => {
  let level = 1;
  let coordinatesAround = getLevel(x, y, level, config.worldSizeX, config.worldSizeY);
  let closestFoodIndex: number = null;
  while (coordinatesAround.length && !closestFoodIndex) {
    coordinatesAround.forEach(([x, y]) => {
      const foodIndex = world.food[getIndexFromCoordinates(x, y, config.worldSizeX)];
      if (foodIndex) {
        closestFoodIndex = foodIndex;
      }
    });

    coordinatesAround = ++level <= config.foodSensorRange
      ? getLevel(x, y, level, config.worldSizeX, config.worldSizeY)
      : [];
  }

  return closestFoodIndex;
};
