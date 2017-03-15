(function (root, factory) {
    /* global define : false */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.pama = factory();
    }
}(this, function () {

    'use strict';

    function id(x) {
        return x;
    }

    function constant(value) {
        return function () {
            return value;
        };
    }

    function Undefined() {
    }

    /**
     * @param {Function} type
     * @param {*} pattern
     * @constructor
     */
    function PatternMatcher(type, pattern) {
        this.type = type;
        this.pattern = pattern;
        this.callback = id;
        this.guards = null;
        this.storage = null;
    }

    /**
     * @param {Function} predicate
     * @returns {PatternMatcher}
     */
    PatternMatcher.prototype['guard'] = function (predicate) {
        if (this.guards === null) {
            this.guards = [];
        }
        this.guards.push(new Guard(predicate));
        return this;
    };

    /**
     * @param {Function} callback
     * @returns {PatternMatcher}
     */
    PatternMatcher.prototype['then'] = function (callback) {
        callback = (typeof callback === 'function') ?
            callback : constant(callback);
        if (this.guards !== null) {
            this.guards[this.guards.length - 1].callback = callback;
        } else {
            this.callback = callback;
        }
        return this;
    };

    /**
     * @param {*} name
     * @param {*} matcher
     * @constructor
     */
    function Capture(name, matcher) {
        this.name = name;
        this.matcher = matcher === undefined ? any : matcher;
        this.isRest = false;
    }

    /**
     * @param {*} nameOrSubPattern
     * @param {*=} subPatternOrNothing
     * @returns {Capture}
     */
    function createCapture(nameOrSubPattern, subPatternOrNothing) {
        if (arguments.length === 1) {
            if (typeof nameOrSubPattern === 'string') {
                return new Capture(nameOrSubPattern);
            } else {
                return new Capture(undefined, nameOrSubPattern);
            }
        } else {
            return new Capture(nameOrSubPattern, subPatternOrNothing);
        }
    }

    var any = createCapture;

    /**
     * @param {string=} name
     * @return {Capture}
     */
    function remainingArrayItems(name) {
        var capture = new Capture(name);
        capture.isRest = true;
        return capture;
    }

    any.rest = createCapture.rest = remainingArrayItems;

    var defaultCapture = createCapture(any);

    /**
     * @param {*} value
     * @constructor
     */
    function CallbackArgs(value) {
        this.value = value;
        this.storage = null;
    }

    /**
     * @param {*} value
     * @param {*} name
     */
    CallbackArgs.prototype.push = function (value, name) {
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

    /**
     * @returns {Array}
     */
    CallbackArgs.prototype.toArray = function () {
        if (this.storage === null) {
            return [this.value];
        }
        if (Array.isArray(this.storage)) {
            return this.storage;
        }
        return [this.storage];
    };

    /**
     * @param {Function} predicate
     * @constructor
     */
    function Guard(predicate) {
        this.predicate = predicate;
        this.callback = id;
    }


    /**
     * @param {*} pattern
     * @returns {Function}
     */
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
            default:
                return Object;
        }
    }

    /**
     * @param {*} value
     * @param {PatternMatcher} matcher
     * @param {CallbackArgs} storage
     */
    function doMatch(value, matcher, storage) {
        var typeOfValue = typeof value;
        var pattern = matcher.pattern;
        var callback = matcher.callback;
        var type = matcher.type;
        switch (type) {
            case any:
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
        if (pattern !== any) {
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
     * @param {CallbackArgs} storage
     */
    function doMatchObjectInternal(value, pattern, storage) {
        var capture = null;
        var result = true;
        if (pattern instanceof Capture) {
            capture = pattern;
            pattern = capture.matcher;
        }
        if (pattern !== any) {
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
     * @param {*} pattern
     * @param {CallbackArgs} storage
     */
    function doMatchObject(value, pattern, storage) {
        if (value === null) {
            return value === pattern;
        }
        if (Array.isArray(pattern)) {
            if (!Array.isArray(value)) {
                return false;
            }
            var hasRestMatch = false;
            var lastItem;
            if (pattern.length > 0) {
                lastItem = pattern[pattern.length - 1];
                if (lastItem === remainingArrayItems || (lastItem && lastItem.isRest)) {
                    hasRestMatch = true;
                }
            }
            if (!hasRestMatch && pattern.length !== value.length) {
                return false;
            }
            for (var i = 0; i < pattern.length; ++i) {
                if (i === pattern.length - 1 && hasRestMatch) {
                    if (lastItem === remainingArrayItems) {
                        return true;
                    } else {
                        return doMatchObjectInternal(value.slice(i), pattern[i], storage);
                    }
                }
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

    var exports = {};

    /**
     * @param {*=} type
     * @param {*=} pattern
     * @returns {PatternMatcher}
     */
    exports['is'] = function (type, pattern) {
        if (arguments.length === 0) {
            type = pattern = any;
        } else if (typeof type !== 'function') {
            pattern = type;
            type = patternToType(pattern);
        } else if (arguments.length === 1) {
            pattern = any;
        }
        return new PatternMatcher(type, pattern);
    };

    /**
     * @param {*} value
     * @param {...PatternMatcher} varArgs
     * @returns {*}
     */
    exports['when'] = function (value, varArgs) { // eslint-disable-line no-unused-vars
        for (var i = 1, callback, storage; i < arguments.length; ++i) {
            storage = new CallbackArgs(value);
            if ((callback = doMatch(value, arguments[i], storage))) {
                return callback.apply(undefined, storage.toArray());
            }
        }
    };

    exports['capture'] = exports['$'] = createCapture;
    exports['_'] = exports['any'] = any;

    return exports;
}));