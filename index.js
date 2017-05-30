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

    /**
     * @returns {boolean}
     */
    function any() {
        return true;
    }

    /**
     * @param {*} value
     * @return {*}
     */
    function otherwise(value) {
        return value;
    }

    function is(value, typeOrPattern, pattern) {
        if (typeof pattern === 'undefined') {
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
        if (typeof pattern === 'function' && typeOrPattern !== 'function') {
            return pattern(value);
        }
        if (typeof pattern !== 'object' || pattern === null) {
            return value === pattern;
        }
        if (pattern instanceof RegExp) {
            if (typeof value !== 'string') {
                return false;
            }
            return pattern.test(value);
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

    var currentValue;

    function when(value, callback) {
        if (typeof callback === 'undefined') {
            callback = value;
            return function (value) {
                return when(value, callback);
            };
        }

        var result;

        // This is necessary to support nested matching
        var previousValue = currentValue;
        currentValue = value;

        try {
            result = callback(any, value);
        } finally {
            currentValue = previousValue;
        }
        if (result === TypeError) {
            throw new TypeError('Unexpected value ' + value);
        }
        if (typeof result === 'function') {
            return result(value);
        }
        return result;
    }

    return {
        when: when,
        otherwise: otherwise,
        is: function (typeOrPattern, pattern) {
            return is(currentValue, typeOrPattern, pattern);
        }
    };
}));
