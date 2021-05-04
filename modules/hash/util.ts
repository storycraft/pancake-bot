/*
 * Created on Tue May 04 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as crypto from 'crypto';

export function nodeHashHex(method: string, input: string): string {
    const hash = crypto.createHash(method);
    hash.update(input);

    return hash.digest('hex');
}

export function binaryEncode(input: string): string {
    let res = '';

    for (const byte of Buffer.from(input)) {
        res += `\\x${byte.toString(16)}`;
    }

    return res;
}
