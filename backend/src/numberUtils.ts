import { FixedLengthNumber } from './typesUtils';
import { BinString, Gene, HexString, SourceId, SourceType, TargetId, TargetType, Weight } from './types';

export const toBinString = <TBitLength extends number>(number: FixedLengthNumber<TBitLength>, padStart: number = 0): BinString =>
  number.toString(2).padStart(padStart, '0') as BinString;

export const toHexString = <TBitLength extends number>(number: FixedLengthNumber<TBitLength>, padStart = 0): HexString =>
  number.toString(16).padStart(padStart, '0') as HexString;

export const binString2Number = <TBitLength extends number>(bin: BinString) => parseInt(bin, 2) as FixedLengthNumber<TBitLength>;
export const hexString2Number = <TBitLength extends number>(hex: HexString) => parseInt(hex, 16) as FixedLengthNumber<TBitLength>;

export const sliceBinString2Number = <TLength extends number>(binString: BinString, start: number, length: TLength) =>
  binString2Number<TLength>(binString.slice(start, start + length) as BinString);

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
