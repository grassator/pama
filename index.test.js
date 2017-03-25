/* global test, expect */

/* eslint-disable no-unexpected-multiline */

const when = require('./index');

test('works for matching boolean values', () => {
    expect(when(false, ({eq}) =>
        eq(true) ? 'true' :
        eq(false) ? 'false' :
        undefined
    )).toBe('false');
});

test('to have an id callback', () => {
    expect(when(false, ({eq, id}) =>
        eq(true) ? 'true' :
        eq(false) ? id :
        undefined
    )).toBe(false);
});

test('works for matching number', () => {
    expect(when(42, ({eq, id}) =>
        eq(0) ? id :
        eq(42) ? id :
        eq(79) ? id :
        undefined
    )).toBe(42);
    expect(when(Infinity, ({eq, id}) =>
        eq(0) ? id :
        eq(Infinity) ? id :
        eq(79) ? id :
        undefined
    )).toBe(Infinity);
    expect(when(Infinity, ({type}) =>
        type('string') ? 'string' :
        type('number') ? 'number' :
        undefined
    )).toBe('number');
});

test('works for null', () => {
    expect(when(null, ({eq}) =>
        eq(undefined) ? 'undefined' :
        eq(false) ? 'false' :
        eq(null) ? 'null' :
        undefined
    )).toBe('null');
    expect(when(null, ({eq, type}) =>
        eq(undefined) ? 'undefined' :
        eq(false) ? 'false' :
        type('object') ? 'object' :
        undefined
    )).toBe('object');
});

test('works for undefined', () => {
    expect(when(undefined, ({eq}) =>
        eq(false) ? 'false' :
        eq(undefined) ? 'undefined' :
        eq(null) ? 'null' :
        undefined
    )).toBe('undefined');
});

test('works for custom classes', () => {
    class Foo {}
    class Bar {}
    expect(when(new Foo(), ({type}) =>
        type(Bar) ? 'Bar' :
        type(Foo) ? 'Foo' :
        undefined
    )).toBe('Foo');
});

test('works for matching anything', () => {
    expect(when(9, ({eq}) =>
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
    expect(when(new Foo(), ({matches}) =>
        matches({foo: 'foo'}) ? 'foo' :
        matches({foo: 'bar'}) ? 'bar' :
        undefined
    )).toBe('bar');
});

test('`any` match should check for the presence of property on the object', () => {
    expect(when({}, ({matches, _}) =>
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
    expect(when(new Foo(), ({matches}) =>
        matches({foo: 'foo'}) ? 'foo' :
        matches({foo: {foo: {foo: 'bar'}}}) ? 'bar' :
        undefined
    )).toBe('bar');
});

test('works for matching shallow arrays as objects', () => {
    expect(when(['foo', 42], ({matches, type}) =>
        matches(['foo', 9]) ? 'foo 9' :
        matches(['foo', 42]) ? 'foo 42' :
        type(Array) ? 'Array' :
        undefined
    )).toBe('foo 42');
});

test('allows to auto-create a function when a an element to match is not provided', () => {
    expect(when(({eq}) =>
        eq(true) ? 'true' :
        undefined
    )).toBeInstanceOf(Function);
});
