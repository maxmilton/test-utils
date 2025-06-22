/**
 * @file Virtual browser DOM and utilities for writing DOM tests.
 */

/* eslint "@typescript-eslint/no-invalid-void-type": "warn" */

import { GlobalWindow, type Window } from 'happy-dom';

/* eslint-disable vars-on-top */
declare global {
  /** Real bun console. `console` is mapped to happy-dom's virtual console. */
  var $console: Console;
  var happyDOM: Window['happyDOM'];
}
/* eslint-enable */

type AbstractConstructorHelper<T> = (new (
  ...args: unknown[]
) => Record<string, unknown>) &
  T;
type AbstractConstructorParameters<T> = ConstructorParameters<
  AbstractConstructorHelper<T>
>;

export const originalConsoleCtor = global.console.Console;
const originalConsole = global.console;

/**
 * Setup virtual DOM via happy-dom.
 *
 * Takes the same options as happy-dom's Window constructor.
 * @see https://github.com/capricorn86/happy-dom/wiki/Window
 */
export function setupDOM(
  options?: AbstractConstructorParameters<typeof Window>[0],
): void {
  const dom = new GlobalWindow(options);
  global.happyDOM = dom.happyDOM;
  global.$console = originalConsole;
  // @ts-expect-error - happy-dom only implements a subset of the DOM API
  global.window = dom.window.document.defaultView;
  global.document = window.document;
  global.console = window.console; // https://github.com/capricorn86/happy-dom/wiki/Virtual-Console
  global.navigator = window.navigator;
  global.location = window.location;
  global.history = window.history;
  global.localStorage = window.localStorage;
  global.fetch = window.fetch;
  global.setTimeout = window.setTimeout;
  global.clearTimeout = window.clearTimeout;
  global.setInterval = window.setInterval;
  global.clearInterval = window.clearInterval;
  global.queueMicrotask = window.queueMicrotask;
  global.requestAnimationFrame = window.requestAnimationFrame;
  global.cancelAnimationFrame = window.cancelAnimationFrame;
  global.postMessage = window.postMessage;
  global.dispatchEvent = window.dispatchEvent;
  global.addEventListener = window.addEventListener;
  global.removeEventListener = window.removeEventListener;
  global.DocumentFragment = window.DocumentFragment;
  global.MutationObserver = window.MutationObserver;
  global.CSSStyleSheet = window.CSSStyleSheet;
  global.Text = window.Text;

  // //////////////////////////

  // global.window = dom;
  // document[PropertySymbol.defaultView] = globalThis;

  // //////////////////////////

  // const window = new GlobalWindow(options);
  // global.happyDOM = window.happyDOM;
  // global.$console = originalConsole;

  // const globals = [
  //   'window',
  //   'document',
  //   'console',
  //   'navigator',
  //   'location',
  //   'history',
  //   'localStorage',
  //   'fetch',
  //   'setTimeout',
  //   'clearTimeout',
  //   'setInterval',
  //   'clearInterval',
  //   'queueMicrotask',
  //   'requestAnimationFrame',
  //   'cancelAnimationFrame',
  //   'postMessage',
  //   'dispatchEvent',
  //   'addEventListener',
  //   'removeEventListener',
  //   'DocumentFragment',
  //   'MutationObserver',
  //   'CSSStyleSheet',
  //   'Text',
  // ];

  // // Object.getOwnPropertyDescriptor
  // for (const key of globals) {
  //   // Object.defineProperty(global, key, {
  //   //   get() {
  //   //     return dom[key];
  //   //   },
  //   // });

  //   const windowPropertyDescriptor = Object.getOwnPropertyDescriptor(
  //     window,
  //     key,
  //   );
  //   const globalPropertyDescriptor = Object.getOwnPropertyDescriptor(
  //     globalThis,
  //     key,
  //   );

  //   if (
  //     globalPropertyDescriptor?.value === undefined ||
  //     globalPropertyDescriptor.value !== windowPropertyDescriptor!.value
  //   ) {
  //     // If the property is the window object, replace it with the global object
  //     if (windowPropertyDescriptor!.value === window) {
  //       window[key] = globalThis;
  //       windowPropertyDescriptor!.value = globalThis;
  //     }

  //     Object.defineProperty(globalThis, key, {
  //       ...windowPropertyDescriptor,
  //       configurable: true,
  //     });
  //   }
  // }
}

export interface RenderResult {
  /** A wrapper DIV which contains your mounted component. */
  container: HTMLDivElement;
  /**
   * A helper to print the HTML structure of the mounted container. The HTML is
   * prettified and may not accurately represent your actual HTML. It's intended
   * for debugging tests only and should not be used in any assertions.
   *
   * @param element - An element to inspect. Default is the mounted container.
   */
  debug(this: void, element?: Element): void;
  unmount(this: void): void;
}

const mountedContainers = new Set<HTMLDivElement>();

export function render(component: Node): RenderResult {
  const container = document.createElement('div');

  container.appendChild(component);
  document.body.appendChild(container);

  mountedContainers.add(container);

  return {
    container,
    debug(el = container) {
      // const { format } = await import('prettier');
      // const html = await format(el.innerHTML, { parser: 'html' });
      // $console.log(`DEBUG:\n${html}`);

      // FIXME: Replace with biome once it has a HTML parser
      $console.log(`DEBUG:\n${el.innerHTML}`);
    },
    unmount() {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      container.removeChild(component);
    },
  };
}

export function cleanup(): void {
  if (mountedContainers.size === 0) {
    throw new Error('No components mounted, did you forget to call render()?');
  }

  for (const container of mountedContainers) {
    if (container.parentNode === document.body) {
      container.remove();
    }

    mountedContainers.delete(container);
  }
}
