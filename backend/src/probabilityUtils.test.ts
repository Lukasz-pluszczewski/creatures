import { doWithProbability, doWithProbabilityAsync } from './probabilityUtils';

describe('doWithProbability', () => {
  it('performs action when probability is 1', () => {
    const action = jest.fn();
    doWithProbability(1, action);
    expect(action).toBeCalled();
  });
  it('does not perform action when probability is 0', () => {
    const action = jest.fn();
    doWithProbability(0, action);
    expect(action).not.toBeCalled();
  });
  it('performs different action when probability is 0', () => {
    const action = jest.fn();
    const otherwise = jest.fn();
    doWithProbability(0, action, otherwise);
    expect(action).not.toBeCalled();
    expect(otherwise).toBeCalled();
  });
});


describe('doWithProbabilityAsync', () => {
  it('performs action when probability is 1', async () => {
    const runResolve = jest.fn(resolve => resolve());
    const action = jest.fn(() => (new Promise(resolve => setTimeout(runResolve(resolve), 50))) as Promise<void>);
    await doWithProbabilityAsync(1, action);
    expect(action).toBeCalledTimes(1);
    expect(runResolve).toBeCalledTimes(1);
  });
  it('does not perform action when probability is 0', async () => {
    const runResolve = jest.fn(resolve => resolve());
    const action = jest.fn(() => (new Promise(resolve => setTimeout(runResolve(resolve), 50))) as Promise<void>);
    await doWithProbabilityAsync(0, action);
    expect(action).not.toBeCalled();
    expect(runResolve).not.toBeCalled();
  });
  it('performs different action when probability is 0', async () => {
    const runResolve = jest.fn(resolve => resolve());
    const action = jest.fn(() => (new Promise(resolve => setTimeout(runResolve(resolve), 50))) as Promise<void>);
    const otherwise = jest.fn(() => (new Promise(resolve => setTimeout(runResolve(resolve), 50))) as Promise<void>);
    await doWithProbabilityAsync(0, action, otherwise);
    expect(action).not.toBeCalled();
    expect(otherwise).toBeCalledTimes(1);
    expect(runResolve).toBeCalledTimes(1);
  });
});
