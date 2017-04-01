/* global test, expect */

/* eslint-disable no-unexpected-multiline */

const {when, eq, type, matches} = require('./index');

test('works for matching boolean values', () => {
    expect(when(false, () =>
        eq(true) ? 'true' :
        eq(false) ? 'false' :
        undefined
    )).toBe('false');
});

test('passes original value as the second argument', () => {
    expect(when(false, (_, x) =>
        eq(true) ? x :
        eq(false) ? x :
        undefined
    )).toBe(false);
});

test('works for matching number', () => {
    expect(when(42, (_, x) =>
        eq(0) ? x :
        eq(42) ? x :
        eq(79) ? x :
        undefined
    )).toBe(42);
    expect(when(Infinity, (_, x) =>
        eq(0) ? x :
        eq(Infinity) ? x :
        eq(79) ? x :
        undefined
    )).toBe(Infinity);
    expect(when(Infinity, () =>
        type('string') ? 'string' :
        type('number') ? 'number' :
        undefined
    )).toBe('number');
});

test('works for null', () => {
    expect(when(null, () =>
        eq(undefined) ? 'undefined' :
        eq(false) ? 'false' :
        eq(null) ? 'null' :
        undefined
    )).toBe('null');
    expect(when(null, () =>
        eq(undefined) ? 'undefined' :
        eq(false) ? 'false' :
        type('object') ? 'object' :
        undefined
    )).toBe('object');
});

test('works for undefined', () => {
    expect(when(undefined, () =>
        eq(false) ? 'false' :
        eq(undefined) ? 'undefined' :
        eq(null) ? 'null' :
        undefined
    )).toBe('undefined');
});

test('works for custom classes', () => {
    class Foo {}
    class Bar {}
    expect(when(new Foo(), () =>
        type(Bar) ? 'Bar' :
        type(Foo) ? 'Foo' :
        undefined
    )).toBe('Foo');
});

test('works for matching anything', () => {
    expect(when(9, () =>
        eq(42) ? 'the answer' :
        'not the answer'
    )).toBe('not the answer');
});

test('works for matching props on an object', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(when(new Foo(), () =>
        matches({foo: 'foo'}) ? 'foo' :
        matches({foo: 'bar'}) ? 'bar' :
        undefined
    )).toBe('bar');
});

test('`any` match should check for the presence of property on the object', () => {
    expect(when({}, _ =>
        matches({foo: _}) ? 'foo' :
        matches({}) ? 'empty' :
        undefined
    )).toBe('empty');
});

test('works for deep matching', () => {
    class Foo {
        constructor(depth = 0) {
            if (depth < 2) {
                this.foo = new Foo(depth + 1);
            } else {
                this.foo = 'bar';
            }
        }
    }
    expect(when(new Foo(), () =>
        matches({foo: 'foo'}) ? 'foo' :
        matches({foo: {foo: {foo: 'bar'}}}) ? 'bar' :
        undefined
    )).toBe('bar');
});

test('works for matching shallow arrays as objects', () => {
    expect(when(['foo', 42], () =>
        matches(['foo', 9]) ? 'foo 9' :
        matches(['foo', 42]) ? 'foo 42' :
        type(Array) ? 'Array' :
        undefined
    )).toBe('foo 42');
});

test('allows to auto-create a function when a an element to match is not provided', () => {
    expect(when(() =>
        eq(true) ? 'true' :
        undefined
    )).toBeInstanceOf(Function);
});

test('works for nested matches', () => {
    expect(when(42, (_, x) =>
        type('string') ? x :
        type('number') ? num => when(num % 2, () =>
            eq(0) ? 'even' :
            'odd'
        ) :
        undefined
    )).toBe('even');
});
