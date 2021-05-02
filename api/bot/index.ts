/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './command';
export * from './loader';
export * from './context';
export * from './module';

import { AsyncCommandResult, AuthApiClient, OpenChannelUserPerm, TalkChannel, TalkChatData, TalkClient, TalkNormalChannel, TalkOpenChannel } from "node-kakao";
import { CommandInfo, CommandParser, TextCommandParser } from "../command";
import { Logger, SubLogger } from "../logger";
import { BotModule, ModuleDescriptor } from "./module";
import { delay } from "../util";
import { ConsoleContext, TalkContext } from "./context";
import * as path from 'path';
import { TypedEmitter } from '../event';

/**
 * 봇 계정 정보
 */
export type BotCredential = {

    deviceName: string,
    deviceUUID: string,

    email: string,
    password: string

}

/**
 * 봇 콘픽
 */
export type BotConfig = {

    /// 연결이 끊겼을시 재시도 횟수
    reconnectAttempts: number;

    /// 커맨드 접두사
    commandPrefix: string,

    /// 커맨드 네임스페이스 구분자
    commandSeparator: string

}

export const DEFAULT_CONFIG: BotConfig = {

    reconnectAttempts: 5,

    commandPrefix: '-',
    commandSeparator: ':'
    
};

export interface BotEvents {

    'module_added': (mod: BotModule) => void;

    'module_unloaded': (id: string) => void;

    'stop': () => void;

}

/**
 * 봇
 */
export class Bot extends TypedEmitter<BotEvents> {

    /// 봇 로거
    private _logger: Logger;

    /// 모듈 목록
    private _moduleMap: Map<string, BotModule>;

    /// 콘솔 명령어 파서
    private _consoleParser: CommandParser;

    /// 채팅 명령어 파서
    private _chatParser: CommandParser;

    private constructor(
        /// 봇 인증 정보
        private _credential: BotCredential,
        /// 봇 클라이언트
        private _client: TalkClient,
        // 최상위 데이터 폴더 경로
        private _rootDataDir: string,
        /// 봇 루트 로거
        private _rootLogger: Logger,
        /// 봇 콘픽
        private _config: BotConfig
    ) {
        super();

        this._moduleMap = new Map();
        this._logger = new SubLogger('bot', this._rootLogger);

        this._consoleParser = new TextCommandParser('', this._config.commandSeparator);
        this._chatParser = new TextCommandParser(this._config.commandPrefix, this._config.commandSeparator);

        _client.on('error', (err) => {
            this._logger.error(`봇 작동중 오류가 발생했습니다. err: ${String(err)}`);
        });

        _client.on('disconnected', async (code) => {
            this._logger.warn(`서버와의 연결이 끊어졌습니다. 재 연결을 시도 합니다. code: ${code}`);
            await this._refreshConnection();
        });
    
        _client.on('switch_server', async () => {
            await this._refreshConnection();
        });

        _client.channelList.normal.on('chat', (data, channel) => {
            this._onNormalChat(data, channel);
        });

        _client.channelList.open.on('chat', (data, channel) => {
            this._onOpenChat(data, channel);
        });
    }

    get client(): TalkClient {
        return this._client;
    }

    get config(): Readonly<BotConfig> {
        return this._config;
    }

    get chatParser(): CommandParser {
        return this._chatParser;
    }

    get consoleParser(): CommandParser {
        return this._consoleParser;
    }

    /**
     * 주어진 문자열을 콘솔 명령으로 실행
     *
     * @param text 명령어
     * @returns 명령어를 실행시 true 반환
     */
    async dispatchConsole(text: string): Promise<boolean> {
        const commandInfo = this._consoleParser.parse(text);

        if (!commandInfo) {
            this._logger.error('잘못된 명령어 입니다');
            return false;
        }

        const ctx: ConsoleContext = {
            bot: this
        };

        for (const mod of this._moduleMap.values()) {
            if (await mod.commandHandler.console.dispatch(commandInfo, ctx))  {
                return true;
            }
        }

        this._logger.error(`"${text}" 은(는) 알 수 없는 명령어 입니다`);

        return false;
    }

    protected async _onNormalChat(data: TalkChatData, channel: TalkNormalChannel) {
        const commandInfo = this._chatParser.parse(data.text);

        const ctx: TalkContext<TalkNormalChannel> = {
            channel,
            data,
            userLevel: OpenChannelUserPerm.OWNER,
            bot: this
        };

        if (commandInfo) {
            if (!await this.dispatchNormalCommand(commandInfo, ctx)) {
                await this.dispatchAnyCommand(commandInfo, ctx);
            }
        }

        for (const mod of this._moduleMap.values()) {
            mod.emit('normal_chat', ctx);
            mod.emit('chat', ctx);
        }
    }

