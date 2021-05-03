/*
 * Created on Mon May 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Readable } from "stream";

export function readableToBuffer(readable: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        readable.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        readable.on('error', (err) => reject(err));
        readable.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
