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

## Usage

See [tests](index.test.js) for sample usage.

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
