import { FixedLengthNumber } from './typesUtils';
import { MAX_16_BIT_INTEGER } from './constants';


export const randomFixedLengthNumber = <TBitLength extends number>(bitLength: TBitLength): FixedLengthNumber<typeof bitLength> =>
  Math.floor(Math.random() * Math.pow(2, bitLength)) as FixedLengthNumber<typeof bitLength>;

export const randomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * ((max + 1) - min) + min);
};

export const randomNumber = (min: number, max: number) => (Math.random() * (max - min) + min);

export const createNumber = <TBitLength extends number>(number: number, bitLength: TBitLength) =>
  number as FixedLengthNumber<TBitLength>;

export const mapNumberToDifferentRange = (value, inMin, inMax, outMin, outMax) => {
  return (value - inMin) * (outMax- outMin) / (inMax- inMin) + outMin;
};

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const nonUniformRandomInteger = (min, max, exponent = 1) => {
  return Math.floor(
    (1 - Math.pow(1 - Math.random(), exponent)) * (max - min) + min
  );
};

export const randomSign = () => Math.random() < 0.5 ? -1 : 1;
