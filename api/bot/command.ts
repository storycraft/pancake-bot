/*
 * Created on Wed Apr 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkChannel, TalkNormalChannel, TalkOpenChannel } from "node-kakao";
import { ConsoleContext, TalkContext } from "./context";
import { CommandHandler, CommandHelpMap } from "../command";
import { ChainedIterator } from "../util";

export type TalkCommandHandler<C> = CommandHandler<TalkContext<C>>;

export class BotCommandHandler {

    private _consoleHandler: CommandHandler<ConsoleContext>;

    private _anyHandler: TalkCommandHandler<TalkChannel>;

    private _normalHandler: TalkCommandHandler<TalkNormalChannel>;
    private _openHandler: TalkCommandHandler<TalkOpenChannel>;

    constructor() {
        this._consoleHandler = new CommandHandler();

        this._anyHandler = new CommandHandler();
        this._normalHandler = new CommandHandler();
        this._openHandler = new CommandHandler();
    }

    /**
     * 콘솔 명령어 핸들러
     */
    get console() {
        return this._consoleHandler;
    }

    /**
     * 오픈, 일반 채널 명령어 핸들러
     */
    get any(): TalkCommandHandler<TalkChannel> {
        return this._anyHandler;
    }

    /**
     * 일반 채널 명령어 핸들러
     */
    get normal(): TalkCommandHandler<TalkNormalChannel> {
        return this._normalHandler;
    }

    /**
     * 오픈 채널 명령어 핸들러
     */
    get open(): TalkCommandHandler<TalkOpenChannel> {
        return this._openHandler;
    }

    consoleHelpMap(): IterableIterator<CommandHelpMap> {
        return this._consoleHandler.allHelpMap();
    }

    anyHelpMap(): IterableIterator<CommandHelpMap> {
        return new ChainedIterator(this._anyHandler.allHelpMap(), this._normalHandler.allHelpMap(), this._openHandler.allHelpMap());
    }

    openHelpMap(): IterableIterator<CommandHelpMap> {
        return new ChainedIterator(this._anyHandler.allHelpMap(), this._openHandler.allHelpMap());
    }

    normalHelpMap(): IterableIterator<CommandHelpMap> {
        return new ChainedIterator(this._anyHandler.allHelpMap(), this._normalHandler.allHelpMap());
    }

}
