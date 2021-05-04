/*
 * Created on Sat May 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { KnownChatType, ReplyAttachment, TalkChannel, TalkChatData, util } from "node-kakao";
import { BotModule, ModuleDescriptor, TalkContext } from "../../api/bot";
import { Logger } from "../../api/logger";
import FileAsync from 'lowdb/adapters/FileAsync';
import low from 'lowdb';
import * as path from 'path';
import { ensureFile } from "fs-extra";
import { ChatFilterManager } from "./filter";
import * as OpenChannelPerms from '../../api/open-channel-perms';
import { ChatCmdListener } from "../../api/command";
import { LONG_CHAT_SPLITTER } from "../../api/util";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'chat',
    name: 'chat',

    desc: '채팅 로그, 채팅 관련 명령어를 제공합니다'

}

export default async function moduleInit(mod: BotModule) {
    mod.on('chat', (ctx) => logChat(ctx, mod.logger));
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['chatlog', 'chatlogs'],
            { usage: 'chatlog [채팅 수]', description: '선택된 채팅 이전의 채팅을 최대 300개까지 가져옵니다. 기본: 50', executeLevel: OpenChannelPerms.MANAGERS },
            async (info, ctx) => {
                let logId;
                if (ctx.data.originalType === KnownChatType.REPLY) {
                    const reply = ctx.data.attachment<ReplyAttachment>();
                    if (reply['src_logId']) {
                        logId = reply['src_logId'];
                    } else {
                        await ctx.channel.sendChat('채팅 정보를 가져오는데 실패했습니다');
                        return;
                    }
                }

                if (!logId) {
                    await ctx.channel.sendChat('답장 기능을 통해 채팅을 선택해주세요');
                    return;
                }

                let count;

                if (info.args.length > 0) {
                    count = Number.parseInt(info.args);
                }

                if (!count || isNaN(count)) count = 50;

                const iter = ctx.channel.chatListStore.before(logId, count);

                let text = `${ctx.channel.getDisplayName()} 챗 기록${LONG_CHAT_SPLITTER}\n\n`;
                let i = 0;
                for await (const chat of iter) {
                    const data = new TalkChatData(chat);
                    const info = data.getSenderInfo(ctx.channel);
                    const name = info ? info.nickname : '(알수없음)';

                    text += `(${i}) [${new Date(chat.sendAt).toLocaleString()}] (logId: ${chat.logId}) ${name} (senderId: ${chat.sender.userId}) (type: ${data.originalType}) ${data.isDeleted() ? '(deleted)' : ''}: ${chat.text}\n`;
                    if (chat.attachment && Object.keys(chat.attachment).length > 0) {
                        text += `attachment: ${util.JsonUtil.stringifyLoseless(chat.attachment)}\n`;
                    }
                    i++;
                }

                await ctx.channel.sendMedia(KnownChatType.TEXT, {
                    data: Buffer.from(text),
                    name: 'log.txt',
                    ext: 'txt'
                });
            }
        )
    )

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