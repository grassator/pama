/* global test, expect */


const {when, is, otherwise} = require('./index');

test('works for matching boolean values', () => {
    expect(when(false, () =>
        is(true) ? 'true' :
        is(false) ? 'false' :
        undefined
    )).toBe('false');
});

test('passes original value as the second argument', () => {
    expect(when(false, (_, x) =>
        is(true) ? x :
        is(false) ? x :
        undefined
    )).toBe(false);
});

test('works for matching number', () => {
    expect(when(42, (_, x) =>
        is(0) ? x :
        is(42) ? x :
        is(79) ? x :
        undefined
    )).toBe(42);
    expect(when(Infinity, (_, x) =>
        is(0) ? x :
        is(Infinity) ? x :
        is(79) ? x :
        undefined
    )).toBe(Infinity);
    expect(when(Infinity, _ =>
        is('string', _) ? 'string' :
        is('number', _) ? 'number' :
        undefined
    )).toBe('number');
});

test('works for null', () => {
    expect(when(null, () =>
        is(false) ? 'false' :
        is(null) ? 'null' :
        undefined
    )).toBe('null');
    expect(when(null, _ =>
        is(undefined) ? 'undefined' :
        is(false) ? 'false' :
        is('object', _) ? 'object' :
        undefined
    )).toBe('object');
});

test('works for undefined', () => {
    expect(when(undefined, () =>
        is(false) ? 'false' :
        is(undefined) ? 'undefined' :
        is(null) ? 'null' :
        undefined
    )).toBe('undefined');
});

test('works for custom classes', () => {
    class Foo {}
    class Bar {}
    expect(when(new Foo(), _ =>
        is(Bar, _) ? 'Bar' :
        is(Foo, _) ? 'Foo' :
        undefined
    )).toBe('Foo');
});

test('works for matching anything', () => {
    expect(when(9, () =>
        is(42) ? 'the answer' :
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
        is({foo: 'foo'}) ? 'foo' :
        is({foo: 'bar'}) ? 'bar' :
        undefined
    )).toBe('bar');
});

test('`any` match should check for the presence of property on the object', () => {
    expect(when({}, _ =>
        is({foo: _}) ? 'foo' :
        is({}) ? 'empty' :
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
        is({foo: 'foo'}) ? 'foo' :
        is({foo: {foo: {foo: 'bar'}}}) ? 'bar' :
        undefined
    )).toBe('bar');
});

test('works for matching shallow arrays as objects', () => {
    expect(when(['foo', 42], _ =>
        is(['foo', 9]) ? 'foo 9' :
        is(['foo', 42]) ? 'foo 42' :
        is(Array, _) ? 'Array' :
        undefined
    )).toBe('foo 42');
});

test('allows to auto-create a function when a an element to match is not provided', () => {
    expect(when(() =>
        is(true) ? 'true' :
        undefined
    )).toBeInstanceOf(Function);
});

test('works for nested matches', () => {
    expect(when(42, (_, x) =>
        is('string', _) ? x :
        is('number', _) ? num => when(num % 2, () =>
            is(0) ? 'even' :
            'odd'
        ) :
        undefined
    )).toBe('even');
});

test('works for caching guards', () => {
    expect(when([1, 2, 3], (_, x, g) =>
        (g = is(Array, _)) &&
            g && x.length === 1 ? 'one' :
            g && x.length > 1   ? 'many' :
        'does not matter'
    )).toBe('many');
});

test('support custom matchers by accepting them as arguments to `is`', () => {
    expect(when([1, 2, 3], () =>
        is(Array.isArray) ? 'array' :
        'not an array'
    )).toBe('array');
});


test('support pass-through explicit `otherwise`', () => {
    expect(when(12, () =>
        is('string') ? 'string' :
        otherwise('not a string')
    )).toBe('not a string');
});

test('supports regex matching', () => {
    expect(when('foo', () =>
        is(/bar/) ? 'bar' :
        is(/f\w+/) ? 'f-like' :
        otherwise('weird')
    )).toBe('f-like');
});

test('should not regex match if the value is not a string', () => {
    const val = {
        toString() {
            return 'foo';
        }
    };
    expect(when(val, () =>
        is(/bar/) ? 'bar' :
        is(/f\w+/) ? 'f-like' :
        otherwise('weird')
    )).toBe('weird');
});
