import { TypedArrayConstructor } from './types';

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


