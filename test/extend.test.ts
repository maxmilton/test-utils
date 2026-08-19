// oxlint-disable max-classes-per-file id-length

import { describe, expect, spyOn, test } from "bun:test";
import * as extendExports from "../src/extend.ts";
import { parameters } from "../src/extend.ts";

describe("exports", () => {
  const exports = ["parameters"];

  test.each(exports)('has "%s" named export', (exportName) => {
    expect.assertions(1);
    expect(extendExports).toHaveProperty(exportName);
  });

  test("does not have a default export", () => {
    expect.assertions(1);
    expect(extendExports).not.toHaveProperty("default");
  });

  test("does not export anything else", () => {
    expect.assertions(1);
    expect(Object.keys(extendExports)).toHaveLength(exports.length);
  });
});

describe("matcher: toBePlainObject", () => {
  const plainObjects = [{}, { foo: "bar" }, Object.create(null), Object.create({}), new Object()];
  const notPlainObjects = [
    null,
    // oxlint-disable-next-line unicorn/no-new-array
    new Array(1),
    [[{}]], // double array due to quirk of bun test; resolves to [{}]
    [[null]], // double array due to quirk of bun test; resolves to [null]
    () => {},
    // oxlint-disable-next-line no-new-func typescript/no-implied-eval
    new Function(),
    Function,
    Object,
    /(?:)/u,
    new Date(),
    // oxlint-disable-next-line unicorn/error-message
    new Error(),
    new Map(),
    new Set(),
    new WeakMap(),
    new WeakSet(),
    // oxlint-disable-next-line promise/avoid-new
    new Promise(() => {}),
    new Int8Array(),
  ];
  const notObjects = [
    "Hello",
    123,
    true,
    false,
    undefined,
    Symbol("sym"),
    // oxlint-disable-next-line unicorn/prefer-bigint-literals
    BigInt(1234),
    // oxlint-disable-next-line unicorn/prefer-number-properties
    NaN,
    Infinity,
  ];

  test("expect() has matcher", () => {
    expect.assertions(1);
    expect(expect()).toHaveProperty("toBePlainObject");
  });

  test("matcher is a function", () => {
    expect.assertions(2);
    const matcher = expect().toBePlainObject;
    expect(matcher).toBeFunction();
    expect(matcher).not.toBeClass();
  });

  test.each(plainObjects)("matches plain object %#", (item) => {
    expect.assertions(1);
    expect(item).toBePlainObject();
  });

  test.each(notPlainObjects)("does not match non-plain object %#", (item) => {
    expect.assertions(1);
    expect(item).not.toBePlainObject();
  });

  test.each(notObjects)("does not match non-object %#", (item) => {
    expect.assertions(1);
    expect(item).not.toBePlainObject();
  });
});

describe("matcher: toBeClass", () => {
  // oxlint-disable-next-line typescript/no-extraneous-class
  class Foo {}
  const classes = [
    Foo,
    class Bar extends Foo {},
    // oxlint-disable-next-line typescript/no-extraneous-class
    class {},
    class extends Foo {},
    Foo.prototype.constructor,
  ];
  const notClasses = [
    "Hello",
    123,
    true,
    false,
    undefined,
    Symbol("sym"),
    // oxlint-disable-next-line unicorn/prefer-bigint-literals
    BigInt(1234),
    // oxlint-disable-next-line unicorn/prefer-number-properties
    NaN,
    Infinity,
    {},
    { foo: "bar" },
    Object.create(null),
    Object.create({}),
    // oxlint-disable-next-line no-object-constructor
    new Object(),
    null,
    // oxlint-disable-next-line unicorn/no-new-array
    new Array(1),
    [[{}]], // double array due to quirk of bun test; resolves to [{}]
    [[null]], // double array due to quirk of bun test; resolves to [null]
    function foo() {},
    () => {},
    // oxlint-disable-next-line no-new-func typescript/no-implied-eval
    new Function(),
    Function,
    Object,
    /(?:)/u,
    new Date(),
    // oxlint-disable-next-line unicorn/error-message
    new Error(),
    new Map(),
    new Set(),
    new WeakMap(),
    new WeakSet(),
    // oxlint-disable-next-line promise/avoid-new
    new Promise(() => {}),
    new Int8Array(),

    // XXX: These are built-in classes but accessing directly calls their
    // constructor, so they behave like functions.
    Function,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Symbol,
    BigInt,
    Buffer,
  ];

  test("expect() has matcher", () => {
    expect.assertions(1);
    expect(expect()).toHaveProperty("toBeClass");
  });

  test("matcher is a function", () => {
    expect.assertions(2);
    const matcher = expect().toBeClass;
    expect(matcher).toBeFunction();
    expect(matcher).not.toBeClass();
  });

  test.each(classes)("matches class %#: %p", (item) => {
    expect.assertions(1);
    expect(item).toBeClass();
  });

  test.each(notClasses)("does not match non-class %#: %p", (item) => {
    expect.assertions(1);
    expect(item).not.toBeClass();
  });
});

