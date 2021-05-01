/*
 * Created on Thu Apr 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as OpenChannelPerms from "../../api/open-channel-perms";
import { BotModule, ModuleDescriptor } from "../../api/bot/module";
import { ChatCmdListener } from "../../api/command";

/**
 * 모듈 정보
 */
export const MODULE_DESC: ModuleDescriptor = {

    id: 'example',
    name: 'example',

    desc: '테스트용 모듈'

}

/**
 * 모듈 진입점
 *
 * @param {BotModule} module MODULE_DESC를 통해 추가된 모듈
 * @param {Record<string, unknown>} options 추가 모듈 옵션
 */
export default function moduleInit(mod: BotModule, options: {}) {
    mod.logger.info("Hello world!");
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['example'],
            { usage: 'example', description: 'asdf', executeLevel: OpenChannelPerms.ALL },
            () => {
                console.log('Hello world!');
            }
        )
    );

}
