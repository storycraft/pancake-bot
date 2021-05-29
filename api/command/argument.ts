/*
 * Created on Thu May 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export type ArgumentTypes = 'number' | 'string';

/**
 * 커맨드 인자 파서
 */
export class TextArgumentParser {

    constructor(
        private _separator: string | RegExp
    ) {

    }

    parse(raw: string): string[] {
        return raw.split(this._separator);
    }

}