describe("matcher: toBeConstructible", () => {
  // Reflect.construct is used in the matcher; sanity check to catch bun bugs.
  describe("Reflect.construct sanity", () => {
    test("ordinary functions are constructible", () => {
      function Foo() {}
      // oxlint-disable-next-line typescript/no-unsafe-return
      expect(() => Reflect.construct(Object, [], Foo)).not.toThrow();
    });

    test("classes are constructible", () => {
      // oxlint-disable-next-line typescript/no-extraneous-class
      class Foo {}
      expect(() => Reflect.construct(Object, [], Foo)).not.toThrow();
    });

    test("built-in constructors are constructible", () => {
      expect(() => Reflect.construct(Object, [], Object)).not.toThrow();
      expect(() => Reflect.construct(Object, [], Array)).not.toThrow();
      expect(() => Reflect.construct(Object, [], Map)).not.toThrow();
      expect(() => Reflect.construct(Object, [], Promise)).not.toThrow();
    });

    test("bound constructors are constructible", () => {
      function Foo() {}
      // oxlint-disable-next-line typescript/no-extraneous-class
      class Bar {}
      // oxlint-disable-next-line typescript/no-unsafe-return
      expect(() => Reflect.construct(Object, [], Foo.bind(null))).not.toThrow();
      expect(() => Reflect.construct(Object, [], Bar.bind(null))).not.toThrow();
    });

    test("arrow functions are not constructible", () => {
      // oxlint-disable-next-line typescript/no-unsafe-return
      expect(() => Reflect.construct(Object, [], () => {})).toThrow(TypeError);
    });

    test("async functions are not constructible", () => {
      // oxlint-disable-next-line typescript/no-unsafe-return func-names prefer-arrow-callback
      expect(() => Reflect.construct(Object, [], async function () {})).toThrow(TypeError);
    });

    test("generator functions are not constructible", () => {
      // oxlint-disable-next-line typescript/no-unsafe-return func-names
      expect(() => Reflect.construct(Object, [], function* () {})).toThrow(TypeError);
    });

    test("async generator functions are not constructible", () => {
      // oxlint-disable-next-line typescript/no-unsafe-return func-names
      expect(() => Reflect.construct(Object, [], async function* () {})).toThrow(TypeError);
    });

    test("object methods are not constructible", () => {
      const object = { foo() {} };
      // oxlint-disable-next-line typescript/no-unsafe-return typescript/unbound-method
      expect(() => Reflect.construct(Object, [], object.foo)).toThrow(TypeError);
    });

    test("bound non-constructors remain non-constructible", () => {
      // oxlint-disable-next-line no-shadow
      const foo = () => {};
      // oxlint-disable-next-line typescript/no-unsafe-return
      expect(() => Reflect.construct(Object, [], foo.bind(null))).toThrow(TypeError);
    });

    test("Symbol and BigInt have [[Construct]] but reject construction", () => {
      expect.assertions(4);
      expect(Symbol).toBeConstructible();
      expect(BigInt).toBeConstructible();
      // oxlint-disable-next-line typescript/no-unsafe-return
      expect(() => Reflect.construct(Symbol, [])).toThrow(TypeError);
      // oxlint-disable-next-line typescript/no-unsafe-return
      expect(() => Reflect.construct(BigInt, [])).toThrow(TypeError);
    });

    test("non-functions are not constructible", () => {
      // oxlint-disable-next-line typescript/no-unsafe-return typescript/ban-types typescript/no-unsafe-function-type
      expect(() => Reflect.construct(Object, [], null as unknown as Function)).toThrow(TypeError);
      // oxlint-disable-next-line typescript/no-unsafe-return typescript/ban-types typescript/no-unsafe-function-type
      expect(() => Reflect.construct(Object, [], {} as Function)).toThrow(TypeError);
      // oxlint-disable-next-line typescript/no-unsafe-return typescript/ban-types typescript/no-unsafe-function-type
      expect(() => Reflect.construct(Object, [], 123 as unknown as Function)).toThrow(TypeError);
    });
  });

  // oxlint-disable-next-line typescript/no-extraneous-class
  class Foo {}
  function foo() {}
  const constructible = [
    // Classes.
    Foo,
    class Bar extends Foo {},
    // oxlint-disable-next-line typescript/no-extraneous-class
    class {},
    class extends Foo {},
    Foo.prototype.constructor,

    // Ordinary functions have [[Construct]].
    foo,
    function bar() {},
    // oxlint-disable-next-line func-names
    function () {},
    // oxlint-disable-next-line no-new-func typescript/no-implied-eval
    new Function(),

    // Bound functions preserve [[Construct]] when their target has it.
    foo.bind(null),
    Foo.bind(null),

    // Built-in constructors.
    Function,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Symbol,
    BigInt,
    Date,
    RegExp,
    Error,
    TypeError,
    RangeError,
    ReferenceError,
    SyntaxError,
    URIError,
    EvalError,

    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,

    ArrayBuffer,
    DataView,

    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,

    // Node/Bun.
    Buffer,

    // Web platform constructors available in Bun.
    Blob,
    File,
    Headers,
    Request,
    Response,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    AbortController,
  ];

  const notConstructible = [
    // Primitives.
    "Hello",
    123,
    true,
    false,
    undefined,
    null,
    Symbol("sym"),
    // oxlint-disable-next-line unicorn/prefer-bigint-literals
    BigInt(1234),
    // oxlint-disable-next-line unicorn/prefer-number-properties
    NaN,
    Infinity,

    // Objects / instances.
    {},
    { foo: "bar" },
    Object.create(null),
    Object.create({}),
    // oxlint-disable-next-line no-object-constructor
    new Object(),
    // oxlint-disable-next-line unicorn/no-new-array
    new Array(1),
    [[{}]],
    [[null]],
    /(?:)/u,
    new Date(),
    // oxlint-disable-next-line unicorn/error-message
    new Error(),
    new Map(),
    new Set(),
    new WeakMap(),
    new WeakSet(),
    // oxlint-disable-next-line promise/avoid-new
    new Promise(() => {}),
    new Int8Array(),

    // Callable but without [[Construct]].
    () => {},
    // oxlint-disable-next-line func-names
    async function () {},
    async () => {},
    // oxlint-disable-next-line func-names
    function* () {},
    // oxlint-disable-next-line func-names
    async function* () {},

    // Object methods are callable but not constructors.
    // oxlint-disable-next-line typescript/unbound-method
    { foo() {} }.foo,

    // Bound non-constructible functions remain non-constructible.
    // oxlint-disable-next-line no-extra-bind
    (() => {}).bind(null),
    // oxlint-disable-next-line no-extra-bind
    (async () => {}).bind(null),

    // Non-callable namespace objects.
    Math,
    JSON,
    Reflect,
    Atomics,
  ];

  test("expect() has matcher", () => {
    expect.assertions(1);
    expect(expect()).toHaveProperty("toBeConstructible");
  });

  test("matcher is a function", () => {
    expect.assertions(2);
    const matcher = expect().toBeConstructible;
    expect(matcher).toBeFunction();
    expect(matcher).not.toBeConstructible();
  });

  test("does not invoke the received constructor", () => {
    expect.assertions(2);
    let invoked = false;

    function ThrowingConstructor() {
      invoked = true;
      throw new Error("constructor invoked");
    }

    expect(ThrowingConstructor).toBeConstructible();
    expect(invoked).toBeFalse();
  });

  test("checks proxy [[Construct]] without invoking traps", () => {
    expect.assertions(2);
    function ConstructibleTarget() {}
    const constructibleProxy = new Proxy(ConstructibleTarget, {
      construct() {
        throw new Error("construct trap invoked");
      },
      get() {
        throw new Error("get trap invoked");
      },
    });
    const nonConstructibleProxy = new Proxy(() => {}, {});

    expect(constructibleProxy).toBeConstructible();
    expect(nonConstructibleProxy).not.toBeConstructible();
  });

  test.each(constructible)("matches constructible %#: %p", (item) => {
    expect.assertions(1);
    expect(item).toBeConstructible();
  });

  test.each(notConstructible)("does not match non-constructible %#: %p", (item) => {
    expect.assertions(1);
    expect(item).not.toBeConstructible();
  });
});

