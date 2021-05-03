/*
 * Created on Mon May 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BotModule, ModuleDescriptor, TalkContext } from "../../api/bot";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import * as ytdl from 'ytdl-core';
import { AttachmentApi, AudioAttachment, ChatBuilder, KnownChatType, ReplyContent, TalkChannel } from "node-kakao";
import { readableToBuffer } from "../../api/util";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'ytdl',
    name: 'ytdl',

    desc: 'Youtube 관련 유틸 제공'

}

export default async function moduleInit(mod: BotModule) {
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['ytaudio'],
            { usage: 'ytaudio (주소 또는 영상 id)', description: '' },
            ytAudioCommand
        )
    );
}

async function ytAudioCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();
    builder.append(new ReplyContent(ctx.data.chat));

    try {
        const vidInfo = await ytdl.getInfo(info.args);
        const readable = ytdl.downloadFromInfo(vidInfo, { quality: 'highestaudio' });
       
        const data = await readableToBuffer(readable);

        const res = await AttachmentApi.upload(KnownChatType.AUDIO, 'audio.m4a', data);

        if (!res.success) {
            ctx.channel.sendChat(
                builder
                .text(`업로드중 오류가 발생했습니다. status: ${res.status}`)
                .build(KnownChatType.REPLY)
            );
            return;
        }

        let duration = Number.parseInt(vidInfo.formats[0]?.approxDurationMs || '');
        if (isNaN(duration)) duration = 1;

        await ctx.channel.sendChat(
            builder
            .attachment(res.result)
            .attachment({ d: duration } as AudioAttachment)
            .build(KnownChatType.AUDIO)
        );
    } catch (err) {
        ctx.channel.sendChat(
            builder
            .text(`처리중 오류가 발생했습니다. err: ${err}`)
            .build(KnownChatType.REPLY)
        );
        return;
    }
}