/**
 * @file Extended matchers for Bun test.
 */

import { expect } from "bun:test";

/**
 * Get the total number of parameters of a function including optional
 * parameters with default values.
 *
 * @remarks Native functions will only return the number of required parameters;
 * optional parameters cannot be determined.
 *
 * @returns The number of parameters, including optional parameters.
 */
export function parameters(func: unknown): number {
  if (typeof func !== "function") {
    throw new TypeError("Expected a function");
  }

  const str = Function.prototype.toString.call(func);
  const isClassConstructor = /^class\s/u.test(str);
  const len = str.length;
  // Special handling for ES classes: str contains the entire class, so we must
  // locate the constructor's start because other methods may appear before it.
  const start = isClassConstructor
    ? str.indexOf("constructor(") + "constructor".length
    : str.indexOf("(");
  let index = start;
  let count = 1;
  let nested = 0;
  let char: string;

  // FIXME: Handle nested string template literals.
  const string = (quote: '"' | "'" | "`") => {
    while (index++ < len) {
      char = str[index];

      if (char === quote) {
        break;
      }
      // skip escaped characters
      if (char === "\\") {
        index++;
      }
    }
  };

  while (index++ < len) {
    char = str[index];

    if (!nested) {
      if (char === ")") {
        break;
      }
      if (char === ",") {
        count++;
        continue;
      }
    }

    switch (char) {
      case '"':
      case "'":
      case "`":
        string(char);
        break;
      case "(":
      case "[":
      case "{":
        nested++;
        break;
      case ")":
      case "]":
      case "}":
        nested--;
        break;
      default:
        break;
    }
  }

  if (index >= len || nested !== 0) {
    throw new Error("Invalid function signature");
  }

  // handle no parameters
  if (str.slice(start + 1, index).trim().length === 0) {
    if (str.indexOf("[native code]", index) >= 0) {
      count = func.length;
      // oxlint-disable-next-line no-console
      console.warn("Optional parameters cannot be determined for native functions");
    } else {
      count = 0;
    }
  }

  return count;
}

declare module "bun:test" {
  interface Matchers {
    /** Asserts that a value is a plain object. */
    toBePlainObject: () => void;
    /** Asserts that a value was defined using ECMAScript `class` syntax. */
    toBeClass: () => void;
    /**
     * Asserts that a value has the ECMAScript `[[Construct]]` internal method.
     * The value is not invoked, and successful construction is not guaranteed.
     */
    toBeConstructible: () => void;
    /** Asserts that a value has the given `Object.prototype.toString` type. */
    toHaveObjectType: (type: string) => void;
    /** Asserts that a function has the given required and optional parameters. */
    toHaveParameters: (required: number, optional: number) => void;
  }
}

expect.extend({
  toBePlainObject(received: unknown) {
    const pass = Object.prototype.toString.call(received) === "[object Object]";
    return {
      pass,
      message: () =>
        `expected ${this.utils.printReceived(received)} ${pass ? "not " : ""}to be a plain object`,
    };
  },

  toBeClass(received: unknown) {
    const pass =
      typeof received === "function" &&
      /^class\s/u.test(Function.prototype.toString.call(received));
    return {
      pass,
      message: () =>
        `expected ${this.utils.printReceived(received)} ${pass ? "not " : ""}to be a class`,
    };
  },

  toBeConstructible(received: unknown) {
    let pass = false;
    if (typeof received === "function") {
      try {
        // Proxy does not invoke or access newTarget after IsConstructor checks it.
        Reflect.construct(Proxy, [{}, {}], received);
        pass = true;
      } catch {
        // not constructible
      }
    }

    return {
      pass,
      message: () =>
        `expected ${this.utils.printReceived(received)} ${pass ? "not " : ""}to be constructible`,
    };
  },

  toHaveObjectType(received: unknown, type: string) {
    try {
      const actual = Object.prototype.toString.call(received);
      const pass = actual === type;
      return {
        pass,
        message: () =>
          `expected ${this.utils.printReceived(received)} ${pass ? "not " : ""}to have object type ${this.utils.printExpected(type)}, but has ${this.utils.printReceived(actual)}`,
      };
    } catch {
      return {
        pass: false,
        message: () => `unable to get object type of ${this.utils.printReceived(received)}`,
      };
    }
  },

  toHaveParameters(received: unknown, required: number, optional: number) {
    if (typeof received !== "function") {
      return {
        pass: false,
        message: () => `expected ${this.utils.printReceived(received)} to be a function`,
      };
    }

    const actualRequired = received.length;
    const actualOptional = parameters(received) - actualRequired;
    const pass = actualRequired === required && actualOptional === optional;

    return {
      pass,
      message: () =>
        `expected ${this.utils.printReceived(received)} ${pass ? "not " : ""}to have ${this.utils.printExpected(required)}/${this.utils.printExpected(optional)} required/optional parameters, but it has ${this.utils.printReceived(actualRequired)}/${this.utils.printReceived(actualOptional)}`,
    };
  },
});
