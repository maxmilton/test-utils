import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { VirtualConsole } from 'happy-dom';
import * as domExports from '../src/dom';
import { cleanup, originalConsoleCtor, render } from '../src/dom';
import { Test } from './TestComponent';

describe('exports', () => {
  const exports = ['cleanup', 'originalConsoleCtor', 'render', 'setupDOM'];

  test.each(exports)('has "%s" named export', (exportName) => {
    expect.assertions(1);
    expect(domExports).toHaveProperty(exportName);
  });

  test('does not have a default export', () => {
    expect.assertions(1);
    expect(domExports).not.toHaveProperty('default');
  });

  test('does not export anything else', () => {
    expect.assertions(1);
    expect(Object.keys(domExports)).toHaveLength(exports.length);
  });
});

describe('setup', () => {
  /* eslint-disable no-console */

  describe('$console', () => {
    test('global exists', () => {
      expect.assertions(1);
      expect($console).toBeDefined();
    });

    test('is the original console', () => {
      expect.assertions(1);
      expect($console).toBeInstanceOf(originalConsoleCtor);
    });

    test('is not the happy-dom virtual console', () => {
      expect.assertions(3);
      expect($console).not.toBeInstanceOf(VirtualConsole);
      expect($console).not.toBe(console);
      expect($console).not.toBe(window.console);
    });
  });

  describe('happy-dom', () => {
    const globals = [
      'happyDOM',
      'window',
      'document',
      'console',
      'navigator',
      'location',
      'history',
      'localStorage',
      'fetch',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'postMessage',
      'dispatchEvent',
      'addEventListener',
      'removeEventListener',
      'DocumentFragment',
      'MutationObserver',
      'CSSStyleSheet',
      'Text',
    ];

    test.each(globals)('"%s" global exists', (global) => {
      expect.assertions(1);
      expect(global).toBeDefined();
    });

    test('console is a virtual console', () => {
      expect.assertions(3);
      expect(window.console).toBeInstanceOf(VirtualConsole);
      expect(console).toBeInstanceOf(VirtualConsole);
      expect(console).toBe(window.console); // same instance
    });

    test('console is not the original console', () => {
      expect.assertions(2);
      expect(console).not.toBeInstanceOf(originalConsoleCtor);
      expect(console).not.toBe($console);
    });

    describe('virtual console', () => {
      test('has no log entries by default', () => {
        expect.assertions(2);
        const logs = happyDOM.virtualConsolePrinter.read();
        expect(logs).toBeArray();
        expect(logs).toHaveLength(0);
      });

      // types shouldn't include @types/node Console['Console'] property
      const methods: (keyof Omit<Console, 'Console'>)[] = [
        'assert',
        // 'clear', // clears log entries so we can't test it
        'count',
        'countReset',
        'debug',
        'dir',
        'dirxml',
        'error',
        // @ts-expect-error - alias for console.error
        'exception',
        'group',
        'groupCollapsed',
        // 'groupEnd', // doesn't log anything
        'info',
        'log',
        // 'profile', // not implemented in happy-dom
        // 'profileEnd',
        'table',
        // 'time', // doesn't log anything
        // 'timeStamp',
        // 'timeLog',
        // 'timeEnd',
        'trace',
        'warn',
      ];

      test.each(methods)('has log entry after "%s" call', (method) => {
        expect.assertions(1);
        console[method]();
        expect(happyDOM.virtualConsolePrinter.read()).toHaveLength(1);
      });

      test('clears log entries after read', () => {
        expect.assertions(3);
        expect(happyDOM.virtualConsolePrinter.read()).toHaveLength(0);
        console.log();
        expect(happyDOM.virtualConsolePrinter.read()).toHaveLength(1);
        expect(happyDOM.virtualConsolePrinter.read()).toHaveLength(0);
      });
    });
  });

  /* eslint-enable no-console */
});

describe('render <no call>', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(render).toBeFunction();
    expect(render).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(render).toHaveParameters(1, 0);
  });
});

