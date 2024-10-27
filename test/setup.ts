import '../src/extend';

import { setupDOM } from '../src/dom';

// const noop = () => {};
//
// function setupMocks(): void {
//   // @ts-expect-error - noop stub
//   global.performance.mark = noop;
//   // @ts-expect-error - noop stub
//   global.performance.measure = noop;
// }
//
// export async function reset(): Promise<void> {
//   // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
//   if (global.happyDOM) {
//     await happyDOM.abort();
//     window.close();
//   }
//
//   setupDOM();
//   setupMocks();
// }
//
// await reset();

setupDOM();
