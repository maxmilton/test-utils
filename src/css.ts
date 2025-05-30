/**
 * @file CSS engine and utilities for writing CSS tests.
 */

import {
  compile,
  DECLARATION,
  type Element,
  LAYER,
  MEDIA,
  RULESET,
  SCOPE,
  SUPPORTS,
} from 'stylis';

export * from 'stylis';

export const CONTAINER = '@container';
export const STARTING_STYLE = '@starting-style';

export const SKIP = Symbol('SKIP');

/**
 * Clones the element, stripping out references to other elements (e.g.,
 * "parent") for cleaner logging. **Intended for debugging only.**
 */
export const cleanElement = <T extends Element & { siblings?: Element[] }>(
  element: T,
): T => {
  const { root, parent, children, siblings, ...rest } = element;
  // @ts-expect-error - TODO: Fix "children" prop type
  rest.children = Array.isArray(children) ? children.length : children;
  return rest as T;
};

// biome-ignore lint/suspicious/noConfusingVoidType: allow void return type
type VisitorFunction = (element: Element) => typeof SKIP | void; // eslint-disable-line @typescript-eslint/no-invalid-void-type

function visit(element: Element, visitor: VisitorFunction): void {
  if (visitor(element) === SKIP) return;
  if (Array.isArray(element.children)) {
    for (const child of element.children) {
      visit(child, visitor);
    }
  }
}

/**
 * Walks the AST and calls the visitor function for each element.
 */
export function walk(root: Element[], visitor: VisitorFunction): void {
  for (const element of root) {
    visit(element, visitor);
  }
}

const cache = new WeakMap<Element[], Map<string, Element[]>>();

function load(root: Element[]): void {
  const map = new Map<string, Element[]>();
  cache.set(root, map);

  walk(root, (element) => {
    // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
    if (element.type[0] === '@') {
      switch (element.type) {
        case CONTAINER:
        case LAYER:
        case MEDIA:
        case SCOPE:
        case STARTING_STYLE:
        case SUPPORTS:
          return;
        default:
          // eslint-disable-next-line consistent-return
          return SKIP;
      }
    }

    if (element.type === RULESET) {
      for (const selector of element.props) {
        const elements = map.get(selector);
        if (elements) {
          elements.push(element);
        } else {
          map.set(selector, [element]);
        }
      }
    }
    // eslint-disable-next-line consistent-return
    return SKIP;
  });
}

/**
 * Returns a list of elements matching the given CSS selector.
 */
export function lookup(
  root: Element[],
  cssSelector: string,
): Element[] | undefined {
  if (!cache.has(root)) load(root);

  // parse the selector to ensure it's valid and normalized
  const ast = compile(`${cssSelector}{}`);

  if (ast.length !== 1 || ast[0].type !== RULESET) {
    throw new TypeError('Expected a single CSS selector');
  }

  const selector = ast[0].props;

  if (selector.length !== 1) {
    throw new TypeError('Expected a single CSS selector');
  }

  return cache.get(root)?.get(selector[0]);
}

/**
 * Combines the given elements into a single declaration block.
 *
 * Declarations are overwritten in the order they are given; the last
 * declaration for a given property wins.
 *
 * NOTE: `@media`, `@layer`, `@supports`, etc. rules are currently not handled.
 * All declarations will be merged regardless of their parent rules.
 *
 */
// FIXME: Evaluate at-rules and handle them appropriately. This adds a lot of
// complexity, so consider using happy-dom if they have support for it.
export function reduce(elements: Element[]): Record<string, string> {
  if (elements.length === 0) return {};

  const decls: Record<string, string> = {};

  for (const element of elements) {
    if (element.type === RULESET) {
      for (const child of element.children as Element[]) {
        if (child.type === DECLARATION) {
          decls[child.props as string] = child.children as string;
        } else {
          // eslint-disable-next-line no-console
          console.warn('Unexpected child element type:', child.type);
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Unexpected element type:', element.type);
    }
  }

  return decls;
}

export function isHexColor(color: string): boolean {
  return /^#[\da-f]{6,8}$/i.test(color);
}

export function hexToRgb(hex: string): [r: number, g: number, b: number] {
  const int = Number.parseInt(hex.slice(1, 7), 16);
  // eslint-disable-next-line no-bitwise
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function linearize(color: number): number {
  const v = color / 255; // normalize
  return v <= 0.039_28 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; // gamma correction
}

export function luminance([r, g, b]: [number, number, number]): number {
  return linearize(r) * 0.2126 + linearize(g) * 0.7152 + linearize(b) * 0.0722;
}

export function isLightOrDark(hexColor: string): 'light' | 'dark' {
  return luminance(hexToRgb(hexColor)) > 0.179 ? 'light' : 'dark';
}
