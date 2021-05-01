/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelUserInfo, OpenChannelUserInfo, TalkChannel } from "node-kakao";
import { CommandInfo } from ".";
import { ConsoleContext, TalkContext } from "../bot";

/**
 * 커맨드 도움말
 */
export type CommandHelpMap = {

    /**
     * 기본 명령어 및 인자
     *
     * 형식
     * ${command} [${argument1}...]
     */
    usage: string;

    /**
     * 설명
     */
    description: string;

    /**
     * 오픈 채팅 명령어 실행 유저 권한 조합
     */
    executeLevel?: number;

};

/**
 * 커맨드 리스너
 */
export interface CommandListener<C> {

    readonly helpMap: CommandHelpMap;

    /**
     * 명령어 실행
     *
     * @param info
     * @param ctx 
     * @return 명령어 처리시 true 반환
     */
    onCommand(info: CommandInfo, ctx: C): Promise<boolean> | boolean;

}

export class ConsoleCmdListener implements CommandListener<ConsoleContext> {

    constructor(
        private _commands: string[],
        private _helpMap: CommandHelpMap,
        private _listener: (info: CommandInfo, ctx: ConsoleContext) => void | Promise<void>
    ) {

    }

    get helpMap(): CommandHelpMap {
        return this._helpMap;
    }

    async onCommand(info: CommandInfo, ctx: ConsoleContext): Promise<boolean> {
        if (!this._commands.find((command) => command === info.command)) return false;

        await this._listener(info, ctx);

        return true;
    }

}

export class ChatCmdListener<C extends TalkChannel> implements CommandListener<TalkContext<C>> {

    constructor(
        private _commands: string[],
        private _helpMap: CommandHelpMap,
        private _listener: (info: CommandInfo, ctx: TalkContext<C>) => void | Promise<void>
    ) {

    }

    get helpMap(): CommandHelpMap {
        return this._helpMap;
    }

    async onCommand(info: CommandInfo, ctx: TalkContext<C>): Promise<boolean> {
        if (
            !this._commands.find((command) => command === info.command) ||
            this._helpMap.executeLevel && (ctx.userLevel & this._helpMap.executeLevel) === 0
        ) return false;

        await this._listener(info, ctx);

        return true;
    }

}

/**
 * 커맨드 핸들러
 */
export class CommandHandler<C> {

    private _listeners: Set<CommandListener<C>>;

    constructor() {
        this._listeners = new Set();
    }

    allHelpMap(): IterableIterator<CommandHelpMap> {
        const iter = this._listeners.values();

        return {
            [Symbol.iterator](): IterableIterator<CommandHelpMap> {
                return this;
            },

            next(): IteratorResult<CommandHelpMap> {
                const next = iter.next();

                if (next.done) return next;

                return { done: false, value: next.value.helpMap };
            }
        }
    }

    addListener(listener: CommandListener<C>) {
        this._listeners.add(listener);
    }

    hasListener(listener: CommandListener<C>): boolean {
        return this._listeners.has(listener);
    }

    deleteListener(listener: CommandListener<C>): boolean {
        return this._listeners.delete(listener);
    }

    async dispatch(command: CommandInfo, ctx: C): Promise<boolean> {
        for (const listener of this._listeners) {
            if (await listener.onCommand(command, ctx)) return true;
        }

        return false;
    }

}
