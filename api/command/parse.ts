/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandInfo } from ".";
import { escapeRegex } from "./util";

/**
 * 커맨드 파서
 */
export interface CommandParser {

    /**
     * 해당 챗 객체를 커맨드로 파싱
     * 
     * 성공시 CommandInfo 객체 반환
     */
    parse(text: string): CommandInfo | null;

}

/**
 * string -> Command 파서
 * 
 * 형식: {prefix}[{namespace}:]{command} [${args[0]}] [${args[1]}]...
 */
export class TextCommandParser implements CommandParser {

    private _exp: RegExp;

    constructor(_prefix: string, _separator: string) {
        this._exp = new RegExp(
            `^(${escapeRegex(_prefix)})(?:(\\S+)${escapeRegex(_separator)})?(\\S+)(?: (.+))?`
        );
    }

    parse(text: string): CommandInfo | null {
        const match = text.match(this._exp);
        if (!match) return null;

        const namespace = match[2] || '';
        const command = match[3];
        const args = match[4] || '';

        return {
            text,
            namespace,
            command,
            args
        };
    }

}
