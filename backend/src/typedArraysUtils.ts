import { isTypedArray, TypedArrayConstructor } from './types';

export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint8ArrayConstructor): Uint8Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint16ArrayConstructor): Uint16Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint32ArrayConstructor): Uint32Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint8ClampedArrayConstructor): Uint8ClampedArray;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Int8ArrayConstructor): Int8Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Int16ArrayConstructor): Int16Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Int32ArrayConstructor): Int32Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Float32ArrayConstructor): Float32Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Float64ArrayConstructor): Float64Array;

export function getSharedTypedArray(length: number, typedArrayConstructor: Uint8ArrayConstructor): Uint8Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Uint16ArrayConstructor): Uint16Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Uint32ArrayConstructor): Uint32Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Uint8ClampedArrayConstructor): Uint8ClampedArray;
export function getSharedTypedArray(length: number, typedArrayConstructor: Int8ArrayConstructor): Int8Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Int16ArrayConstructor): Int16Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Int32ArrayConstructor): Int32Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Float32ArrayConstructor): Float32Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Float64ArrayConstructor): Float64Array;

export function getSharedTypedArray(argument: number | number[], typedArrayConstructor: TypedArrayConstructor) {
  if (Array.isArray(argument)) {
    const typedArray = new typedArrayConstructor(new SharedArrayBuffer(argument.length * typedArrayConstructor.BYTES_PER_ELEMENT));
    typedArray.set(argument);

    return typedArray;
  }
  return new typedArrayConstructor(new SharedArrayBuffer(argument * typedArrayConstructor.BYTES_PER_ELEMENT));
}

export class BitArray {
  typedArray: Uint8Array;
  byteLength: number;
  length: number;
  getBit: (index: number) => boolean;
  setBit: (index: number, value: number | boolean) => void;

  constructor(argument: number | ArrayLike<number | boolean> | BitArray | ArrayBufferLike) {
    this.getBit = index => ((this.typedArray[Math.floor(index / 8)]>>(index % 8)) % 2 != 0);

    this.setBit = (index, value) => {
      const arrayIndex = Math.floor(index / 8);
      this.typedArray[arrayIndex] = value
        ? (this.typedArray[arrayIndex] | 1<<(index % 8))
        : (this.typedArray[arrayIndex] & ~(1<<(index % 8)));
    };

    if (typeof argument === 'number') {
      this.typedArray = new Uint8Array(Math.ceil(argument / 8));
      this.byteLength = this.typedArray.length;
      this.length = argument;
    } else if (Array.isArray(argument) || isTypedArray(argument)) {
      this.typedArray = new Uint8Array(Math.ceil(argument.length / 8));
      argument.forEach((value, index) => {
        this.setBit(index, value);
      });
      this.byteLength = this.typedArray.length;
      this.length = argument.length;
    } else if (argument instanceof BitArray) {
      this.typedArray = argument.typedArray;
      this.byteLength = this.typedArray.length;
      this.length = argument.length;
    }  else {
      this.typedArray = new Uint8Array(argument as ArrayBufferLike);
      this.byteLength = this.typedArray.length;
      this.length = this.typedArray.length * 8;
    }


    return new Proxy(this, {
      get: function (target, index) {
        if (
          typeof index === 'symbol' ||
          index === 'BYTES_PER_ELEMENT'
        ) {
          return target.typedArray[index];
        }
        if (index === 'typedArray') {
          return target.typedArray;
        }
        if (
          index === 'byteLength' ||
          index === 'length'
        ) {
          return target[index];
        }

        return target.getBit(+index);
      },
      set: function (target, index, value) {
        if (typeof index === 'symbol') {
          return target.typedArray[index] = value;
        }

        target.setBit(+index, value);
        return true;
      }
    });
  }
}
