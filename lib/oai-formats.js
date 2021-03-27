
function validateByte() {
    // regExp borrowed from https://github.com/miguelmota/is-base64
    var regex = new RegExp('^(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\/]{3}=)?$', 'gm');
    return (value => value !== '' && regex.test(value))
}

function validateInteger(bits) {
    const max = BigInt(2) ** BigInt(bits - 1);
    const min = max * BigInt(-1);
    return (value =>
        Number.isInteger(+value) &&
        BigInt(value) <= max &&
        BigInt(value) >= min
    );
}

function validateNumber(bits) {
    const max = Number(BigInt(2) ** BigInt(bits - 1));
    const min = max * -1;

    return (value =>
        max >= value &&
        min <= value
    );
}

module.exports = {
    'byte': { type: 'string', validate: validateByte() },
    'int32': { type: 'number', validate: validateInteger(32) },
    'int64': { type: 'number', validate: validateInteger(64) },
    'float': { type: 'number', validate: validateNumber(128) },
    'double': { type: 'number', validate: validateNumber(1024) },
    'binary': true,
    'password': true
}