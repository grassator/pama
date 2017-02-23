'use strict';

function id(x) { return x; }
function otherwise() { return true; }

var defaultSubpattern = [otherwise];

function Capture(name, subpattern) {
    this.n = name === undefined ? '' : String(name);
    this.s = subpattern === undefined ? defaultSubpattern : subpattern;
}

function createCapture(name, subpattern) {
    return new Capture(name, subpattern);
}

var defaultCapture = createCapture();
var storage;

function doMatch(value, declaration) {
    var valueIsObject;
    var callback;
    var pattern;
    var subpattern;
    var capture;
    var key;

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
            if (typeOrPattern === null && value === null) {
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
                if (predicate(value)) {
                    for (key in pattern) {
                        if (pattern.hasOwnProperty(key)) {
                            capture = null;
                            subpattern = pattern[key];
                            // this happens when user specify capture without any predicates
                            if (subpattern === createCapture) {
                                capture = defaultCapture;
                            } else {
                                if (subpattern.constructor === Capture) {
                                    capture = subpattern;
                                    subpattern = subpattern.s;
                                }
                                subpattern = subpattern.concat(otherwise);
                                if (doMatch(value[key], subpattern) === null) {
                                    return null;
                                }
                            }
                            if (capture) {
                                if (capture.n === '') { // support for anonymous captures
                                    if (storage === null) {
                                        storage = [value[key]];
                                    } else {
                                        storage.push(value[key]);
                                    }
                                } else { // support for named captures
                                    if (storage === null) {
                                        storage = {};
                                    }
                                    storage[capture.n] = value[key];
                                }
                            }
                        }
                    }
                }
                return callback;
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