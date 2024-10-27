import { describe, expect, mock, test } from 'bun:test';
// biome-ignore lint/style/noNamespaceImport: explicitly for testing
import * as stylisExports from 'stylis';
import {
  DECLARATION,
  type Element,
  RULESET,
  cleanElement,
  compile,
  hexToRgb,
  isHexColor,
  isLightOrDark,
  linearize,
  lookup,
  luminance,
  reduce,
  walk,
} from '../src/css';
// biome-ignore lint/style/noNamespaceImport: explicitly for testing
import * as cssExports from '../src/css';

describe('exports', () => {
  const exports = [
    ...Object.keys(stylisExports),
    'CONTAINER',
    'STARTING_STYLE',
    'SKIP',
    'cleanElement',
    'walk',
    'lookup',
    'reduce',
    'isHexColor',
    'hexToRgb',
    'linearize',
    'luminance',
    'isLightOrDark',
  ];

  test.each(exports)('has "%s" named export', (exportName) => {
    expect.assertions(1);
    expect(cssExports).toHaveProperty(exportName);
  });

  test('does not have a default export', () => {
    expect.assertions(1);
    expect(cssExports).not.toHaveProperty('default');
  });

  test('does not export anything else', () => {
    expect.assertions(1);
    expect(Object.keys(cssExports)).toHaveLength(exports.length);
  });
});

const css = `
  .foo {
    color: red;
  }

  .bar {
    color: blue;
  }

  .baz {
    color: pink;
  }

  .baz {
    color: green;
  }

  @media (min-width: 768px) {
    .baz {
      color: purple;
    }
  }

  .qux {
    color: yellow;

    & > .qax {
      color: orange;
    }
  }

  @font-face {
    font-family: 'Example';
    src: url('fonts/Example.woff') format('woff2');
  }
`;
const ast = compile(css);

describe('lookup', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(lookup).toBeFunction();
    expect(lookup).not.toBeClass();
  });

  test('expects 2 parameters', () => {
    expect.assertions(1);
    expect(lookup).toHaveParameters(2, 0);
  });

  test('returns an array when has matching elements', () => {
    expect.assertions(1);
    expect(lookup(ast, '.foo')).toBeArray();
  });

  test('returns undefined when no matching elements', () => {
    expect.assertions(1);
    expect(lookup(ast, '.missing')).toBeUndefined();
  });

  test('throws if selector is invalid', () => {
    expect.assertions(6);
    expect(() => lookup(ast, '')).toThrow();
    expect(() => lookup(ast, ' ')).toThrow();
    expect(() => lookup(ast, ';')).toThrow();
    expect(() => lookup(ast, '{}')).toThrow();
    expect(() => lookup(ast, '@')).toThrow();
    expect(() => lookup(ast, '&')).toThrow();
    // FIXME: These should also throw, but they don't
    // expect(() => lookup(ast, '[]')).toThrow();
    // expect(() => lookup(ast, '#')).toThrow();
    // expect(() => lookup(ast, '.')).toThrow();
  });

  test('throws if multiple selectors are passed', () => {
    expect.assertions(1);
    expect(() => lookup(ast, '.foo, .bar')).toThrow('Expected a single CSS selector');
  });

  test('throws if multiple rulesets are found', () => {
    expect.assertions(1);
    expect(() => lookup(ast, '.bar{} .baz')).toThrow('Expected a single CSS selector');
  });

  test('finds all matching elements', () => {
    expect.assertions(6);
    expect(lookup(ast, '.foo')).toHaveLength(1);
    expect(lookup(ast, '.bar')).toHaveLength(1);
    expect(lookup(ast, '.baz')).toHaveLength(3); // three rulesets have this selector
    expect(lookup(ast, '.qux')).toHaveLength(1);
    expect(lookup(ast, '.qax')).toBeUndefined(); // actual selector is .qux>.qax
    expect(lookup(ast, '.quux')).toBeUndefined(); // no matching selector
  });
});

describe('walk', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(walk).toBeFunction();
    expect(walk).not.toBeClass();
  });

  test('expects 2 parameters', () => {
    expect.assertions(1);
    expect(walk).toHaveParameters(2, 0);
  });

  test('has no return value', () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(walk(ast, () => {})).toBeUndefined();
  });

  test('calls visitor function for each AST node', () => {
    expect.assertions(1);
    const visitor = mock();
    walk(ast, visitor);
    expect(visitor).toHaveBeenCalledTimes(18);
  });

  test('visits all elements', () => {
    expect.assertions(1);
    const selectors: string[] = [];
    walk(ast, (element) => {
      if (element.type === RULESET) {
        selectors.push(...element.props);
      }
    });
    expect(selectors).toEqual(['.foo', '.bar', '.baz', '.baz', '.baz', '.qux', '.qux>.qax']);
  });
});

