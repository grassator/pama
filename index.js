'use strict';

function id(x) { return x; }
function otherwise() { return true; }

var defaultSubPattern = [otherwise];

function Capture(name, subPattern) {
    this.n = name === undefined ? '' : String(name);
    this.s = subPattern === undefined ? defaultSubPattern : subPattern;
}

function createCapture(name, subPattern) {
    return new Capture(name, subPattern);
}

var defaultCapture = createCapture();
var storage;

function doMatchSubPattern(subValue, subPattern) {
    var capture = null;

    if (subPattern === otherwise) {
        return true;
    } else if (subPattern === createCapture) { // capture without any predicates
        capture = defaultCapture;
    } else {
        if (!Array.isArray(subPattern)) {
            if (subPattern.constructor === Capture) {
                capture = subPattern;
                subPattern = subPattern.s;
            } else {
                subPattern = [subPattern];
            }
        }
        subPattern = subPattern.concat(otherwise);
        if (doMatch(subValue, subPattern) === null) {
            return false;
        }
    }
    if (capture) {
        if (capture.n === '') { // support for anonymous captures
            if (storage === null) {
                storage = [subValue];
            } else {
                storage.push(subValue);
            }
        } else { // support for named captures
            if (storage === null) {
                storage = {};
            }
            storage[capture.n] = subValue;
        }
    }
    return true;
}

function doMatchArray(value, pattern) {
    for (var i = 0; i < pattern.length; ++i) {
        if (!doMatchSubPattern(value[i], pattern[i])) {
            return false;
        }
    }
    return true;
}

function doMatchObject(value, pattern) {
    for (var key in pattern) {
        if (pattern.hasOwnProperty(key)) {
            if (!doMatchSubPattern(value[key], pattern[key])) {
                return false;
            }
        }
    }
    return true;
}

function doMatch(value, declaration) {
    var valueIsObject;
    var callback;
    var pattern;

    var typeOrPattern = declaration[0];
    var hasTypeAndPattern = false;
    var predicate = declaration.length > 3 ? declaration[2] : otherwise;
    var typeOfValue = typeof value;

    callback = declaration.length > 1 ? declaration[declaration.length - 1] : id;
    if (declaration.length > 2) {
        hasTypeAndPattern = true;
        pattern = declaration[1];
    }

    callback = callback || id;
    switch (typeof typeOrPattern) {
        case 'number':
            if (isNaN(value) && isNaN(typeOrPattern)) {
                return callback;
            }
        /* fall through */
        case 'string':
        /* fall through */
        case 'undefined':
        /* fall through */
        case 'boolean':
            if (value === typeOrPattern) {
                return callback;
            }
            break;
        case 'object':
            if (typeOfValue !== 'object') {
                return null;
            }
            if (typeOrPattern === null && value === null) {
                return callback;
            }
            if (Array.isArray(typeOrPattern)) {
                if (doMatchArray(value, typeOrPattern)) {
                    return callback;
                }
            }
            if (doMatchObject(value, typeOrPattern)) {
                return callback;
            }
            break;
        case 'function':
            valueIsObject = typeOfValue === 'object';
            switch (typeOrPattern) {
                case RegExp:
                    if (valueIsObject && value instanceof RegExp) {
                        if (hasTypeAndPattern) {
                            if (pattern.source === value.source && pattern.flags === value.flags) {
                                return callback;
                            } else {
                                return null;
                            }
                        }
                        return callback;
                    }
                    break;
                case Number:
                    if (!hasTypeAndPattern && typeOfValue === 'number') {
                        return callback;
                    }
                    break;
                case String:
                    if (!hasTypeAndPattern && typeOfValue === 'string') {
                        return callback;
                    }
                    break;
                case otherwise:
                    if (!hasTypeAndPattern) {
                        return callback;
                    }
                    break;
                default:
                    if (!hasTypeAndPattern && valueIsObject && value instanceof typeOrPattern) {
                        return callback;
                    }
                    break;
            }
            break;
    }
    if (hasTypeAndPattern) {
        switch (typeof pattern) {
            case 'object':
                if (predicate(value) && doMatchObject(value, pattern)) {
                    return callback;
                }
                break;
            case 'function':
                if (pattern(value) === true && predicate(value)) {
                    return callback;
                }
                break;
            default:
                if (pattern === value && predicate(value)) {
                    return callback;
                }
        }
    }
    return null;
}

exports.match = function (value) {
    for (var i = 1, callback; i < arguments.length; ++i) {
        storage = null;
        if ((callback = doMatch(value, arguments[i]))) {
            return storage === null ? callback(value) :
                (Array.isArray(storage) ?
                    callback.apply(undefined, storage) :
                    callback(storage)
                );
        }
    }
};

exports.capture = exports.$ = createCapture;
exports.id = exports.identity = id;
exports._ = exports.otherwise = otherwise;