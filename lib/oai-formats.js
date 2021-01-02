const Decimal = require('decimal.js-light');

function validateByte() {
    // regExp borrowed from https://github.com/miguelmota/is-base64
    var regex = new RegExp('^(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\/]{3}=)?$','gm');
    return (value => value !== '' && regex.test(value))
}

function validateInteger(bits) {
    const withinRange = validateNumber(bits)
    return (value =>
        Number.isInteger(+value) &&
        withinRange(value)
    );
}

function validateNumber(bits) {
    const max = new Decimal(2).pow(bits - 1);
    const min = max.negated();

    return (value =>
        max.greaterThanOrEqualTo(value) &&
        min.lessThanOrEqualTo(value)
    );
}

module.exports = {
    'byte': { type: 'string', validate: validateByte() },
    'int32': { type: 'number', validate: validateInteger(32) },
    'int64': { type: 'number', validate: validateInteger(64) },
    'float': { type: 'number', validate: validateNumber(128) },
    'double': { type: 'number', validate: validateNumber(1024) },
    'binary': { type: 'string', validate: () => true },
    'password': { type: 'string', validate: () => true }
}