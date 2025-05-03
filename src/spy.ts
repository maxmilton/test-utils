/**
 * @file Bun test introspection utilities to spy on internals.
 */

import { expect, type Mock, spyOn } from 'bun:test';

// TODO: Use this implementation if happy-dom removes internal performance.now calls.
// const methods = Object.getOwnPropertyNames(performance) as (keyof Performance)[];
//
// export function performanceSpy(): () => void {
//   const spies: Mock<() => void>[] = [];
//
//   for (const method of methods) {
//     spies.push(spyOn(performance, method));
//   }
//
//   return /** check */ () => {
//     for (const spy of spies) {
//       expect(spy).not.toHaveBeenCalled();
//       spy.mockRestore();
//     }
//   };
// }

const originalNow = performance.now.bind(performance);
// const methods = Reflect.ownKeys(performance).filter((prop) => typeof performance[prop] === 'function') as (keyof Performance)[];
const methods = [
  'clearMarks',
  'clearMeasures',
  'clearResourceTimings',
  'getEntries',
  'getEntriesByName',
  'getEntriesByType',
  'mark',
  'measure',
  'now',
  'setResourceTimingBufferSize',
] as (keyof Performance)[];

export function performanceSpy(exclude: string[] = []): () => void {
  const spies: Mock<() => void>[] = [];
  let happydomInternalNowCalls = 0;

  function now() {
    const callerLocation = new Error().stack?.split('\n')[3]; // eslint-disable-line unicorn/error-message
    if (callerLocation?.includes('/node_modules/happy-dom/lib/')) {
      happydomInternalNowCalls++;
    }
    return originalNow();
  }

  for (const method of methods) {
    if (!exclude.includes(method)) {
      spies.push(
        method === 'now'
          ? spyOn(performance, method).mockImplementation(now)
          : spyOn(performance, method),
      );
    }
  }

  return /** check */ () => {
    for (const spy of spies) {
      if (spy.getMockName() === 'now') {
        // HACK: Workaround for happy-dom calling performance.now internally.
        //  ↳ https://github.com/search?q=repo%3Acapricorn86%2Fhappy-dom%20performance.now&type=code
        expect(spy).toHaveBeenCalledTimes(happydomInternalNowCalls);
      } else {
        expect(spy).not.toHaveBeenCalled();
      }
      spy.mockRestore();
    }
  };
}