describe('render', () => {
  afterEach(cleanup);

  test('returns a container element', () => {
    expect.assertions(2);
    const rendered = render(document.createElement('div'));
    expect(rendered).toHaveProperty('container');
    expect(rendered.container).toBeInstanceOf(window.Element);
  });

  test('mounts supplied element in container', () => {
    expect.assertions(1);
    const el = document.createElement('span');
    const rendered = render(el);
    expect(rendered.container.firstChild).toBe(el);
  });

  test('mounts container div to document body', () => {
    expect.assertions(3);
    expect(document.body.firstChild).toBeNull();
    const rendered = render(document.createElement('div'));
    expect(document.body.firstChild).toBe(rendered.container);
    expect(document.body.firstChild).toBeInstanceOf(window.HTMLDivElement);
  });

  test('mounts containers when other DOM elements exist on document body', () => {
    expect.assertions(2);
    document.body.append(document.createElement('span'));
    document.body.append(document.createElement('span'));
    render(document.createElement('a'));
    render(document.createElement('a'));
    document.body.append(document.createElement('span'));
    expect(document.body.childNodes).toHaveLength(5);
    expect(document.body.innerHTML).toBe(
      '<span></span><span></span><div><a></a></div><div><a></a></div><span></span>',
    );
    document.body.textContent = '';
  });

  test('renders Test component correctly', () => {
    expect.assertions(1);
    const rendered = render(Test({ text: 'abc' }));
    expect(rendered.container.innerHTML).toBe('<div id="test">abc</div>');
  });

  describe('unmount method', () => {
    test('is a function', () => {
      expect.assertions(3);
      const rendered = render(document.createElement('div'));
      expect(rendered).toHaveProperty('unmount');
      expect(rendered.unmount).toBeFunction();
      expect(rendered.unmount).not.toBeClass();
    });

    test('expects no parameters', () => {
      expect.assertions(1);
      const rendered = render(document.createElement('div'));
      expect(rendered.unmount).toHaveParameters(0, 0);
    });

    test('removes supplied element from container', () => {
      expect.assertions(3);
      const rendered = render(document.createElement('div'));
      expect(rendered.container.firstChild).toBeTruthy();
      rendered.unmount();
      expect(rendered.container).toBeTruthy();
      expect(rendered.container.firstChild).toBeNull();
    });
  });

  describe('debug method', () => {
    test('is a function', () => {
      expect.assertions(3);
      const rendered = render(document.createElement('div'));
      expect(rendered).toHaveProperty('debug');
      expect(rendered.debug).toBeFunction();
      expect(rendered.debug).not.toBeClass();
    });

    test('expects 1 optional parameter', () => {
      expect.assertions(1);
      const rendered = render(document.createElement('div'));
      expect(rendered.debug).toHaveParameters(0, 1);
    });

    test('prints to $console', () => {
      expect.assertions(1);
      const spy = spyOn($console, 'log').mockImplementation(() => {});
      const rendered = render(document.createElement('div'));
      rendered.debug();
      expect(spy).toHaveBeenCalledTimes(1);
      // TODO: Uncomment once biome has a HTML parser.
      // expect(spy).toHaveBeenCalledWith('DEBUG:\n<div></div>\n');
      spy.mockRestore();
    });

    test('does not print to console, only $console', () => {
      expect.assertions(2);
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      const spy2 = spyOn($console, 'log').mockImplementation(() => {});
      const rendered = render(document.createElement('div'));
      rendered.debug();
      expect(spy).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledTimes(1);
      spy.mockRestore();
      spy2.mockRestore();
    });

    // TODO: Don't skip once biome has a HTML parser.
    test.skip('prints prettified container DOM to console', () => {
      expect.assertions(2);
      const spy = spyOn($console, 'log').mockImplementation(() => {});
      const main = document.createElement('main');
      main.append(
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      );
      const rendered = render(main);
      rendered.debug();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'DEBUG:\n<main>\n  <div></div>\n  <div></div>\n  <div></div>\n</main>\n',
      );
      spy.mockRestore();
    });
  });
});

describe('cleanup', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(cleanup).toBeFunction();
    expect(cleanup).not.toBeClass();
  });

  test('expects no parameters', () => {
    expect.assertions(1);
    expect(cleanup).toHaveParameters(0, 0);
  });

  test('throws when there are no rendered components', () => {
    expect.assertions(1);
    expect(() => {
      cleanup();
    }).toThrow();
  });

  test('removes mounted container from document body', () => {
    expect.assertions(2);
    render(document.createElement('div'));
    expect(document.body.firstChild).toBeTruthy();
    cleanup();
    expect(document.body.firstChild).toBeNull();
  });

  test('removes multiple mounted containers from document body', () => {
    expect.assertions(2);
    render(document.createElement('div'));
    render(document.createElement('div'));
    render(document.createElement('div'));
    expect(document.body.childNodes).toHaveLength(3);
    cleanup();
    expect(document.body.childNodes).toHaveLength(0);
  });

  test('only removes mounted containers and not other DOM nodes', () => {
    expect.assertions(5);
    document.body.append(document.createElement('span'));
    document.body.append(document.createElement('span'));
    render(document.createElement('a'));
    render(document.createElement('a'));
    document.body.append(document.createElement('span'));
    expect(document.body.childNodes).toHaveLength(5);
    cleanup();
    expect(document.body.childNodes).toHaveLength(3);
    for (const node of document.body.childNodes) {
      expect(node).toBeInstanceOf(window.HTMLSpanElement);
    }
    document.body.textContent = '';
  });
});
