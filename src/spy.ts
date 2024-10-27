import { type Mock, expect, spyOn } from 'bun:test';

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
const methods = Object.getOwnPropertyNames(
  performance,
) as (keyof Performance)[];

export function performanceSpy(): () => void {
  const spies: Mock<() => void>[] = [];
  let happydomInternalNowCalls = 0;

  function now() {
    // biome-ignore lint/suspicious/useErrorMessage: only used to get stack
    const callerLocation = new Error().stack!.split('\n')[3]; // eslint-disable-line unicorn/error-message
    if (callerLocation.includes('/node_modules/happy-dom/lib/')) {
      happydomInternalNowCalls++;
    }
    return originalNow();
  }

  for (const method of methods) {
    spies.push(
      method === 'now'
        ? spyOn(performance, method).mockImplementation(now)
        : spyOn(performance, method),
    );
  }

  return /** check */ () => {
    for (const spy of spies) {
      if (spy.getMockName() === 'now') {
        // HACK: Workaround for happy-dom calling performance.now internally.
        //  ↳ https://github.com/search?q=repo%3Acapricorn86%2Fhappy-dom%20performance.now&type=code
        // biome-ignore lint/suspicious/noMisplacedAssertion: only used within tests
        expect(spy).toHaveBeenCalledTimes(happydomInternalNowCalls);
      } else {
        // biome-ignore lint/suspicious/noMisplacedAssertion: only used within tests
        expect(spy).not.toHaveBeenCalled();
      }
      spy.mockRestore();
    }
  };
}
