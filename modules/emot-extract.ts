/*
 * Created on Sun Aug 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatBuilder, EmoticonAttachment, KnownChatType, ReplyAttachment, ReplyContent } from "node-kakao";
import fetch from "node-fetch";
import { BotModule, ModuleDescriptor } from "../api/bot";
import { ChatCmdListener } from "../api/command";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'emot-extract',
    name: 'emot-extract',

    desc: '이모티콘 추출기'

}

export default async function moduleInit(mod: BotModule, options: { decryptKey: Uint8Array }) {
    const decryptKey = options.decryptKey;

    if (!decryptKey) {
        mod.logger.warn('복호화 키가 제공되지 않았습니다. webp, gif 이모티콘 추출이 제한됩니다.');
    }

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['emot'],
            { usage: 'emot', description: '선택된 채팅의 이모티콘 추출' },
            async (info, ctx) => {
                if (ctx.data.originalType !== KnownChatType.REPLY) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('이모티콘 채팅을 선택해 주세요')
                        .build(KnownChatType.REPLY)
                    );
                    return;
                }

                const attachment = ctx.data.attachment<ReplyAttachment>();
                if (
                    attachment.src_type !== KnownChatType.STICKER
                    && attachment.src_type !== KnownChatType.STICKERANI
                    && attachment.src_type !== KnownChatType.STICKER
                ) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('선택된 채팅은 이모티콘 채팅이 아닙니다')
                        .build(KnownChatType.REPLY)
                    );
                    return;
                }

                if (!attachment.src_logId) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('선택된 채팅을 찾지 못했습니다')
                        .build(KnownChatType.REPLY)
                    );

                    return;
                }

                const chat = await ctx.channel.chatListStore.get(attachment.src_logId);

                if (!chat) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('선택된 채팅을 불러오지 못했습니다')
                        .build(KnownChatType.REPLY)
                    );

                    return;
                }

                const animated = chat.type === KnownChatType.STICKERANI || chat.type === KnownChatType.STICKERGIF;

                if (!decryptKey && animated) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('애니메이션 이모티콘은 불러올 수 없습니다')
                        .build(KnownChatType.REPLY)
                    );

                    return;
                }

                const targetAttachment = chat.attachment as EmoticonAttachment | undefined;

                if (!targetAttachment || !targetAttachment.path) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('선택된 채팅이 올바르지 않습니다')
                        .build(KnownChatType.REPLY)
                    );

                    return;
                }

                const width = targetAttachment.width || 360;
                const height = targetAttachment.height || 360;
                const path = targetAttachment.path;

                const url = `http://item-kr.talk.kakao.co.kr/dw/${path}`;

                try {
                    const res = await fetch(url);
                    const data = new Uint8Array(await res.arrayBuffer());

                    if (animated) {
                        for (let i = 0; i < decryptKey.length; i++) {
                            const byte = decryptKey[i];
                            data[i] ^= byte;
                        }
                    }

                    await ctx.channel.sendMedia(KnownChatType.PHOTO, {
                        name: 'photo.png',
                        width,
                        height,
                        data,
                    });
                } catch (e) {
                    ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text(`불러오는 중 오류가 발생했습니다. error: ${e}`)
                        .build(KnownChatType.REPLY)
                    );
                }
            }
        )
    );
}
