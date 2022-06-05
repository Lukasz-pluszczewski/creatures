export const doWithProbability = (probability: number, action: () => void, otherwise?: () => void): void => {
  if (Math.random() < probability) {
    action();
  } else if(otherwise) {
    otherwise();
  }
}

export const doWithProbabilityAsync = async (
  probability: number,
  action: () => Promise<void>,
  otherwise?: () => Promise<void>
) => {
  if (Math.random() < probability) {
    await action();
  } else if(otherwise) {
    await otherwise();
  }
}
