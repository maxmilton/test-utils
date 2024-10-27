import { describe, expect, test } from 'bun:test';
// biome-ignore lint/style/noNamespaceImport: explicitly for testing
import * as spyExports from '../src/spy';
import { performanceSpy } from '../src/spy';

describe('exports', () => {
  const exports = ['performanceSpy'];

  test.each(exports)('has "%s" named export', (exportName) => {
    expect.assertions(1);
    expect(spyExports).toHaveProperty(exportName);
  });

  test('does not have a default export', () => {
    expect.assertions(1);
    expect(spyExports).not.toHaveProperty('default');
  });

  test('does not export anything else', () => {
    expect.assertions(1);
    expect(Object.keys(spyExports)).toHaveLength(exports.length);
  });
});

describe('performanceSpy', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(performanceSpy).toBeFunction();
    expect(performanceSpy).not.toBeClass();
  });

  test('expects no parameters', () => {
    expect.assertions(1);
    expect(performanceSpy).toHaveParameters(0, 0);
  });

  test('returns a function', () => {
    expect.hasAssertions(); // variable number of assertions
    const check = performanceSpy();
    expect(check).toBeFunction();
    expect(check).not.toBeClass();
    check();
  });

  test('returned function expects no parameters', () => {
    expect.hasAssertions(); // variable number of assertions
    const check = performanceSpy();
    expect(check).toHaveParameters(0, 0);
    check();
  });

  test('passes when no performance methods are called', () => {
    expect.hasAssertions(); // variable number of assertions
    const check = performanceSpy();
    check();
  });

  // TODO: Don't skip this once test.failing() is supported in bun. We need to
  // check that the expect() inside the performanceSpy() fails (meaning this
  // test should then be a pass).
  //  ↳ https://jestjs.io/docs/api#testfailingname-fn-timeout
  test.skip('fails when performance methods are called', () => {
    expect.hasAssertions(); // variable number of assertions
    const check = performanceSpy();
    performance.mark('a');
    performance.measure('a', 'a');
    check();
  });
});
