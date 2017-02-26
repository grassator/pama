/* global test, expect */

const {match, _, otherwise, capture, $, List} = require('./index');

test('returns undefined when there are no matchers are provided', () => {
    const obj = {};
    expect(match(obj)).toBe(undefined);
});

test('works for matching boolean values', () => {
    expect(match(false,
        [true, _ => 'true'],
        [false, _ => 'false']
    )).toBe('false');
    expect(match(true,
        [true, _ => 'true'],
        [false, _ => 'false']
    )).toBe('true');
});

test('just returns the value if there is no callback for a match', () => {
    expect(match(false,
        [true, _ => 'true'],
        [false]
    )).toBe(false);
    expect(match(true,
        [true],
        [false, _ => 'false']
    )).toBe(true);
});

test('works for matching number', () => {
    expect(match(42,
        [0],
        [42],
        [79]
    )).toBe(42);
    expect(match(Infinity,
        [0],
        [Infinity],
        [79]
    )).toBe(Infinity);
    expect(match(-0,
        [0],
        [-0],
        [79]
    )).toBe(-0);
    expect(Number.isNaN(match(NaN,
        [0],
        [NaN],
        [79]
    ))).toBe(true);
    expect(match(42,
        [String, _ => 'string'],
        [Number, _ => 'number']
    )).toBe('number');
});

test('works for matching strings', () => {
    expect(match('foo',
        ['foo'],
        ['bar']
    )).toBe('foo');
    expect(match('',
        ['foo'],
        ['']
    )).toBe('');
    expect(match('',
        [String, _ => 'string'],
        [Number, _ => 'number']
    )).toBe('string');
});

test('works for matching regular expressions', () => {
    expect(match(/foo/,
        [RegExp, /bar/, () => 'bar regexp'],
        [RegExp, /foo/g, () => 'foo regexp but global'],
        [RegExp, /foo/, () => 'foo regexp'],
    )).toBe('foo regexp');
    expect(match(/foo/,
        [RegExp, () => 'regexp'],
        [String, () => 'string']
    )).toBe('regexp');
});

test('works for null', () => {
    expect(match(null,
        [undefined, () => 'undefined'],
        [null, () => 'null'],
        [false, () => 'false']
    )).toBe('null');
    expect(match(null,
        [Object, () => 'object'],
        [null, () => 'null is not really an object'],
        [false, () => 'false']
    )).toBe('null is not really an object');
});

test('works for undefined', () => {
    expect(match(undefined,
        [null, () => 'null'],
        [undefined, () => 'undefined'],
        [false, () => 'false']
    )).toBe('undefined');
});

test('works for custom classes', () => {
    class Foo {}
    expect(match(new Foo(),
        [Foo, () => 'Foo'],
        [Object, () => 'object']
    )).toBe('Foo');
});

test('works for matching anything', () => {
    expect(match(9,
        [42, () => 'the answer'],
        [_, () => 'not the answer']
    )).toBe('not the answer');
    expect(match(9,
        [42, () => 'the answer'],
        [otherwise, () => 'not the answer']
    )).toBe('not the answer');
});

test('works for matching with custom predicates', () => {
    expect(match(42,
        [_, x => x < 0, () => 'negative'],
        [_, x => x >= 0, () => 'positive']
    )).toBe('positive');
    expect(match(42,
        [Number, 42, x => x < 0, () => 'negative'],
        [Number, 42, x => x >= 0, () => 'positive']
    )).toBe('positive');
});

test('works for matching props on an object', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(match(new Foo(),
        [Foo, {foo: ['foo']}, () => 'foo'],
        [Foo, {foo: ['bar']}, () => 'bar']
    )).toBe('bar');
});

test('works for matching props on an object without class', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(match(new Foo(),
        [{foo: ['foo']}, () => 'foo'],
        [{foo: ['bar']}, () => 'bar']
    )).toBe('bar');
});

test('works for matching props on an object with predicates', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(match(new Foo(),
        [Foo, {foo: ['foo']}, () => 'foo'],
        [Foo, {foo: [_, x => x.length > 2]}, () => 'bar']
    )).toBe('bar');
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
    expect(match(new Foo(),
        [Foo, {foo: ['foo']}, () => 'foo'],
        [Foo, {foo: [Foo, {foo: [Foo, {foo: ['bar']}]}]}, () => 'bar']
    )).toBe('bar');
});

test('works for capturing deep nested values', () => {
    class Foo {
        constructor(depth = 0) {
            if (depth < 2) {
                this.foo = new Foo(depth + 1);
            } else {
                this.foo = 'bar';
            }
        }
    }
    expect(match(new Foo(),
        [Foo, {foo: ['foo']}, () => 'foo'],
        [Foo, {foo: [Foo, {foo: [Foo, {foo: capture }]}]}, x => x]
    )).toBe('bar');
});

test('works for capturing multiple values', () => {
    expect(match({ foo: 'foo', bar: 'bar'},
        [Object, {foo: $, bar: $}, (x, y) => [x, y]],
        [Object, () => 'object']
    )).toEqual(['foo', 'bar']);
});

test('works for capturing named values', () => {
    expect(match({ foo: 'foo', bar: 'bar'},
        [Object, {foo: $('x'), bar: $('y')}, ({x, y}) => [x, y]],
        [Object, () => 'object']
    )).toEqual(['foo', 'bar']);
});

test('works for matching shallow arrays as objects', () => {
    expect(match(['foo', 42],
        [['foo'], () => 'foo'],
        [Array, () => 'Array']
    )).toEqual('foo');
});

test('works for matching arrays as list', () => {
    expect(match(['foo', 42],
        [['foo'], () => 'foo'],
        [Array, () => 'Array']
    )).toEqual('foo');
});
