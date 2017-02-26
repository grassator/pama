/* global test, expect */

const {match, when, $, capture, _} = require('./index');

test('returns undefined when there are no matchers are provided', () => {
    const obj = {};
    expect(match(obj)).toBe(undefined);
});

test('works for matching boolean values', () => {
    expect(match(false,
        when(true).then('true'),
        when(false).then('false')
    )).toBe('false');
});

test('just returns the value if there is no callback for a match', () => {
    expect(match(false,
        when(true).then('true'),
        when(false)
    )).toBe(false);
    expect(match(true,
        when(true),
        when(false).then('false')
    )).toBe(true);
});

test('works for matching number', () => {
    expect(match(42,
        when(0),
        when(42),
        when(79)
    )).toBe(42);
    expect(match(Infinity,
        when(0),
        when(Infinity),
        when(79)
    )).toBe(Infinity);
    expect(match(-0,
        when(0),
        when(-0),
        when(79)
    )).toBe(-0);
    expect(Number.isNaN(match(NaN,
        when(0),
        when(NaN),
        when(79)
    ))).toBe(true);
    expect(match(42,
        when(String).then('string'),
        when(Number).then('number')
    )).toBe('number');
});

test('works for matching strings', () => {
    expect(match('foo',
        when('foo'),
        when('bar')
    )).toBe('foo');
    expect(match('',
        when('foo'),
        when('')
    )).toBe('');
    expect(match('',
        when(String).then('string'),
        when(Number).then('number')
    )).toBe('string');
});

test('works for matching regular expressions', () => {
    class Foo {}
    expect(match(/foo/,
        when(RegExp, { source: 'bar' } ).then('bar regexp'),
        when(RegExp, { source: 'foo', flags: 'g' }).then('foo regexp but global'),
        when(Foo, { source: 'foo' }).then('foo class'),
        when(RegExp, { source: 'foo' }).then('foo regexp')
    )).toBe('foo regexp');
    expect(match(/foo/,
        when(RegExp).then('regexp'),
        when(String).then('string')
    )).toBe('regexp');
});

test('works for null', () => {
    expect(match(null,
        when(undefined).then('undefined'),
        when(false).then('false'),
        when(null).then('null')
    )).toBe('null');
    expect(match(null,
        when(undefined).then('undefined'),
        when(false).then('false'),
        when(Object).then('object')
    )).toBe('object');
});

test('works for undefined', () => {
    expect(match(undefined,
        when(false).then('false'),
        when(null).then('null'),
        when(undefined).then('undefined')
    )).toBe('undefined');
});

test('works for custom classes', () => {
    class Foo {}
    class Bar {}
    expect(match(new Foo(),
        when(Bar).then('Bar'),
        when(Foo).then('Foo'),
        when(Object).then('object')
    )).toBe('Foo');
});

test('works for matching anything', () => {
    expect(match(9,
        when(42).then('the answer'),
        when().then('not the answer')
    )).toBe('not the answer');
});

test('works for matching with custom predicates', () => {
    expect(match(42,
        when()
            .guard(x => x < 0).then('negative')
            .guard(x => x >= 0).then('positive')
    )).toBe('positive');
    expect(match(42,
        when(Number)
            .guard(x => x < 0).then('negative')
            .guard(x => x >= 0).then('positive')
    )).toBe('positive');
    expect(match(42,
        when(Number, 42)
            .guard(x => x < 0).then('negative')
            .guard(x => x >= 0).then('positive')
    )).toBe('positive');
});

test('works for matching props on an object', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(match(new Foo(),
        when(Foo, {foo: 'foo'}).then('foo'),
        when(Foo, {foo: 'bar'}).then('bar')
    )).toBe('bar');
});

test('works for matching props on an object without class', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(match(new Foo(),
        when({foo: 'foo'}).then('foo'),
        when({foo: 'bar'}).then('bar')
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
        when(Foo, {foo: 'foo'}).then('foo'),
        when(Foo, {foo: {foo:{foo: 'bar'}}}).then('bar')
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
        when(Foo, {foo: 'foo'}).then('foo'),
        when(Foo, {foo: {foo:{foo: capture}}}).then(x => x)
    )).toBe('bar');
});

test('works for capturing multiple values', () => {
    expect(match({ foo: 'foo', bar: 'bar'},
        when(Object, {foo: $, bar: $}).then((x, y) => [x, y]),
        when(Object).then('object')
    )).toEqual(['foo', 'bar']);
});

test('works for capturing named values', () => {
    expect(match({ foo: 'foo', bar: 'bar'},
        when(Object, {foo: $('x'), bar: _}).then(({x}) => x),
        when(Object).then('object')
    )).toEqual('foo');
});

test('works for matching shallow arrays as objects', () => {
    expect(match(['foo', 42],
        when(['foo']).then('foo'),
        when(['foo', 42]).then('foo 42'),
        when(Array).then('Array')
    )).toEqual('foo 42');
});

test('works for capturing a nested match', () => {
    expect(match(['foo', { bar: 42 }],
        when(['foo', $(when({ bar: 42 }))]).then(x => x),
        when(Array).then('Array')
    )).toEqual({ bar: 42 });
});