describe("matcher: toHaveObjectType", () => {
  const samples: [text: string, prototype: string, value: unknown][] = [
    ["null", "[object Null]", null],
    ["undefined", "[object Undefined]", undefined],
    ["true", "[object Boolean]", true],
    ["false", "[object Boolean]", false],
    ["-1", "[object Number]", -1],
    ["0", "[object Number]", 0],
    ["1", "[object Number]", 1],
    ["Number.MAX_VALUE", "[object Number]", Number.MAX_VALUE],
    ["Infinity", "[object Number]", Infinity],
    ["-Infinity", "[object Number]", -Infinity],
    // oxlint-disable-next-line unicorn/prefer-number-properties
    ["NaN", "[object Number]", NaN],
    ["Symbol('sym')", "[object Symbol]", Symbol("sym")],
    // oxlint-disable-next-line unicorn/prefer-bigint-literals
    ["BigInt(1234)", "[object BigInt]", BigInt(1234)],
    ["[]", "[object Array]", []],
    ["{}", "[object Object]", {}],
    ["<empty string>", "[object String]", ""],
    ["Function", "[object Function]", Function],
    ["Object", "[object Function]", Object],
    ["Array", "[object Function]", Array],
    ["String", "[object Function]", String],
    ["Number", "[object Function]", Number],
    ["Boolean", "[object Function]", Boolean],
    ["Symbol", "[object Function]", Symbol],
    ["BigInt", "[object Function]", BigInt],
    ["Buffer", "[object Function]", Buffer],
    ["Function.prototype", "[object Function]", Function.prototype],
    ["new Int8Array()", "[object Int8Array]", new Int8Array()],
    ["new Uint8Array()", "[object Uint8Array]", new Uint8Array()],
    ["new Uint8ClampedArray()", "[object Uint8ClampedArray]", new Uint8ClampedArray()],
    ["new Int16Array()", "[object Int16Array]", new Int16Array()],
    ["new Uint16Array()", "[object Uint16Array]", new Uint16Array()],
    ["new Int32Array()", "[object Int32Array]", new Int32Array()],
    ["new Uint32Array()", "[object Uint32Array]", new Uint32Array()],
    ["new Float32Array()", "[object Float32Array]", new Float32Array()],
    ["new Float64Array()", "[object Float64Array]", new Float64Array()],
    ["new BigInt64Array()", "[object BigInt64Array]", new BigInt64Array()],
    ["new BigUint64Array()", "[object BigUint64Array]", new BigUint64Array()],
    ["new Map()", "[object Map]", new Map()],
    ["new Set()", "[object Set]", new Set()],
    ["new WeakMap()", "[object WeakMap]", new WeakMap()],
    ["new WeakSet()", "[object WeakSet]", new WeakSet()],
    // oxlint-disable-next-line promise/avoid-new
    ["new Promise(() => {})", "[object Promise]", new Promise(() => {})],
    ["new Date()", "[object Date]", new Date()],
    ["/(?:)/", "[object RegExp]", /(?:)/u],
    // oxlint-disable-next-line unicorn/error-message
    ["new Error()", "[object Error]", new Error()],
    ["Math", "[object Math]", Math],
    ["JSON", "[object JSON]", JSON],
    ["Intl", "[object Intl]", Intl],
    ["Object.prototype", "[object Object]", Object.prototype],
    ["Array.prototype", "[object Array]", Array.prototype],
    ["String.prototype", "[object String]", String.prototype],
    ["Number.prototype", "[object Number]", Number.prototype],
    ["Boolean.prototype", "[object Boolean]", Boolean.prototype],
    ["Symbol.prototype", "[object Symbol]", Symbol.prototype],
    ["BigInt.prototype", "[object BigInt]", BigInt.prototype],
    // TODO: Should be "[object console]" but happy-dom returns "[object Object]".
    // ["console", "[object console]", console],
    ["console", "[object Object]", console],
    // TODO: Should be "[object Window]" but happy-dom returns "[object EventTarget]".
    // ["window", "[object Window]", window],
    ["window", "[object EventTarget]", window],
    ["document", "[object HTMLDocument]", document],
    ["process", "[object process]", process],
    ["global", "[object Object]", global],
    ["globalThis", "[object Object]", globalThis],
    // TODO: Should be "[object Window]" but happy-dom returns "[object Object]".
    // ["self", "[object Window]", self],
    ["self", "[object Object]", self],
    ["this", "[object Null]", this],
    ["* import", "[object Module]", extendExports], // bun only
  ] as const;

  test("expect() has matcher", () => {
    expect.assertions(1);
    expect(expect()).toHaveProperty("toHaveObjectType");
  });

  test("matcher is a function", () => {
    expect.assertions(2);
    const matcher = expect().toHaveObjectType;
    expect(matcher).toBeFunction();
    expect(matcher).not.toBeClass();
  });

  test.each(samples)('%s has prototype "%s"', (_text, prototype, value) => {
    expect.assertions(1);
    expect(value).toHaveObjectType(prototype);
  });
});

