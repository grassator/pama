'use strict';

var lib = {};
function id(x) { return x; }

lib.match = function (value) {
    var valueIsObject;
    var declaration;
    var typeOrPattern;
    var callback;
    var pattern;
    var hasTypeAndPattern = false;

    var typeOfValue = typeof value;

    matching: for (var i = 1; i < arguments.length; ++i) {
        declaration = arguments[i];
        typeOrPattern = declaration[0];
        callback = null;

        if (typeof declaration[1] === 'function') {
            callback = declaration[1];
        } else if (declaration.length > 1) {
            hasTypeAndPattern = true;
            pattern = declaration[1];
            callback = declaration[2];
        }

        callback = callback || id;
        switch (typeof typeOrPattern) {
            case 'number':
                if (isNaN(value) && isNaN(typeOrPattern)) {
                    break matching;
                }
                /* fall through */
            case 'string':
                /* fall through */
            case 'undefined':
                /* fall through */
            case 'boolean':
                if (value === typeOrPattern) {
                    break matching;
                }
                break;
            case 'object':
                if (typeOrPattern === null && value === null) {
                    break matching;
                }
                if (typeOfValue === 'string' &&
                    typeOrPattern instanceof RegExp &&
                    typeOrPattern.test(value)
                ) {
                    break matching;
                }
                break;
            case 'function':
                valueIsObject = typeOfValue === 'object';
                switch (typeOrPattern) {
                    case RegExp:
                        if (valueIsObject && value instanceof RegExp) {
                            if (hasTypeAndPattern) {
                                if (pattern.source === value.source && pattern.flags === value.flags) {
                                    break matching;
                                }
                            } else {
                                break matching;
                            }
                        }
                        break;
                    case Number:
                        if (typeOfValue === 'number') {
                            break matching;
                        }
                        break;
                    case String:
                        if (typeOfValue === 'string') {
                            break matching;
                        }
                        break;
                    default:
                        if (valueIsObject && value instanceof typeOrPattern) {
                            break matching;
                        }
                        break;
                }
                break;
        }
        callback = null;
    }
    if (callback) {
        return callback(value);
    }
};

module.exports = lib;