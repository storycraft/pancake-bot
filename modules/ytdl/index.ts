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
            ['ytplay'],
            { usage: 'ytplay (주소 또는 영상 id)', description: '유튜브 영상 오디오 재생하기' },
            ytPlayCommand
        )
    );
}

async function ytPlayCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();
    builder.append(new ReplyContent(ctx.data.chat));

    try {
        const vidInfo = await ytdl.getInfo(info.args);
        const readable = ytdl.downloadFromInfo(vidInfo, { quality: 'highestaudio' });

        let duration = Number.parseInt(vidInfo.videoDetails.lengthSeconds || '') * 1000;
        if (isNaN(duration)) duration = 1;

        if (duration > 600000) {
            ctx.channel.sendChat(
                builder
                .text('10분 이상 영상은 사용 할 수 없습니다')
                .build(KnownChatType.REPLY)
            );
            return;
        }

        const data = await readableToBuffer(readable);

        const res = await AttachmentApi.upload(KnownChatType.FILE, 'audio.mp3', data);

        if (!res.success) {
            ctx.channel.sendChat(
                builder
                .text(`업로드중 오류가 발생했습니다. status: ${res.status}`)
                .build(KnownChatType.REPLY)
            );
            return;
        }

        await ctx.channel.sendChat(
            builder
            .text(`${vidInfo.videoDetails.title} by ${vidInfo.videoDetails.author.name}`)
            .build(KnownChatType.REPLY)
        );
        await ctx.channel.sendChat(
            new ChatBuilder()
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
