export const doWithProbability = (probability: number, action: () => void, otherwise?: () => void): void => {
  if (Math.random() < probability) {
    action();
  } else if(otherwise) {
    otherwise();
  }
}
