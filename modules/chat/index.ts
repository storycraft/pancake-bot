/*
 * Created on Sat May 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkChannel, util } from "node-kakao";
import { BotModule, ModuleDescriptor, TalkContext } from "../../api/bot";
import { Logger } from "../../api/logger";
import FileAsync from 'lowdb/adapters/FileAsync';
import low from 'lowdb';
import * as path from 'path';
import { ensureFile } from "fs-extra";
import { ChatFilterManager } from "./filter";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'chat',
    name: 'chat',

    desc: '채팅 로그, 채팅 관련 명령어를 제공합니다'

}

export default async function moduleInit(mod: BotModule) {
    mod.on('chat', (ctx) => logChat(ctx, mod.logger));

    const filterDBPath = path.join(mod.dataDir, 'filters.json');
    await ensureFile(filterDBPath);

    mod.logger.info('챗 필터를 불러오는 중...');
    const filterDB = await low(new FileAsync(filterDBPath, { defaultValue: {} }));
    mod.logger.info('챗 필터 로드 완료');

    const manager = new ChatFilterManager(mod, filterDB);
}

function logChat({ data, channel }: TalkContext<TalkChannel>, chatLogger: Logger) {
    const senderInfo = data.getSenderInfo(channel);

    if (!senderInfo) {
        chatLogger.warn(`채널 ${channel.getDisplayName()}(${channel.channelId}) 의 유저 id: ${data.chat.sender.userId} 의 info가 없습니다.`);
    }

    chatLogger.info(`${channel.info.type} | id: ${channel.channelId} (${channel.getDisplayName()}) userId: ${data.chat.sender.userId} (${senderInfo?.nickname || ''}) type: ${data.chat.type} text: ${data.chat.text} attachment: ${util.JsonUtil.stringifyLoseless(data.chat.attachment)}`);
}