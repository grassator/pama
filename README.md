# pama

[![NPM version](https://badge.fury.io/js/pama.svg)](https://npmjs.org/package/pama)
[![Build Status][travis-image]][travis-url]

[project-url]: https://github.com/grassator/pama
[travis-url]: https://travis-ci.org/grassator/pama
[travis-image]: https://travis-ci.org/grassator/pama.svg?branch=master

`pama` is a library that introduces the concept of pattern matching to JavaScript. While some similar libraries exist (e.g. [funcy](https://www.npmjs.com/package/funcy) and [matches.js](https://github.com/natefaubion/matches.js)), they fail to match all of the goals set for `pama`:

1. Nested matching and capturing of values.
2. Consistent API implemented in JS without a custom DSL.
3. Minimal footprint both in terms of size and performance.
4. Support for guards.

## Quick Setup

Add the library to your project using yarn:

```
yarn add -D pama
```

or NPM:

```
npm install -D pama
```

Then import it into your project:

```js
import {when, is} from 'pama';
```

Here's how you can check for a specific number, string or anything else:

```js
const foo = when(valueToMatch, (_, x) =>
    is(42)       ? 'The Answer!' :
    is('string', _) ? x.length :
    /* otherwise */ 'dunno'
);
```

An important difference of `when` function vs `switch` is that it returns the result
of the matched branch, which makes writing functional-style code easier.

Another thing to keep in mind is that the order of branches is important.

## Syntax definition

```js
when(value, (_, sameValue) =>
    is(pattern) ? nonFunctionValueOrCallback :
    is(type, _) ? nonFunctionValueOrCallback :
    is(type, pattern) ? nonFunctionValueOrCallback :
    otherwiseBranch
);
```

* `value` (optional) — value that is going to be matched. If this argument is not present,
the return value of `when` call will be a function expecting one argument and returning the same
argument, so `when(() => ...` is same as `value => when(value, () => ...`.

* `_` — this is a special value that when used inside of an `is` matcher,
will match anything. It is named `_` for shortness and similarity with functional languages like
Haskell.

* `sameValue` - the same `value` that was passed to `when` as a first argument. This a necessity
for cases of using `when` to create a function, but allows you to provide a different name for
the value you are matching on, which is handy when the original one is too verbose.

* The body of the callback is just an ordinary [conditional expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator.html).
The only extra functionality provided is in the implementation of `is` and how the return value
of the callback is treated.

* `is` — this function accept a `pattern`, or a `type` and a `pattern`, and returns `true` if
the `value` is matching the pattern. [Tests file](https://github.com/grassator/pama/master/index.test.js) has a full list of the supported patterns and types.

* `nonFunctionValueOrCallback` — if this is a function, it's treated as a "match callback" and gets
the original `value` as it's only argument, for all other JS types, the value here will be the return value of `when` in case of a match.

* `otherwiseBranch` - since `pama` (ab)uses conditional expressions, you always have to have a final
"else" branch that is taken when nothing matched. If you don't want to return anything, the convention
is to put `undefined` on this place.

## Advanced Usage

### Regular Expression

It is possible to match string values directly with regular expressions:

```js
when('foo', _ =>
    is(/b\w+/) ? 'b-like' :
    is(/f\w+/) ? 'f-like' :
    undefined
); // returns 'f-like'
```

> one thing to note is that unlike regular someRegexp.test(), this check does not coerce the type to string, so if
provided value is not a string, it will automatically doesn't match this branch. 

### Guards

> *Guard* is an additional condition on top of a declarative match that allows to further refine the match.

Since `pama` just expects the predicate to return a boolean value, you can add arbitrary conditions in
the same manner as you would with a regular `if` statement:


```js
when(value, (_, x) =>
    is(0)                    ? 'zero'     :
    is('number', _) && x > 0 ? 'positive' :
    is('number', _) && x < 0 ? 'negative' :
    'not a number'
);
```

If you have performance concerns, or don't want to repeat yourself it's possible to use the
flexibility of JS to your advantage:

```js
when(valueToMatch, (_, x, g) =>
    (g = is({ foo: 'bar', num: _ })) &&
        g && x.num > 0 ? 'positive' :
        g && x < 0     ? 'negative' :
    'not a number'
);
```

### Deep Matching

```js
const a = {foo: {foo:{foo: 'bar'}}};

when(a, _ =>
    is({foo: 'foo'}) ? 'foo' :
    is({foo: {foo:{foo: 'bar'}}}) ? 'bar' :
    undefined
); // returns 'bar'
```

## Corner Cases

When designing `pama` I had to make a decision on either being always very verbose,
or having a more concise syntax for common situations, but have some corner cases.

There are just a few corner cases I could identify, and they are described below:

### Matching on functions

Since functions also act as custom predicates, this will not work:

```js
const f = () => {};
when(f, () =>
    is(f) ? 'yes' :
    'no'
); // returns 'no'
```

But it works when you provide the type explicitly:

```js
const f = () => {};
when(f, () =>
    is('function', f) ? 'yes' :
    'no'
); // returns 'yes'
```

Or you can also just compare yourself:

```js
const f1 = () => {};
const f2 = () => {};
when(f1, (_, x) =>
    x === f1 ? 'f1' :
    x === f2 ? 'f2' :
    'no'
); // returns 'f2'
```

### Returning a function from a match

Just putting a function into a match won't work, as it is considered to be a callback for that match:

```js
const expectedReturn = () => 42;
when(true, (_, x) =>
    true ? expectedReturn :
    undefined
); // calls `expectedReturn` and returns the result (42)
```

If you wish to return a function from a match, you need to wrap it in an anonymous function:

```js
const expectedReturn = () => 42;
when(true, (_, x) =>
    true ? () => expectedReturn :
    undefined
); // returns expectedReturn
```

### Array and Object type matching

Since every window (or iframe) in the browser gets a fresh set of globals, this code will not work:

```js
when(arrayComingFromAnotherWindow, () =>
    is(Array) ? 'array' :
    'not an array'
);
```

Instead, if you have to support objects coming from another contexts, you have to use
slightly more awkward version: 

```js
when(arrayComingFromAnotherWindow, () =>
    is(Array.isArray) ? 'array' :
    'not an array'
);
```

`Object` global has the same problem, but for it you can always use this format:

```js
when(objectComingFromAnotherWindow, _ =>
    is('object', _) ? 'object' :
    'not an object'
); // will return 'object', as expected
```

## Browser / Environment Support

* Evergreen (Chrome, Firefox, Opera, Safari, Edge)
* IE9+
* Node.js 0.10

## License

The MIT License (MIT)

Copyright (c) 2017 Dmitriy Kubyshkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
