/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Writable } from "stream";
import { PromiseWritable } from "promise-writable";
import * as fs from 'fs/promises';
import * as fsExtra from 'fs-extra';
import * as path from 'path';

/**
 * 로거 인터페이스
 */
export interface Logger {

    /// info level 로그
    info(text: string): Promise<void>;

    /// warn level 로그
    warn(text: string): Promise<void>;

    /// error level 로그
    error(text: string): Promise<void>;

    /// fatal level 로그
    fatal(text: string): Promise<void>;
}

export class SubLogger implements Logger {

    constructor(private _name: string, private _parent: Logger) {

    }

    info(text: string): Promise<void> {
        return this._parent.info(`[${this._name}] ${text}`);
    }

    warn(text: string): Promise<void> {
        return this._parent.warn(`[${this._name}] ${text}`);
    }

    error(text: string): Promise<void> {
        return this._parent.error(`[${this._name}] ${text}`);
    }

    fatal(text: string): Promise<void> {
        return this._parent.fatal(`[${this._name}] ${text}`);
    }

}

/**
 * 로거에 날짜, 로그 level, 컬러 적용
 */
export class StyledLogger implements Logger {

    constructor(
        private _logger: Logger,
        public time: boolean = true,
        public level: boolean = true,
        public color: boolean = true
    ) {

    }

    protected _applyColor(color: string, str: string): string {
        if (!this.color) return str;

        return `\u001b${color}${str}\u001b[0m`;
    }

    protected _styleText(date: Date, level: string, text: string): string {
        let styled = '';

        if (this.time) styled += `[${date.toLocaleTimeString()}] `;
        if (this.level) styled += `[${level}] `;

        styled += text;

        return styled;
    }

    async info(text: string): Promise<void> {
        this._logger.info(this._styleText(new Date(), 'info', text));
    }

    async warn(text: string): Promise<void> {
        this._logger.warn(this._applyColor('[33;1m', `${this._styleText(new Date(), 'warn', text)}`));
    }

    async error(text: string): Promise<void> {
        this._logger.warn(this._applyColor('[31;1m', `${this._styleText(new Date(), 'error', text)}`));
    }

    async fatal(text: string): Promise<void> {
        this._logger.warn(this._applyColor('[31m', `${this._styleText(new Date(), 'fatal', text)}`));
    }

}

export class GroupLogger implements Logger {

    constructor(private _loggers: Logger[]) {

    }

    async info(text: string): Promise<void> {
        await Promise.all(this._loggers.map(logger => logger.info(text)));
    }

    async warn(text: string): Promise<void> {
        await Promise.all(this._loggers.map(logger => logger.warn(text)));
    }

    async error(text: string): Promise<void> {
        await Promise.all(this._loggers.map(logger => logger.error(text)));
    }

    async fatal(text: string): Promise<void> {
        await Promise.all(this._loggers.map(logger => logger.fatal(text)));
    }

}

export class WritableLogger implements Logger {

    private _writable: PromiseWritable<Writable>;
    private _errWritable: PromiseWritable<Writable>;

    constructor(writable: Writable, errWritable: Writable) {
        this._writable = new PromiseWritable(writable);
        this._errWritable = new PromiseWritable(errWritable);
    }

    async info(text: string): Promise<void> {
        await this._writable.write(`${text}\n`);
    }

    async warn(text: string): Promise<void> {
        await this._writable.write(`${text}\n`);
    }

    async error(text: string): Promise<void> {
        await this._errWritable.write(`${text}\n`);
    }

    async fatal(text: string): Promise<void> {
        await this._errWritable.write(`${text}\n`);
    }

}

export class FileLogger implements Logger {

    constructor(
        private _logDir: string
    ) {

    }

    protected _getFileName(date: Date): string {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    protected _getLogFile(date: Date): string {
        return path.join(this._logDir, this._getFileName(date) + '.log');
    }

    protected async _appendLog(date: Date, text: string) {
        await fsExtra.ensureDir(this._logDir);
        await fs.appendFile(this._getLogFile(date), text + '\n', 'utf-8');
    }

    async info(text: string): Promise<void> {
        await this._appendLog(new Date(), text);
    }

    async warn(text: string): Promise<void> {
        await this._appendLog(new Date(), text);
    }
    
    async error(text: string): Promise<void> {
        await this._appendLog(new Date(), text);
    }

    async fatal(text: string): Promise<void> {
        await this._appendLog(new Date(), text);
    }

}
