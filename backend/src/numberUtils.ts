export const randomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * ((max + 1) - min) + min);
};

export const randomNumber = (min: number, max: number) => (Math.random() * (max - min) + min);

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
