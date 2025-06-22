import { describe, expect, test } from 'bun:test';
import * as htmlExports from '../src/html.ts';
import { validate } from '../src/html.ts';

describe('exports', () => {
  const exports = ['validate'];

  test.each(exports)('has "%s" named export', (exportName) => {
    expect.assertions(1);
    expect(htmlExports).toHaveProperty(exportName);
  });

  test('does not have a default export', () => {
    expect.assertions(1);
    expect(htmlExports).not.toHaveProperty('default');
  });

  test('does not export anything else', () => {
    expect.assertions(1);
    expect(Object.keys(htmlExports)).toHaveLength(exports.length);
  });
});

describe('validate', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(validate).toBeFunction();
    expect(validate).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(validate).toHaveParameters(1, 0);
  });

  test('returns an object with expected properties', () => {
    expect.assertions(7);
    const result = validate('<div></div>');
    expect(result).toBePlainObject();
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('ast');
    expect(result.valid).toBeBoolean();
    expect(result.errors).toBeArray();
    expect(result.ast).toBeArrayOfSize(1);
  });

  test('returns valid for valid HTML', () => {
    expect.assertions(2);
    const result = validate('<div></div>');
    expect(result.valid).toBeTrue();
    expect(result.errors).toBeArrayOfSize(0);
  });

  test('returns not valid for no HTML', () => {
    expect.assertions(2);
    const result = validate('');
    expect(result.valid).toBeFalse();
    expect(result.errors).toBeArrayOfSize(1);
  });

  test('returns not valid for no text content only', () => {
    expect.assertions(2);
    const result = validate('text');
    expect(result.valid).toBeFalse();
    expect(result.errors).toBeArrayOfSize(1);
  });

  test('returns not valid for unclosed tags', () => {
    expect.assertions(2);
    const result = validate('<div><span>Unclosed<p>Nested error</div>');
    expect(result.valid).toBeFalse();
    expect(result.errors).toBeArrayOfSize(2);
  });

  // FIXME: Don't skip once we have a way to validate void elements have no children.
  test.skip('returns not valid for void element with child', () => {
    expect.assertions(2);
    const result = validate('<hr>x</hr>');
    expect(result.valid).toBeFalse();
    expect(result.errors).toBeArrayOfSize(1);
  });
});