    protected async _onOpenChat(data: TalkChatData, channel: TalkOpenChannel) {
        const commandInfo = this._chatParser.parse(data.text);

        const info = channel.getUserInfo(data.chat.sender);

        const ctx: TalkContext<TalkOpenChannel> = {
            channel,
            data,
            userLevel: info ? info.perm : OpenChannelUserPerm.NONE,
            bot: this
        };

        if (commandInfo) {
            if (!await this.dispatchOpenCommand(commandInfo, ctx)) {
                await this.dispatchAnyCommand(commandInfo, ctx);
            }
        }

        for (const mod of this._moduleMap.values()) {
            mod.emit('open_chat', ctx);
            mod.emit('chat', ctx);
        }
    }

    async dispatchAnyCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>): Promise<boolean> {
        for (const mod of this._moduleMap.values()) {
            if (await mod.commandHandler.any.dispatch(info, ctx)) return true;
        }

        return false;
    }

    async dispatchOpenCommand(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>): Promise<boolean> {
        for (const mod of this._moduleMap.values()) {
            if (await mod.commandHandler.open.dispatch(info, ctx)) return true;
        }

        return false;
    }

    async dispatchNormalCommand(info: CommandInfo, ctx: TalkContext<TalkNormalChannel>): Promise<boolean> {
        for (const mod of this._moduleMap.values()) {
            if (await mod.commandHandler.normal.dispatch(info, ctx)) return true;
        }

        return false;
    }

    protected async _refreshConnection(): AsyncCommandResult {
        let lastRes = await this.refreshSession();

        if (lastRes.success) return lastRes;

        for (let attempt = 1; attempt < this._config.reconnectAttempts; attempt++) {
            const timeout = attempt * 5000;

            this._logger.warn(`재접속이 실패 했습니다. ${timeout / 1000} 초 뒤 재시도 합니다.`);
            await delay(timeout);

            lastRes = await this.refreshSession();

            if (lastRes.success) return lastRes;
        }

        return lastRes;
    }

    async refreshSession(): AsyncCommandResult {
        this._logger.info('세션을 새로고치는중...');
        const auth = await AuthApiClient.create(this._credential.deviceName, this._credential.deviceUUID);

        const authRes = await auth.login({ forced: true, ...this._credential });

        if (!authRes.success) {
            this._logger.fatal(`엑세스 토큰 재발급 실패 status: ${authRes.status}`);
            this._logger.fatal('세션 새로고침이 실패 했습니다.');
            return authRes;
        }

        const loginRes = await this._client.login(authRes.result);

        if (!loginRes.success) {
            this._logger.fatal(`로코 로그인 실패 status: ${loginRes.status}`);
            this._logger.fatal('세션 새로고침이 실패 했습니다.');
            return loginRes;
        }

        this._logger.info('세션 새로고침 완료');

        return loginRes;
    }

    /**
     * 봇 모듈 생성
     *
     * @param descriptor 모듈 descriptor
     * @return {BotModule | null} 성공시 BotModule 반환, 모듈 id 충돌등으로 실패시 null 반환
     */
    createModule(descriptor: ModuleDescriptor): BotModule | null {
        if (this._moduleMap.has(descriptor.id)) return null;

        if (descriptor.id.match(/[^\w-]/)) {
            throw new Error('Module id can only contains alphabetic characters, number, - and _');
        }

        const botModule = new BotModule(
            descriptor,
            this,
            path.join(this._rootDataDir, 'modules', descriptor.id),
            new SubLogger(descriptor.id, this._rootLogger)
        );

        this._moduleMap.set(botModule.id, botModule);
        this._logger.info(`모듈 추가됨. id: "${descriptor.id}" name: "${descriptor.name}"`);

        this.emit('module_added', botModule);

        return botModule;
    }

    hasModule(id: string): boolean {
        return this._moduleMap.has(id);
    }

    allModule(): IterableIterator<BotModule> {
        return this._moduleMap.values();
    }

    /**
     * 해당 id 모듈 제거
     *
     * @param id 
     * @return {boolean} 제거 성공시 true 반환
     */
    unloadModule(id: string): boolean {
        const res = this._moduleMap.delete(id);

        if (res) {
            this._logger.info(`모듈 제거됨. id: "${id}"`);

            this.emit('module_unloaded', id);
        }

        return res;
    }

    stop() {
        this.emit('stop');
        for (const mod of this.allModule()) {
            this.unloadModule(mod.id);
        }

        this._client.close();
    }


    static async start(
        credential: BotCredential,
        client: TalkClient,
        rootDataDir: string,
        rootLogger: Logger,
        config: BotConfig = DEFAULT_CONFIG
    ): AsyncCommandResult<Bot> {
        const bot = new Bot(credential, client, rootDataDir, rootLogger, config);

        const loginRes = await bot.refreshSession();

        if (!loginRes.success) return loginRes;

        return { success: true, status: loginRes.status, result: bot };
    }

}
