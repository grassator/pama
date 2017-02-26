'use strict';

function id(x) { return x; }
function otherwise() { return true; }
function constant(value) { return function () { return value; }; }

function Capture(name, matcher) {
    this.name = name;
    this.matcher = matcher === undefined ? otherwise : matcher;
}

function createCapture(name, subPattern) {
    return new Capture(name, subPattern);
}

function Undefined(){}

var defaultCapture = createCapture();

function Storage(value) {
    this.value = value;
    this.storage = null;
}

Storage.prototype.push = function (value, name) {
    if (name !== undefined) {
        if (this.storage === null) {
            this.storage = {};
        }
        this.storage[name] = value;
    } else {
        if (this.storage === null) {
            this.storage = [];
        }
        this.storage.push(value);
    }
};

Storage.prototype.toArgs = function () {
    if (this.storage === null) {
        return [this.value];
    }
    if (Array.isArray(this.storage)) {
        return this.storage;
    }
    return [this.storage];
};

function Guard(predicate) {
    this.predicate = predicate;
    this.callback = id;
}

function PatternMatcher(type, pattern) {
    this.type = type;
    this.pattern = pattern;
    this.callback = id;
    this.guards = null;
    this.storage = null;
}

PatternMatcher.prototype['guard'] = function (predicate) {
    if (this.guards === null) {
        this.guards = [];
    }
    this.guards.push(new Guard(predicate));
    return this;
};

PatternMatcher.prototype['then'] = function (callback) {
    callback = (typeof callback === 'function') ?
        callback : constant(callback);
    if (this.guards !== null) {
        this.guards[this.guards.length - 1].callback = callback
    } else {
        this.callback = callback;
    }
    return this;
};


function patternToType(pattern) {
    switch (typeof pattern) {
        case 'undefined':
            return Undefined;
        case 'number':
            return Number;
        case 'boolean':
            return Boolean;
        case 'string':
            return String;
        case 'object':
            return Object;
    }
}

/**
 * @param {*=} type
 * @param {*=} pattern
 * @returns {PatternMatcher}
 */
exports['when'] = function (type, pattern) {
    if (arguments.length === 0) {
        type = pattern = otherwise;
    } else if (typeof type !== 'function') {
        pattern = type;
        type = patternToType(pattern);
    } else if (arguments.length === 1) {
        pattern = otherwise;
    }
    return new PatternMatcher(type, pattern);
};

/**
 * @param {*} value
 * @param {PatternMatcher} matcher
 * @param {Storage} storage
 */
function doMatch(value, matcher, storage) {
    var typeOfValue = typeof value;
    var pattern = matcher.pattern;
    var callback = matcher.callback;
    var type = matcher.type;
    switch (type) {
        case otherwise:
            break;
        case Boolean:
            if (typeOfValue !== 'boolean') {
                return null;
            }
            break;
        case Number:
            if (typeOfValue !== 'number') {
                return null;
            }
            break;
        case String:
            if (typeOfValue !== 'string') {
                return null;
            }
            break;
        case Undefined:
            if (typeOfValue !== 'undefined') {
                return null;
            }
            break;
        case Object:
            if (typeOfValue !== 'object') {
                return null;
            }
            break;
        default:
            if (!(value instanceof type)) {
                return null;
            }
            break;
    }
    var isMatch = true;
    var guards = matcher.guards;
    if (pattern !== otherwise) {
        switch (matcher.type) {
            case Number:
                if (isNaN(value) && isNaN(pattern)) {
                    break;
                }
                /* fallthrough */
            case Boolean:
            case String:
            case Undefined:
                isMatch = value === pattern;
                break;
            default:
                isMatch = doMatchObject(value, pattern, storage);
                break;
        }
    }
    if (guards !== null) {
        for (var i = 0; i < guards.length; ++i) {
            if (guards[i].predicate(value) === true) {
                callback = guards[i].callback;
                isMatch = true;
                break;
            }
        }
    }
    return isMatch ? callback : null;
}


/**
 * @param {*} value
 * @param {*} pattern
 * @param {Storage} storage
 */
function doMatchObjectInternal(value, pattern, storage) {
    var capture = null;
    var result = true;
    if (pattern === createCapture) {
        pattern = defaultCapture;
    }
    if (pattern instanceof Capture) {
        capture = pattern;
        pattern = capture.matcher;
    }
    if (pattern !== otherwise) {
        if (!(pattern instanceof PatternMatcher)) {
            pattern = new PatternMatcher(patternToType(pattern), pattern);
        }
        result = doMatch(value, pattern, storage) !== null;
    }
    if (result && capture !== null) {
        storage.push(value, capture.name);
    }
    return result;
}

/**
 * @param {*} value
 * @param {object} pattern
 * @param {Storage} storage
 */
function doMatchObject(value, pattern, storage) {
    if (value === null) {
        return value === pattern;
    }
    if (Array.isArray(pattern)) {
        if ((!Array.isArray(value) || pattern.length !== value.length)) {
            return false;
        }
        for (var i = 0; i < pattern.length; ++i) {
            if (!doMatchObjectInternal(value[i], pattern[i], storage)) {
                return false;
            }
        }
    } else {
        for (var key in pattern) {
            if (pattern.hasOwnProperty(key)) {
                if (!doMatchObjectInternal(value[key], pattern[key], storage)) {
                    return false;
                }
            }
        }
    }
    return true;
}

exports['match'] = function (value) {
    for (var i = 1, callback, storage; i < arguments.length; ++i) {
        storage = new Storage(value);
        if ((callback = doMatch(value, arguments[i], storage))) {
            return callback.apply(undefined, storage.toArgs());
        }
    }
};

exports.capture = exports.$ = createCapture;
exports.id = exports.identity = id;
exports._ = exports.otherwise = otherwise;