describe("matcher: toHaveParameters", () => {
  const funcs: [required: number, optional: number, func: unknown][] = [
    // oxlint-disable func-names
    [0, 0, function foo() {}],
    [1, 0, function foo(_a: unknown) {}],
    [0, 1, function foo(_a = 1) {}],
    [2, 0, function foo(_a: unknown, _b: unknown) {}],
    [1, 1, function foo(_a: unknown, _b = 1) {}],
    [0, 2, function foo(_a = 1, _b = 2) {}],
    [0, 3, function foo(_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, function () {}],
    [1, 0, function (_a: unknown) {}],
    [0, 1, function (_a = 1) {}],
    [2, 0, function (_a: unknown, _b: unknown) {}],
    [1, 1, function (_a: unknown, _b = 1) {}],
    [0, 2, function (_a = 1, _b = 2) {}],
    [0, 3, function (_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, () => {}],
    [1, 0, (_a: unknown) => {}],
    [0, 1, (_a = 1) => {}],
    [2, 0, (_a: unknown, _b: unknown) => {}],
    [1, 1, (_a: unknown, _b = 1) => {}],
    [0, 2, (_a = 1, _b = 2) => {}],
    [0, 3, (_a = 1, _b = 2, ..._rest: unknown[]) => {}],
    [0, 0, function* foo() {}],
    [1, 0, function* foo(_a: unknown) {}],
    [0, 1, function* foo(_a = 1) {}],
    [2, 0, function* foo(_a: unknown, _b: unknown) {}],
    [1, 1, function* foo(_a: unknown, _b = 1) {}],
    [0, 2, function* foo(_a = 1, _b = 2) {}],
    [0, 3, function* foo(_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, async function foo() {}],
    [1, 0, async function foo(_a: unknown) {}],
    [0, 1, async function foo(_a = 1) {}],
    [2, 0, async function foo(_a: unknown, _b: unknown) {}],
    [1, 1, async function foo(_a: unknown, _b = 1) {}],
    [0, 2, async function foo(_a = 1, _b = 2) {}],
    [0, 3, async function foo(_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, async function* foo() {}],
    [1, 0, async function* foo(_a: unknown) {}],
    [0, 1, async function* foo(_a = 1) {}],
    [2, 0, async function* foo(_a: unknown, _b: unknown) {}],
    [1, 1, async function* foo(_a: unknown, _b = 1) {}],
    [0, 2, async function* foo(_a = 1, _b = 2) {}],
    [0, 3, async function* foo(_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, function* () {}],
    [1, 0, function* (_a: unknown) {}],
    [0, 1, function* (_a = 1) {}],
    [2, 0, function* (_a: unknown, _b: unknown) {}],
    [1, 1, function* (_a: unknown, _b = 1) {}],
    [0, 2, function* (_a = 1, _b = 2) {}],
    [0, 3, function* (_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, async function () {}],
    [1, 0, async function (_a: unknown) {}],
    [0, 1, async function (_a = 1) {}],
    [2, 0, async function (_a: unknown, _b: unknown) {}],
    [1, 1, async function (_a: unknown, _b = 1) {}],
    [0, 2, async function (_a = 1, _b = 2) {}],
    [0, 3, async function (_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, async function* () {}],
    [1, 0, async function* (_a: unknown) {}],
    [0, 1, async function* (_a = 1) {}],
    [2, 0, async function* (_a: unknown, _b: unknown) {}],
    [1, 1, async function* (_a: unknown, _b = 1) {}],
    [0, 2, async function* (_a = 1, _b = 2) {}],
    [0, 3, async function* (_a = 1, _b = 2, ..._rest: unknown[]) {}],
    [0, 0, async () => {}],
    [1, 0, async (_a: unknown) => {}],
    [0, 1, async (_a = 1) => {}],
    [2, 0, async (_a: unknown, _b: unknown) => {}],
    [1, 1, async (_a: unknown, _b = 1) => {}],
    [0, 2, async (_a = 1, _b = 2) => {}],
    [0, 3, async (_a = 1, _b = 2, ..._rest: unknown[]) => {}],
    // oxlint-enable func-names
  ];

  test("expect() has matcher", () => {
    expect.assertions(1);
    expect(expect()).toHaveProperty("toHaveParameters");
  });

  test("matcher is a function", () => {
    expect.assertions(2);
    const matcher = expect().toHaveParameters;
    expect(matcher).toBeFunction();
    expect(matcher).not.toBeClass();
  });

  test.each(funcs)(
    "matches function %# with %i required and %i optional parameters",
    (required, optional, func) => {
      expect.assertions(2);
      expect(func).toHaveParameters(required, optional);
      expect(func).toHaveLength(required);
    },
  );

  // TODO: Add test for failing case when passing non-function once bun supports it
});

describe("parameters", () => {
  describe("no parameters", () => {
    test("simple function", () => {
      expect.assertions(1);
      function foo() {}
      expect(parameters(foo)).toBe(0);
    });

    test("generator function", () => {
      expect.assertions(1);
      function* foo() {
        yield null;
      }
      expect(parameters(foo)).toBe(0);
    });

    test("async function", () => {
      expect.assertions(1);
      async function foo() {
        await Promise.resolve();
      }
      expect(parameters(foo)).toBe(0);
    });

    test("async generator function", () => {
      expect.assertions(1);
      async function* foo() {
        await Promise.resolve();
        yield null;
      }
      expect(parameters(foo)).toBe(0);
    });

    test("arrow function", () => {
      expect.assertions(1);
      const foo = () => {};
      expect(parameters(foo)).toBe(0);
    });

    test("async arrow function", () => {
      expect.assertions(1);
      const foo = async () => {
        await Promise.resolve();
      };
      expect(parameters(foo)).toBe(0);
    });
  });

  describe("default parameters", () => {
    test("basic", () => {
      expect.assertions(1);
      function foo(_a = 1, _b = 2) {}
      expect(parameters(foo)).toBe(2);
    });

    test("scoped variables", () => {
      expect.assertions(1);
      const x = 1;
      const y = 2;
      function foo(_a = x, _b = y) {}
      expect(parameters(foo)).toBe(2);
    });

    // FIXME: How to test this? Bun trims the whitespace
    test.skip("excess whitespace", () => {
      expect.assertions(1);
      // oxfmt-ignore
      function   foo (  _a  =
          1  ,
         _b = 2

         // x

        ) {}
      // console.log('#####', foo.toString());
      expect(parameters(foo)).toBe(2);
    });
  });

  describe("rest parameters", () => {
    test("case 1", () => {
      expect.assertions(1);
      function foo(..._args: unknown[]) {}
      expect(parameters(foo)).toBe(1);
    });

    test("case 2", () => {
      expect.assertions(1);
      function foo(_a: unknown, _b: unknown, ..._args: unknown[]) {}
      expect(parameters(foo)).toBe(3);
    });
  });

  describe("destructured parameters", () => {
    describe("Object destructuring", () => {
      test("case 1", () => {
        expect.assertions(1);
        function foo({ _a, _b }: Record<string, unknown>) {}
        expect(parameters(foo)).toBe(1);
      });

      test("case 2", () => {
        expect.assertions(1);
        function foo({ _a, _b }: Record<string, unknown> = {}) {}
        expect(parameters(foo)).toBe(1);
      });
    });

    describe("Array destructuring", () => {
      test("case 1", () => {
        expect.assertions(1);
        function foo([_a, _b]: unknown[]) {}
        expect(parameters(foo)).toBe(1);
      });

      test("case 2", () => {
        expect.assertions(1);
        function foo([_a, _b]: unknown[] = []) {}
        expect(parameters(foo)).toBe(1);
      });
    });
  });

  describe("nested destructuring", () => {
    test("case 1", () => {
      expect.assertions(1);
      // @ts-expect-error - explicit test case
      function foo({ a: { _b, _c } }) {}
      expect(parameters(foo)).toBe(1);
    });

    test("case 2", () => {
      expect.assertions(1);
      // @ts-expect-error - explicit test case
      function foo([_a, [_b, _c]]) {}
      expect(parameters(foo)).toBe(1);
    });

    test("case 3", () => {
      expect.assertions(1);
      // @ts-expect-error - explicit test case
      function foo({ a: { _b, _c } }, [[_d, _e]]) {}
      expect(parameters(foo)).toBe(2);
    });
  });

  describe("default values in destructuring", () => {
    test("case 1", () => {
      expect.assertions(1);
      function foo({ _a = 1, _b = 2 }: Record<string, unknown> = {}) {}
      expect(parameters(foo)).toBe(1);
    });

    test("case 2", () => {
      expect.assertions(1);
      function foo([_a = 1, _b = 2]: unknown[] = []) {}
      expect(parameters(foo)).toBe(1);
    });

    test("case 3", () => {
      expect.assertions(1);
      function foo({ _a = 1, _b = 2 }, [_c = 3, _d = 4]) {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 4", () => {
      expect.assertions(1);
      // oxlint-disable-next-line typescript/no-useless-default-assignment unicorn/no-object-as-default-parameter
      function foo({ _a = 1, _b = 2 } = { _a: 5 }, [_c = 3, _d = 4] = [6]) {}
      expect(parameters(foo)).toBe(2);
    });
  });

  describe("trailing commas", () => {
    test("case 1", () => {
      expect.assertions(1);
      // oxfmt-ignore
      function foo(_a: unknown, _b: unknown,) {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 2", () => {
      expect.assertions(1);
      // oxfmt-ignore
      function foo(_a: unknown, _b: unknown, ) {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 3", () => {
      expect.assertions(1);
      // oxfmt-ignore
      function foo(
        _a: unknown,
        _b: unknown,
      ) {}
      expect(parameters(foo)).toBe(2);
    });
  });

  describe("parameter without parentheses in arrow functions", () => {
    test("case 1", () => {
      expect.assertions(1);
      // oxfmt-ignore
      const foo: ((_a: unknown) => void) = _a => {};
      expect(parameters(foo)).toBe(1);
    });
  });

  describe("multiple arrow function syntaxes", () => {
    test("case 1", () => {
      expect.assertions(1);
      const foo = (_a: unknown, _b: unknown) => {};
      expect(parameters(foo)).toBe(2);
    });

    test("case 2", () => {
      expect.assertions(1);
      const foo = (_a = 1, _b = 2) => {};
      expect(parameters(foo)).toBe(2);
    });

    test("case 3", () => {
      expect.assertions(1);
      const foo = ([_a, _b]: unknown[]) => {};
      expect(parameters(foo)).toBe(1);
    });
  });

  describe("strings within parameters", () => {
    test("case 1", () => {
      expect.assertions(1);
      function foo(_a = "", _b = "") {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 2", () => {
      expect.assertions(1);
      function foo(_a = ",", _b = ",,,") {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 3", () => {
      expect.assertions(1);
      function foo(_a = ")", _b = ")") {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 3", () => {
      expect.assertions(1);
      function foo(_a = "(){}[]({[]})", _b = "(){}[]({[]})") {}
      expect(parameters(foo)).toBe(2);
    });

    test("nested string template literals simple", () => {
      expect.assertions(1);
      // NOTE: Bun optimizes simple template literals into a single string
      // oxlint-disable-next-line typescript/no-unnecessary-template-expression
      function foo(_a = `x,${`y,${`z,`},`},`, _b = ``) {}
      expect(parameters(foo)).toBe(2);
    });

    // FIXME: Don't skip once we support nested string template literals.
    test.skip("nested string template literals with interpolation", () => {
      expect.assertions(1);
      const x = "x";
      const y = "y";
      const z = "z";
      // oxlint-disable-next-line typescript/no-unnecessary-template-expression
      function foo(_a = `${x},${`,${y},${`,${z},`},`},`) {}
      expect(parameters(foo)).toBe(1);
    });

    test("escaped '", () => {
      expect.assertions(1);
      function foo(_a = "'", _b = "'") {}
      expect(parameters(foo)).toBe(2);
    });

    test('escaped "', () => {
      expect.assertions(1);
      // oxfmt-ignore
      function foo(_a = "\"", _b = "\"") {}
      expect(parameters(foo)).toBe(2);
    });

    test("escaped `", () => {
      expect.assertions(1);
      function foo(_a = `\``, _b = `\``) {}
      expect(parameters(foo)).toBe(2);
    });

    test(String.raw`escaped \ case 1`, () => {
      expect.assertions(1);
      // biome-ignore format: explicit test case
      function foo(_a = "\\", _b = "\\") {}
      expect(parameters(foo)).toBe(2);
    });

    test(String.raw`escaped \ case 2`, () => {
      expect.assertions(1);
      // biome-ignore format: explicit test case
      function foo(_a = "bar\\", _b = "baz\\") {}
      expect(parameters(foo)).toBe(2);
    });

    test("escaped all", () => {
      expect.assertions(1);
      // oxlint-disable-next-line no-useless-escape
      function foo(_a = "'\"\`", _b = "") {}
      expect(parameters(foo)).toBe(2);
    });
  });

  describe("functions within parameters", () => {
    test("case 1", () => {
      expect.assertions(1);
      function foo(_a = () => {}) {}
      expect(parameters(foo)).toBe(1);
    });

    test("case 2", () => {
      expect.assertions(1);
      // oxlint-disable-next-line default-param-last
      function foo(_a = () => {}, _b: unknown) {}
      expect(parameters(foo)).toBe(2);
    });

    test("case 3", () => {
      expect.assertions(1);
      function foo(_a = () => {}, _b = Date.now(), _c = Date.now()) {}
      expect(parameters(foo)).toBe(3);
    });
  });

  describe("functions as parameters", () => {
    test("case 1", () => {
      expect.assertions(1);
      function foo(_callback: () => void) {}
      expect(parameters(foo)).toBe(1);
    });
  });

  describe("parameters with expressions", () => {
    test("case 1", () => {
      expect.assertions(1);
      function foo(_a = 1 + 2) {}
      expect(parameters(foo)).toBe(1);
    });
  });

  describe("complex combinations", () => {
    test("case 1", () => {
      expect.assertions(1);
      const z = 3;
      async function foo(
        // oxlint-disable default-param-last
        // oxlint-disable-next-line unicorn/no-object-as-default-parameter
        _a = { x: 1, y: 2, z },
        _b = [1, 2, 3],
        _c = () => {},
        _d = Date.now(),
        _e = z,
        _f = z + 1 - (2 * 3) / 4,
        // oxlint-disable-next-line unicorn/prefer-number-coercion
        _g = Number.parseInt("123.456", 10),
        _h: unknown,
        _i = `,${String(z)},${String(z)},${String(z)},`,
        _j = '{{[[(())]]}}),),],],},}"""```\\\'',
        // oxlint-enable default-param-last
      ) {
        await Promise.resolve();
      }
      expect(parameters(foo)).toBe(10);
    });
  });

  describe("scope and shadowing", () => {
    test("case 1", () => {
      expect.assertions(1);
      // oxlint-disable-next-line no-unused-vars
      const x = 1;
      // oxlint-disable-next-line no-shadow
      function foo(x: unknown) {
        // oxlint-disable-next-line no-console
        console.log(x);
      }
      expect(parameters(foo)).toBe(1);
    });
  });

  // describe("parameters with the eval keyword", () => {
  //   test("case 1", () => {
  //     expect.assertions(1);
  //     function foo(a, eval) {}
  //     expect(parameters(foo)).toBe(2);
  //   });
  // });

  describe("non-ASCII identifiers", () => {
    test("case 1", () => {
      expect.assertions(1);
      // oxlint-disable-next-line no-unused-vars
      function 𝑓𝑜𝑜(𝑎: unknown, 𝑏: unknown) {}
      expect(parameters(𝑓𝑜𝑜)).toBe(2);
    });

    test("case 2", () => {
      expect.assertions(1);
      // oxlint-disable-next-line no-unused-vars
      const 𝑓𝑜𝑜 = (𝑎: unknown, 𝑏: unknown) => {};
      expect(parameters(𝑓𝑜𝑜)).toBe(2);
    });
  });

  // describe("invalid parameter lists", () => {
  //   test("case 1", () => {
  //     expect.assertions(1);
  //     function foo(_a: unknown, _a: unknown) {} // Syntax error in strict mode
  //     expect(parameters(foo)).toBe(2);
  //   });
  // });

  // describe("strict mode considerations", () => {
  //   test("case 1", () => {
  //     expect.assertions(1);
  //     "use strict";
  //     function foo(_a: unknown, _a: unknown) {} // Syntax error
  //     expect(parameters(foo)).toBe(2);
  //   });
  // });

  // describe("parameter names matching reserved words", () => {
  //   test("case 1", () => {
  //     expect.assertions(1);
  //     function foo(class, delete, if) {} // Syntax error
  //     expect(parameters(foo)).toBe(3);
  //   });
  // });

  describe("using arguments object", () => {
    test("basic", () => {
      expect.assertions(1);
      function foo(_a: unknown, _b: unknown) {
        // oxlint-disable-next-line no-console prefer-rest-params
        console.log(arguments);
      }
      expect(parameters(foo)).toBe(2);
    });
  });

  describe("edge cases in function declaration and expression", () => {
    test("function declaration and expression", () => {
      expect.assertions(1);
      const foo = function foo(_a: unknown, _b: unknown) {};
      expect(parameters(foo)).toBe(2);
    });

    test("generator function declaration and expression", () => {
      expect.assertions(1);
      const foo = function* foo(_a: unknown, _b: unknown) {
        yield null;
      };
      expect(parameters(foo)).toBe(2);
    });

    test("async function declaration and expression", () => {
      expect.assertions(1);
      const foo = async function foo(_a: unknown, _b: unknown) {
        await Promise.resolve();
      };
      expect(parameters(foo)).toBe(2);
    });

    test("async generator function declaration and expression", () => {
      expect.assertions(1);
      const foo = async function* foo(_a: unknown, _b: unknown) {
        await Promise.resolve();
        yield null;
      };
      expect(parameters(foo)).toBe(2);
    });

    test("function expression", () => {
      expect.assertions(1);
      const bar = function (_a: unknown, _b: unknown) {};
      expect(parameters(bar)).toBe(2);
    });

    test("generator function expression", () => {
      expect.assertions(1);
      const bar = function* (_a: unknown, _b: unknown) {
        yield null;
      };
      expect(parameters(bar)).toBe(2);
    });

    test("async function expression", () => {
      expect.assertions(1);
      const bar = async function (_a: unknown, _b: unknown) {
        await Promise.resolve();
      };
      expect(parameters(bar)).toBe(2);
    });

    test("async generator function expression", () => {
      expect.assertions(1);
      const bar = async function* (_a: unknown, _b: unknown) {
        await Promise.resolve();
        yield null;
      };
      expect(parameters(bar)).toBe(2);
    });

    test("arrow function expression", () => {
      expect.assertions(1);
      const bar = (_a: unknown, _b: unknown) => {};
      expect(parameters(bar)).toBe(2);
    });

    test("async arrow function expression", () => {
      expect.assertions(1);
      const bar = async (_a: unknown, _b: unknown) => {
        await Promise.resolve();
      };
      expect(parameters(bar)).toBe(2);
    });

    test("function declaration", () => {
      expect.assertions(1);
      function baz(_a: unknown, _b: unknown) {}
      expect(parameters(baz)).toBe(2);
    });

    test("generator function declaration", () => {
      expect.assertions(1);
      function* baz(_a: unknown, _b: unknown) {
        yield null;
      }
      expect(parameters(baz)).toBe(2);
    });

    test("async function declaration", () => {
      expect.assertions(1);
      async function baz(_a: unknown, _b: unknown) {
        await Promise.resolve();
      }
      expect(parameters(baz)).toBe(2);
    });

    test("async generator function declaration", () => {
      expect.assertions(1);
      async function* baz(_a: unknown, _b: unknown) {
        await Promise.resolve();
        yield null;
      }
      expect(parameters(baz)).toBe(2);
    });
  });

  describe("classes", () => {
    test("basic", () => {
      expect.assertions(1);
      // oxlint-disable-next-line typescript/no-extraneous-class
      class Foo {
        // oxlint-disable-next-line no-useless-constructor
        constructor(_a: unknown, _b: unknown) {}
      }
      expect(parameters(Foo)).toBe(2);
    });

    test("no constructor parameters", () => {
      expect.assertions(1);
      // oxlint-disable-next-line typescript/no-extraneous-class
      class Foo {
        // oxlint-disable-next-line no-useless-constructor
        constructor() {}
      }
      expect(parameters(Foo)).toBe(0);
    });

    test("extends", () => {
      expect.assertions(3);
      // oxlint-disable-next-line typescript/no-extraneous-class
      class Foo {
        // oxlint-disable-next-line no-useless-constructor
        constructor(_a: unknown, _b: unknown) {}
      }
      class Bar extends Foo {
        // oxlint-disable-next-line no-unused-vars
        constructor(_a: unknown, _b: unknown, _c: unknown) {
          super(_a, _b);
        }
      }
      class Baz extends Bar {
        constructor() {
          super(null, null, null);
        }
      }
      expect(parameters(Foo)).toBe(2);
      expect(parameters(Bar)).toBe(3);
      expect(parameters(Baz)).toBe(0);
    });

    test("anonymous", () => {
      expect.assertions(1);
      expect(
        parameters(
          // oxlint-disable-next-line typescript/no-extraneous-class
          class {
            // oxlint-disable-next-line no-useless-constructor
            constructor(_a: unknown, _b: unknown) {}
          },
        ),
      ).toBe(2);
    });

    test("with no constructor function throw", () => {
      expect.assertions(4);
      // oxlint-disable-next-line typescript/no-extraneous-class
      class Foo {}
      class Bar extends Foo {}
      const error = new Error("Invalid function signature");
      expect(() => parameters(Foo)).toThrow(error);
      expect(() => parameters(Bar)).toThrow(error);
      // oxlint-disable-next-line typescript/no-extraneous-class
      expect(() => parameters(class {})).toThrow(error);
      expect(() => parameters(class extends Foo {})).toThrow(error);
    });

    describe("with methods", () => {
      test("case 1: constructor", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public method(this: void, _c: unknown, _d: unknown, _e: unknown) {}
        }
        expect(parameters(Foo)).toBe(2);
      });

      test("case 2: method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public method(this: void, _c: unknown, _d: unknown, _e: unknown) {}
        }
        const instance = new Foo(1, 2);
        expect(parameters(instance.method)).toBe(3);
      });

      test("case 3: method parameters no constructor", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public method(this: void, _a: unknown, _b: unknown, _c: unknown) {}
        }
        const instance = new Foo();
        expect(parameters(instance.method)).toBe(3);
      });

      test("case 4: generator method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public *method(this: void, _c: unknown, _d: unknown, _e: unknown) {
            yield null;
          }
        }
        const instance = new Foo(1, 2);
        expect(parameters(instance.method)).toBe(3);
      });

      test("case 5: async method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public async method(this: void, _c: unknown, _d: unknown, _e: unknown) {
            await Promise.resolve();
          }
        }
        const instance = new Foo(1, 2);
        expect(parameters(instance.method)).toBe(3);
      });

      test("case 6: async generator method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public async *method(this: void, _c: unknown, _d: unknown, _e: unknown) {
            await Promise.resolve();
            yield null;
          }
        }
        const instance = new Foo(1, 2);
        expect(parameters(instance.method)).toBe(3);
      });

      test("case 7: anonymous method parameters", () => {
        expect.assertions(1);
        const instance = new (class {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public method(this: void, _c: unknown, _d: unknown, _e: unknown) {}
        })(1, 2);
        expect(parameters(instance.method)).toBe(3);
      });

      test("case 8: field parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line class-methods-use-this
          public method = (_a: unknown, _b: unknown, _c: unknown) => {};
        }
        const instance = new Foo();
        expect(parameters(instance.method)).toBe(3);
      });
    });

    describe("with static methods", () => {
      test("case 1: constructor", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line typescript/no-invalid-void-type
          public static method(this: void, _c: unknown, _d: unknown, _e: unknown) {}
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
        }
        expect(parameters(Foo)).toBe(2);
      });

      test("case 2: method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line typescript/no-invalid-void-type
          public static method(this: void, _c: unknown, _d: unknown, _e: unknown) {}
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
        }
        expect(parameters(Foo.method)).toBe(3);
      });

      test("case 3: method parameters no constructor", () => {
        expect.assertions(1);
        // oxlint-disable-next-line typescript/no-extraneous-class
        class Foo {
          // oxlint-disable-next-line typescript/no-invalid-void-type
          public static method(this: void, _a: unknown, _b: unknown, _c: unknown) {}
        }
        expect(parameters(Foo.method)).toBe(3);
      });

      test("case 4: generator method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line typescript/no-invalid-void-type
          public static *method(this: void, _c: unknown, _d: unknown, _e: unknown) {
            yield null;
          }
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
        }
        expect(parameters(Foo.method)).toBe(3);
      });

      test("case 5: async method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line typescript/no-invalid-void-type
          public static async method(this: void, _c: unknown, _d: unknown, _e: unknown) {
            await Promise.resolve();
          }
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
        }
        expect(parameters(Foo.method)).toBe(3);
      });

      test("case 6: async generator method parameters", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line typescript/no-invalid-void-type
          public static async *method(this: void, _c: unknown, _d: unknown, _e: unknown) {
            await Promise.resolve();
            yield null;
          }
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
        }
        expect(parameters(Foo.method)).toBe(3);
      });

      test("case 7: anonymous method parameters", () => {
        expect.assertions(1);
        expect(
          parameters(
            class {
              // oxlint-disable-next-line typescript/no-invalid-void-type
              public static method(this: void, _c: unknown, _d: unknown, _e: unknown) {}
              // oxlint-disable-next-line no-useless-constructor
              constructor(_a: unknown, _b: unknown) {}
            }.method,
          ),
        ).toBe(3);
      });

      test("case 8: field parameters", () => {
        expect.assertions(1);
        // oxlint-disable-next-line typescript/no-extraneous-class
        class Foo {
          public static method = (_a: unknown, _b: unknown, _c: unknown) => {};
        }
        expect(parameters(Foo.method)).toBe(3);
      });
    });

    describe("with getters and setters", () => {
      test("case 1: constructor", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this
          public get prop(): null {
            return null;
          }
          // oxlint-disable-next-line class-methods-use-this
          public set prop(_c: unknown) {}
        }
        expect(parameters(Foo)).toBe(2);
      });

      test("case 2: getter/setter throws", () => {
        expect.assertions(1);
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this
          public get prop(): null {
            return null;
          }
          // oxlint-disable-next-line class-methods-use-this
          public set prop(_c: unknown) {}
        }
        const instance = new Foo(1, 2);
        expect(() => parameters(instance.prop)).toThrow(new TypeError("Expected a function"));
      });
    });

    describe("with computed property names", () => {
      test("case 1: constructor", () => {
        expect.assertions(1);
        const prop = "method";
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public [prop](this: void, _c: unknown, _d: unknown, _e: unknown) {}
        }
        expect(parameters(Foo)).toBe(2);
      });

      test("case 2: method parameters", () => {
        expect.assertions(1);
        const prop = "method";
        class Foo {
          // oxlint-disable-next-line no-useless-constructor
          constructor(_a: unknown, _b: unknown) {}
          // oxlint-disable-next-line class-methods-use-this typescript/no-invalid-void-type
          public [prop](this: void, _c: unknown, _d: unknown, _e: unknown) {}
        }
        const instance = new Foo(1, 2);
        expect(parameters(instance[prop])).toBe(3);
      });
    });
  });

  describe("native functions", () => {
    const builtins: [text: string, func: (...args: never[]) => unknown, length: number][] = [
      ["Function", Function, 1],
      ["Object", Object, 1],
      ["Array", Array, 1],
      ["String", String, 1],
      ["Number", Number, 1],
      ["Boolean", Boolean, 1],
      ["Symbol", Symbol, 0],
      ["BigInt", BigInt, 1],
      // @ts-expect-error - Buffer is callable (obsolete and deprecated Node.js API)
      ["Buffer", Buffer, 3],
      // @ts-expect-error - explicit test case
      ["Function.prototype", Function.prototype, 0],
      ["Array.prototype.splice", Array.prototype.splice, 2],
      ["Array.prototype.reduce", Array.prototype.reduce, 1],
      ["Array.prototype.reduceRight", Array.prototype.reduceRight, 1],
      // oxlint-disable-next-line typescript/unbound-method
      ["Function.prototype.apply", Function.prototype.apply, 2],
      // oxlint-disable-next-line typescript/unbound-method
      ["Function.prototype.call", Function.prototype.call, 1],
      // oxlint-disable-next-line typescript/unbound-method
      ["String.prototype.replace", String.prototype.replace, 2],
      // oxlint-disable-next-line typescript/unbound-method
      ["String.prototype.split", String.prototype.split, 2],
      // oxlint-disable-next-line typescript/unbound-method
      ["String.prototype.match", String.prototype.match, 1],
      // oxlint-disable-next-line typescript/unbound-method
      ["RegExp.prototype.exec", RegExp.prototype.exec, 1],
      ["Number.parseInt", Number.parseInt, 2],
      ["Symbol.for", Symbol.for, 1],
      ["JSON.parse", JSON.parse, 2],
      ["JSON.stringify", JSON.stringify, 3],
      ["Math.max", Math.max, 2],
      ["Math.min", Math.min, 2],
      ["Date.now", Date.now, 0],
      ["Intl.NumberFormat", Intl.NumberFormat, 0],
      ["Intl.DateTimeFormat", Intl.DateTimeFormat, 0],
      ["setTimeout", setTimeout, 1],
      ["clearTimeout", clearTimeout, 1],
      ["setInterval", setInterval, 1],
      ["clearInterval", clearInterval, 1],
      ["setImmediate", setImmediate, 1],
      ["clearImmediate", clearImmediate, 1],
      ["fetch", fetch, 2],
    ];

    test.each(builtins)("case %#: %s", (_, func, length) => {
      expect.assertions(3);
      using consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
      expect(parameters(func)).toBe(length);
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Optional parameters cannot be determined for native functions",
      );
    });
  });

  describe("non-functions", function closure(this: undefined) {
    const notFunctions: [text: string, value: unknown][] = [
      ["null", null],
      ["undefined", undefined],
      ["true", true],
      ["false", false],
      ["-1", -1],
      ["0", 0],
      ["1", 1],
      ["Number.MAX_VALUE", Number.MAX_VALUE],
      ["Infinity", Infinity],
      ["-Infinity", -Infinity],
      // oxlint-disable-next-line unicorn/prefer-number-properties
      ["NaN", NaN],
      ["Symbol('sym')", Symbol("sym")],
      // oxlint-disable-next-line unicorn/prefer-bigint-literals
      ["BigInt(1234)", BigInt(1234)],
      ["[]", []],
      ["{}", {}],
      ["<empty string>", ""],
      ["new Int8Array()", new Int8Array()],
      ["new Uint8Array()", new Uint8Array()],
      ["new Uint8ClampedArray()", new Uint8ClampedArray()],
      ["new Int16Array()", new Int16Array()],
      ["new Uint16Array()", new Uint16Array()],
      ["new Int32Array()", new Int32Array()],
      ["new Uint32Array()", new Uint32Array()],
      ["new Float32Array()", new Float32Array()],
      ["new Float64Array()", new Float64Array()],
      ["new BigInt64Array()", new BigInt64Array()],
      ["new BigUint64Array()", new BigUint64Array()],
      ["new Map()", new Map()],
      ["new Set()", new Set()],
      ["new WeakMap()", new WeakMap()],
      ["new WeakSet()", new WeakSet()],
      // oxlint-disable-next-line promise/avoid-new
      ["new Promise(() => {})", new Promise(() => {})],
      ["new Date()", new Date()],
      ["/(?:)/", /(?:)/u],
      // oxlint-disable-next-line unicorn/error-message
      ["new Error()", new Error()],
      ["Math", Math],
      ["JSON", JSON],
      ["Intl", Intl],
      ["Object.prototype", Object.prototype],
      ["Array.prototype", Array.prototype],
      ["String.prototype", String.prototype],
      ["Number.prototype", Number.prototype],
      ["Boolean.prototype", Boolean.prototype],
      ["Symbol.prototype", Symbol.prototype],
      ["BigInt.prototype", BigInt.prototype],
      ["console", console],
      ["window", window],
      ["document", document],
      ["process", process],
      ["global", global],
      ["globalThis", globalThis],
      ["self", self],
      ["this", this],
      // oxlint-disable-next-line prefer-rest-params
      ["arguments", arguments],
      ["new.target", new.target],

      // XXX: Although these are built-in classes, they have callable
      // constructors which make them functions when accessed directly.
      // ["Function", Function],
      // ["Object", Object],
      // ["Array", Array],
      // ["String", String],
      // ["Number", Number],
      // ["Boolean", Boolean],
      // ["Symbol", Symbol],
      // ["BigInt", BigInt],
      // ["Buffer", Buffer],
      // ["Function.prototype", Function.prototype],
    ] as const;

    test.each(notFunctions)("throws for %s", (_, value) => {
      expect.assertions(1);
      expect(() => parameters(value)).toThrow(new TypeError("Expected a function"));
    });
  });

  describe("built-in functions", () => {
    const builtIns: [text: string, value: unknown, length: number][] = [
      ["eval", eval, 1],
      ["fetch", fetch, 2],
      ["setTimeout", setTimeout, 1],
      ["clearTimeout", clearTimeout, 1],
      ["setInterval", setInterval, 1],
      ["clearInterval", clearInterval, 1],
      ["setImmediate", setImmediate, 1],
      ["clearImmediate", clearImmediate, 1],
      // oxlint-disable-next-line unicorn/prefer-module
      ["require", require, 1],
    ];

    test.each(builtIns)("has expected count for %s", (_, value, length) => {
      expect.assertions(1);
      // oxlint-disable-next-line no-unused-vars
      using consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
      expect(parameters(value)).toBe(length);
    });
  });
});
