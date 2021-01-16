// in ESM mode node.js does not have access to __dirname anymore
import url from 'url';
import {dirname as pathDirname} from 'path';

export function dirname(importMeta) {
    return pathDirname(url.fileURLToPath(importMeta.url));
}