// as ES6 "import" does not support importing of JSON like "require" did
// and the "--experimental-json-modules" flag is still experimental
// we create our own for now


import { readFile } from 'fs/promises';
export async function importJSON(filename) {
    return JSON.parse(await readFile(filename, 'utf8'))
}

