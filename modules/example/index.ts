/*
 * Created on Thu Apr 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as OpenChannelPerms from "../../api/open-channel-perms";
import { BotModule, ModuleDescriptor } from "../../api/bot/module";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import { ConsoleContext, TalkContext } from "../../api/bot";
import { TalkChannel, TalkOpenChannel, TalkNormalChannel } from "node-kakao";

/**
 * 모듈 정보
 */
export const MODULE_DESC: ModuleDescriptor = {

    id: 'example',
    name: 'example',

    desc: 'example 모듈'

}

/**
 * 모듈 진입점
 *
 * @param {BotModule} module MODULE_DESC를 통해 추가된 모듈
 * @param {Record<string, unknown>} options 추가 모듈 옵션
 */
export default function moduleInit(mod: BotModule, options: {}) {
    mod.logger.info("Hello world!");

    // 명령어 추가
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['example'],
            {
                /**
                 * 명령어 prefix를 제외한 명령어 형식
                 * 인자는 공백을 통해 구별합니다.
                 * required 인자는 소괄호 ex) (설명), optional 인자는 대괄호 ex) [설명] 으로 감쌉니다.
                 */
                usage: 'example',

                /**
                 * 명령어에 대한 설명
                 */
                description: 'asdf',

                /**
                 * Optional
                 * 
                 * 명령어 실행 권한
                 */
                executeLevel: OpenChannelPerms.ALL
            },
            (
                // 커맨드 정보를 담고 있는 객체
                info: CommandInfo,

                // 명령어 Context
                ctx: TalkContext<TalkChannel>
            ) => {
                mod.logger.info('Hello world!');
            }
        )
    );

    // 일반 채팅방 전용 명령어
    mod.commandHandler.normal.addListener(
        new ChatCmdListener(
            ['example-normal'],
            {
                usage: 'example-normal',
                description: 'asdf'
            },
            (info: CommandInfo, ctx: TalkContext<TalkNormalChannel>) => {
                mod.logger.info('Hello world!');
            }
        )
    );

    // 오픈 채팅방 전용 명령어
    mod.commandHandler.open.addListener(
        new ChatCmdListener(
            ['example-open'],
            {
                usage: 'example-open',
                description: 'asdf'
            },
            (info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) => {
                mod.logger.info('Hello world!');
            }
        )
    );

    // 콘솔 명령어
    mod.commandHandler.console.addListener(
        new ChatCmdListener(
            ['example-con'],
            {
                usage: 'example-con',
                description: 'asdf'
            },
            (info: CommandInfo, ctx: ConsoleContext) => {
                mod.logger.info('Hello world!');
            }
        )
    );

}
