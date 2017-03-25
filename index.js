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
     * @param {*} x
     * @returns {*}
     */
    function id(x) {
        return x;
    }

    /**
     * @param {*} x
     * @param {*} y
     * @returns {boolean}
     */
    function eq(x, y) {
        return x === y;
    }

    /**
     * @returns {boolean}
     */
    function any() {
        return true;
    }

    function type(thing, classOrType) {
        if (typeof classOrType === 'string') {
            return typeof thing === classOrType;
        }
        return thing instanceof classOrType;
    }

    function matches(value, pattern) {
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
                if (!(prop in value) || !matches(value[prop], pattern[prop])) {
                    return false;
                }
            }
        }
        return true;
    }

    function when (value, callback) {
        if (callback === undefined) {
            callback = value;
            return function (value) {
                return when(value, callback);
            };
        }
        const result = callback({
            _: any,
            id: id,
            eq: eq.bind(undefined, value),
            type: type.bind(undefined, value),
            matches: matches.bind(undefined, value)
        }, value);
        if (typeof result === 'function') {
            return result(value);
        }
        return result;
    }

    return when;
}));