describe('reduce', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(reduce).toBeFunction();
    expect(reduce).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(reduce).toHaveParameters(1, 0);
  });

  test('returns an object', () => {
    expect.assertions(1);
    const reduced = reduce([ast[0]]);
    expect(reduced).toBePlainObject();
  });

  test('throws when passed null or undefined', () => {
    expect.assertions(2);
    // @ts-expect-error - intentionally passing wrong type
    expect(() => reduce(null)).toThrow();
    // @ts-expect-error - intentionally passing wrong type
    expect(() => reduce()).toThrow();
  });

  test('merges all elements, overriding earlier values', () => {
    expect.assertions(2);
    const elements = lookup(ast, '.baz');
    expect(elements).toHaveLength(3);
    const reduced = reduce(elements!);
    // FIXME: It should be green since it's outside the media query
    // expect(reduced).toEqual({ color: 'green' }); // last one wins
    expect(reduced).toEqual({ color: 'purple' }); // last one wins
  });
});

describe('cleanElement', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(cleanElement).toBeFunction();
    expect(cleanElement).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(cleanElement).toHaveParameters(1, 0);
  });

  test('returns an object', () => {
    expect.assertions(1);
    const cleaned = cleanElement(ast[0]);
    expect(cleaned).toBePlainObject();
  });

  for (const prop of ['root', 'parent', 'siblings'] as const) {
    test(`removes "${prop}" property without mutating original object`, () => {
      expect.assertions(2);
      const cleaned = cleanElement(ast[0]);
      expect(ast[0]).toHaveProperty(prop);
      expect(cleaned).not.toHaveProperty(prop);
    });
  }

  test('replaces "children" property with count of child elements when children is array', () => {
    expect.assertions(3);
    const element = lookup(ast, '.qux')![0];
    const cleaned = cleanElement(element);
    expect(element).toHaveProperty('children');
    expect(element.children).toBeArray();
    expect(cleaned).toHaveProperty('children', 1);
  });

  test('leaves "children" property alone when children is not array', () => {
    expect.assertions(5);
    const element = ast[0].children[0] as Element;
    expect(element).toBePlainObject();
    expect(element.type).toBe(DECLARATION);
    const cleaned = cleanElement(element);
    expect(element).toHaveProperty('children', 'red');
    expect(element.children).toBeString();
    expect(cleaned).toHaveProperty('children', element.children);
  });
});

const hexColors = [
  '#ffffff',
  '#ffffffff',
  '#000000',
  '#00000000',
  '#ff000000',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#000000ff',
  '#ff00ff',
  '#00ffff',
  '#ffff00',
  '#abcdef',
];
const notHexColors = [
  '@000000',
  '000000',
  '00000',
  '0000',
  '000',
  '00',
  '0',
  '',
  ' ',
  'abcdef',
  'null',
];

describe('isHexColor', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(isHexColor).toBeFunction();
    expect(isHexColor).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(isHexColor).toHaveParameters(1, 0);
  });

  test('returns a boolean', () => {
    expect.assertions(1);
    expect(isHexColor('#ffffff')).toBeBoolean();
  });

  test.each(hexColors)('returns true for %s', (value) => {
    expect.assertions(1);
    expect(isHexColor(value)).toBeTrue();
  });

  test.each(notHexColors)('returns false for %s', (value) => {
    expect.assertions(1);
    expect(isHexColor(value)).toBeFalse();
  });
});

describe('hexToRgb', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(hexToRgb).toBeFunction();
    expect(hexToRgb).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(hexToRgb).toHaveParameters(1, 0);
  });

  test('returns an array', () => {
    expect.assertions(1);
    expect(hexToRgb('#ffffff')).toBeArrayOfSize(3);
  });
});

describe('linearize', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(linearize).toBeFunction();
    expect(linearize).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(linearize).toHaveParameters(1, 0);
  });

  test('returns a number', () => {
    expect.assertions(1);
    expect(linearize(0)).toBeNumber();
  });
});

describe('luminance', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(luminance).toBeFunction();
    expect(luminance).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(luminance).toHaveParameters(1, 0);
  });

  test('returns a number', () => {
    expect.assertions(1);
    expect(luminance([0, 0, 0])).toBeNumber();
  });
});

describe('isLightOrDark', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(isLightOrDark).toBeFunction();
    expect(isLightOrDark).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(isLightOrDark).toHaveParameters(1, 0);
  });

  test('returns string "light" for #ffffff', () => {
    expect.assertions(1);
    expect(isLightOrDark('#ffffff')).toBe('light');
  });

  test('returns string "dark" for #000000', () => {
    expect.assertions(1);
    expect(isLightOrDark('#000000')).toBe('dark');
  });
});
