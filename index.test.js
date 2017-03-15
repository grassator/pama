/* global test, expect */

const {when, is, otherwise, _} = require('./index');

test('returns undefined when there are no matchers are provided', () => {
    const obj = {};
    expect(when(obj)).toBe(undefined);
});

test('works for matching boolean values', () => {
    expect(when(false,
        is(true).then('true'),
        is(false).then('false')
    )).toBe('false');
});

test('just returns the value if there is no callback for a match', () => {
    expect(when(false,
        is(true).then('true'),
        is(false)
    )).toBe(false);
    expect(when(true,
        is(true),
        is(false).then('false')
    )).toBe(true);
});

test('works for matching number', () => {
    expect(when(42,
        is(0),
        is(42),
        is(79)
    )).toBe(42);
    expect(when(Infinity,
        is(0),
        is(Infinity),
        is(79)
    )).toBe(Infinity);
    expect(when(-0,
        is(0),
        is(-0),
        is(79)
    )).toBe(-0);
    expect(Number.isNaN(when(NaN,
        is(0),
        is(NaN),
        is(79)
    ))).toBe(true);
    expect(when(42,
        is(String).then('string'),
        is(Number).then('number')
    )).toBe('number');
});

test('works for matching strings', () => {
    expect(when('foo',
        is('foo'),
        is('bar')
    )).toBe('foo');
    expect(when('',
        is('foo'),
        is('')
    )).toBe('');
    expect(when('',
        is(String).then('string'),
        is(Number).then('number')
    )).toBe('string');
});

test('works for matching regular expressions', () => {
    class Foo {}
    expect(when(/foo/,
        is(RegExp, { source: 'bar' } ).then('bar regexp'),
        is(RegExp, { source: 'foo', flags: 'g' }).then('foo regexp but global'),
        is(Foo, { source: 'foo' }).then('foo class'),
        is(RegExp, { source: 'foo' }).then('foo regexp')
    )).toBe('foo regexp');
    expect(when(/foo/,
        is(RegExp).then('regexp'),
        is(String).then('string')
    )).toBe('regexp');
});

test('works for null', () => {
    expect(when(null,
        is(undefined).then('undefined'),
        is(false).then('false'),
        is(null).then('null')
    )).toBe('null');
    expect(when(null,
        is(undefined).then('undefined'),
        is(false).then('false'),
        is(Object).then('object')
    )).toBe('object');
});

test('works for undefined', () => {
    expect(when(undefined,
        is(false).then('false'),
        is(null).then('null'),
        is(undefined).then('undefined')
    )).toBe('undefined');
});

test('works for custom classes', () => {
    class Foo {}
    class Bar {}
    expect(when(new Foo(),
        is(Bar).then('Bar'),
        is(Foo).then('Foo'),
        is(Object).then('object')
    )).toBe('Foo');
});

test('works for matching anything', () => {
    expect(when(9,
        is(42).then('the answer'),
        otherwise('not the answer')
    )).toBe('not the answer');
});

test('works for matching with custom predicates', () => {
    expect(when(42,
        otherwise
            .where(x => x < 0).then('negative')
            .where(x => x >= 0).then('positive')
    )).toBe('positive');
    expect(when(42,
        is(Number)
            .where(x => x < 0).then('negative')
            .where(x => x >= 0).then('positive')
    )).toBe('positive');
    expect(when(42,
        is(Number, 42)
            .where(x => x < 0).then('negative')
            .where(x => x >= 0).then('positive')
    )).toBe('positive');
});

test('works for matching with regular predicates and predicates with guards', () => {
    expect(when(42,
        is().where(x => x < 0).then('negative'),
        is().then('positive')
    )).toBe('positive');
});

test('works for empty guards', () => {
    expect(when(42,
        is()
            .where(x => x < 0).then('negative')
            .where().then('positive')
    )).toBe('positive');
});

test('supports `otherwise` as a alias for an empty guard with `then`', () => {
    expect(when(42,
        is()
            .where(x => x < 0).then('negative')
            .otherwise('positive')
    )).toBe('positive');
});

test('works for matching props on an object', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(when(new Foo(),
        is(Foo, {foo: 'foo'}).then('foo'),
        is(Foo, {foo: 'bar'}).then('bar')
    )).toBe('bar');
});

test('works for matching props on an object without class', () => {
    class Foo {
        constructor() {
            this.foo = 'bar';
        }
    }
    expect(when(new Foo(),
        is({foo: 'foo'}).then('foo'),
        is({foo: 'bar'}).then('bar')
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
    expect(when(new Foo(),
        is(Foo, {foo: 'foo'}).then('foo'),
        is(Foo, {foo: {foo:{foo: 'bar'}}}).then('bar')
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
    expect(when(new Foo(),
        is(Foo, {foo: 'foo'}).then('foo'),
        is(Foo, {foo: {foo:{foo: _()}}}).then(x => x)
    )).toBe('bar');
});

test('works for capturing multiple values', () => {
    expect(when({ foo: 'foo', bar: 'bar'},
        is(Object, {foo: _(), bar: _()}).then((x, y) => [x, y]),
        is(Object).then('object')
    )).toEqual(['foo', 'bar']);
});

test('works for capturing named values', () => {
    expect(when({ foo: 'foo', bar: 'bar'},
        is(Object, {foo: _('x'), bar: _}).then(({x}) => x),
        is(Object).then('object')
    )).toEqual('foo');
});

test('works for matching shallow arrays as objects', () => {
    expect(when(['foo', 42],
        is(['foo']).then('foo'),
        is(['foo', 42]).then('foo 42'),
        is(Array).then('Array')
    )).toEqual('foo 42');
});

test('works for capturing a nested match', () => {
    expect(when(['foo', { bar: 42 }],
        is(['foo', _(is({ bar: 42 }))]).then(x => x),
        is(Array).then('Array')
    )).toEqual({ bar: 42 });
});

test('works for capturing inside a nested match', () => {
    expect(when(['foo', { bar: 42 }],
        is(['foo', is(Object, { bar: _() })]).then(x => x),
        is(Array).then('Array')
    )).toEqual(42);
});

test('works for matching rest elements of the array', () => {
    expect(when(['foo', 42],
        is(['foo', _.rest]).then('foo'),
        is(Array).then('Array')
    )).toEqual('foo');
});

test('works for capturing rest elements of the array', () => {
    expect(when(['foo', 42, 43],
        is(['foo', _.rest()]),
        is(Array).then('Array')
    )).toEqual([42, 43]);
});
