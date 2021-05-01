/*
 * Created on Wed Apr 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Bot, TalkContext } from '.';
import { BotCommandHandler } from './command';
import { Logger } from '../logger';
import { TalkChannel, TalkNormalChannel, TalkOpenChannel } from 'node-kakao';
import { TypedEmitter } from '../event';

export type ModuleDescriptor = {

    id: string,
    name: string,
    desc: string

}

export interface BotEvents {

    // 모듈 언로드시 호출. 이 이벤트를 사용해서 기타 이벤트를 제거해야합니다 
    'unload': () => void;

    'chat': (ctx: TalkContext<TalkChannel>) => void;

    'normal_chat': (ctx: TalkContext<TalkNormalChannel>) => void;
    'open_chat': (ctx: TalkContext<TalkOpenChannel>) => void;

}

/**
 * 봇 모듈
 */ 
export class BotModule extends TypedEmitter<BotEvents> {

    private _commandHandler: BotCommandHandler;

    constructor(
        private _descriptor: ModuleDescriptor,
        private _bot: Bot,
        private _dataDir: string,
        private _logger: Logger
    ) {
        super();
        this._commandHandler = new BotCommandHandler();
    }

    /**
     * 명령어 핸들러
     */
    get commandHandler(): BotCommandHandler {
        return this._commandHandler;
    }

    /**
     * 봇
     */
    get bot(): Bot {
        return this._bot;
    }

    /**
     * 모듈 로거
     */
    get logger(): Logger {
        return this._logger;
    }

    /**
     * 모듈 데이터 저장소 경로
     */
    get dataDir(): string {
        return this._dataDir;
    }

    /**
     * 모듈 이름
     */
    get name(): string {
        return this._descriptor.name;
    }

    /**
     * 모듈 id, namespace
     */
    get id(): string {
        return this._descriptor.id;
    }

    /**
     * 모듈 description
     */
    get desc(): string {
        return this._descriptor.desc;
    }

}
