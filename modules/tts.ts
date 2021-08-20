/*
 * Created on Fri Aug 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AttachmentApi, AudioAttachment, ChatBuilder, KnownChatType, ReplyAttachment, ReplyContent } from "node-kakao";
import { BotModule, ModuleDescriptor } from "../api/bot/module";
import { ChatCmdListener } from "../api/command";
import * as googleTTS from "google-tts-api";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'tts',
    name: 'tts',

    desc: '챗 tts'

}

export default function moduleInit(mod: BotModule) {
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts'],
            { usage: 'tts [텍스트]', description: 'tts' },
            async (info, ctx) => {
                let text: string;
                if (ctx.data.originalType === KnownChatType.REPLY) {
                    const reply = ctx.data.attachment<ReplyAttachment>();

                    if (!reply.src_message) {
                        await ctx.channel.sendChat(
                            new ChatBuilder()
                            .append(new ReplyContent(ctx.data.chat))
                            .text('해당 채팅을 가져오지 못했습니다')
                            .build(KnownChatType.REPLY)
                        );
                        return;
                    }

                    text = reply.src_message;
                } else if (info.args.length > 0) {
                    text = info.args;
                } else {
                    await ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('채팅을 선택하거나 텍스트를 입력해주세요')
                        .build(KnownChatType.REPLY)
                    );
                    return;
                }

                if (text.length > 200) {
                    await ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('텍스트가 너무 깁니다 (length > 200)')
                        .build(KnownChatType.REPLY)
                    );
                    return;
                }

                const data = Buffer.from(await googleTTS.getAudioBase64(text), 'base64');
                const res = await AttachmentApi.upload(KnownChatType.FILE, 'audio.mp3', data);

                if (!res.success) {
                    await ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text(`업로드중 오류가 발생했습니다. status: ${res.status}`)
                        .build(KnownChatType.REPLY)
                    );
                    return;
                }

                await ctx.channel.sendChat(
                    new ChatBuilder()
                    .attachment(res.result)
                    .attachment({ d: 10 } as AudioAttachment)
                    .build(KnownChatType.AUDIO)
                );
            }
        )
    );
}
