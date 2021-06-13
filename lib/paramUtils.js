function setProperty(ob, path, value) {
  const key = path[0];
  if (path.length === 1) {
    ob[key] = value;
  } else {
    // If the next key is a number, assume that we should construct an array.
    //   "foo[0][a]=1" -> { foo: [{ a: 1 }] }
    // This is usually, but not necessarily, correct, since
    //   "foo[0][a]=1" -> { foo: { '0': { a: 1 } } }
    // is also possible. But ajv will throw validation errors if a supposed
    // array comes back as an object, and if we have to guess, this is safer.
    // (An ideal approach would use the JSON schema.)
    let nextKey = path[1];
    if (/^\d+$/.test(nextKey)) nextKey = Number(nextKey);
    if (!(key in ob)) ob[key] = typeof nextKey === "number" ? [] : {};
    setProperty(ob[key], path.slice(1), value);
  }
}

exports.mergeDeepObjectParam = function mergeDeepObjectParam(ob, name) {
  for (const key of Object.keys(ob)) {
    if (!key.startsWith(`${name}[`)) {
      continue;
    }

    const rest = key.substr(name.length);
    if (/^(\[\w+])+/.test(rest)) {
      const keys = rest
        .substr(0, rest.length - 1)
        .split("]")
        .map((s) => s.substr(1));
      setProperty(ob, [name, ...keys], ob[key]);
      delete ob[key];
    }
  }
};
