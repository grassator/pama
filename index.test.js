/* global test, expect */

const {match} = require('./index');

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

test('works for matching strings against regular expressions', () => {
    expect(match('foo',
        [/^f\w+$/],
        ['bar']
    )).toBe('foo');
    expect(match(42,
        [/\d+/],
        [9]
    )).toBe(undefined);
});

test('works for matching regular expressions', () => {
    expect(match(/foo/,
        [RegExp, /bar/, () => 'bar regexp'],
        [/foo/, () => 'foo string matching'],
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
