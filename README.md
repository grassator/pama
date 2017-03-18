# pama

[![NPM version](https://badge.fury.io/js/pama.svg)](https://npmjs.org/package/pama)
[![Build Status][travis-image]][travis-url]

[project-url]: https://github.com/grassator/pama
[travis-url]: https://travis-ci.org/grassator/pama
[travis-image]: https://travis-ci.org/grassator/pama.svg?branch=master

`pama` is a small library that introduces the concept of pattern matching to JavaScript. While some similar libraries exist (e.g. [funcy](https://www.npmjs.com/package/funcy) and [matches.js](https://github.com/natefaubion/matches.js)), they fail to match all of the goals set for `pama`:

1. Nested matching and capturing of values.
2. Consistent API implemented in JS without string parsing.
3. Support for guards.

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
import {match, when, _} from 'pama';
```

Here's how you can check for a specific number, string or anything else:

```js
const foo = (smth) => when(smth,
    is(42).then('The Answer!'),
    is(String).then((str) => str.length),
    otherwise('dunno')
);
```

An important difference of `match` function vs `switch` is that it returns the result
of the matched branch, which makes writing functional-style code easier.

Another thing to keep in mind is that the order of branches is important.

## Known Limitations

1. `pama` supports only one value to match. This, however, can be easily mitigated by using an array literal:
    ```js
    when([x, y],
       is([0, 1]).then('hit'),
       otherwise('no hit')
    );
    ```
2. At the moment there is no support for rest matching of value in the middle of array.

## Additional Features

### Guards

*Guard* is an additional condition on top of a declarative match that allows to further refine the match:

```js
when(42,
    is(Number)
        .if(x => x < 0).then('negative')
        .if(x => x >= 0).then('positive')
); // returns 'positive'
```

The function provided to a `where` must return a boolean.

### Deep Matching

```js
class Foo {
    constructor(depth = 0) {
        if (depth < 2) {
            this.foo = new Foo(depth + 1);
        } else {
            this.foo = 'bar';
        }
    }
}
when(new Foo(),
    is(Foo, {foo: 'foo'}).then('foo'),
    is(Foo, {foo: {foo:{foo: 'bar'}}}).then('bar')
); // returns 'bar'
```

### Matching Rest of Array

```js
when(['foo', 42, 43],
        is(['foo', _.rest()]),
        is(Array).then('Array')
); // returns [42, 43]
```

## Browser / Environment Support

* Evergreen (Chrome, Firefox, Opera, Safari, Edge)
* IE9+
* Node.js 0.10

## License

Copyright 2017 Dmitriy Kubyshkin

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
