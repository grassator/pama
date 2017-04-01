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

    var currentValue;

    /**
     * @returns {boolean}
     */
    function any() {
        return true;
    }

    function is(value, typeOrPattern, pattern) {
        if (pattern === undefined) {
            pattern = typeOrPattern;
        } else {
            if (typeof typeOrPattern === 'string') {
                if (typeof value !== typeOrPattern) {
                    return false;
                }
            } else if (!(value instanceof typeOrPattern)) {
                return false;
            }
        }
        if (pattern === any) {
            return true;
        }
        if (typeof pattern !== 'object' || pattern === null) {
            return value === pattern;
        }
        if (typeof value !== 'object') {
            return false;
        }
        for (var prop in pattern) {
            if (pattern.hasOwnProperty(prop)) {
                if (!(prop in value) || !is(value[prop], pattern[prop])) {
                    return false;
                }
            }
        }
        return true;
    }

    function when(value, callback) {
        if (callback === undefined) {
            callback = value;
            return function (value) {
                return when(value, callback);
            };
        }

        // This is necessary to support nested matching
        var previousValue = currentValue;
        currentValue = value;
        try {
            var result = callback(any, value);
        } finally {
            currentValue = previousValue;
        }
        if (typeof result === 'function') {
            return result(value);
        }
        return result;
    }

    function createMatcher(predicate) {
        return function (arg1, arg2) {
            return predicate(currentValue, arg1, arg2);
        };
    }

    return {
        when: when,
        createMatcher: createMatcher,
        is: createMatcher(is)
    };
}));
