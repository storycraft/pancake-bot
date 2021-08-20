/*
 * Created on Fri Aug 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AttachmentApi, AudioAttachment, ChatBuilder, KnownChatType, ReplyAttachment, ReplyContent, TalkChannel } from "node-kakao";
import { BotModule, ModuleDescriptor } from "../api/bot/module";
import { ChatCmdListener, CommandInfo, CommandListener } from "../api/command";
import * as googleTTS from "google-tts-api";
import { TalkContext } from "../api/bot";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'tts',
    name: 'tts',

    desc: '챗 tts'

}

export default function moduleInit(mod: BotModule) {
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts'],
            { usage: 'tts [텍스트]', description: 'tts (영어 en-US)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'en-US')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-ko'],
            { usage: 'tts-ko [텍스트]', description: 'tts (한국어 ko-KR)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'ko-KR')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-ja'],
            { usage: 'tts-ja [텍스트]', description: 'tts (일본어 ja-JP)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'ja')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-zh'],
            { usage: 'tts-zh [텍스트]', description: 'tts (중국어 zh-TW)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'zh-TW')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-nl'],
            { usage: 'tts-nl [텍스트]', description: 'tts (네덜란드어 nl-NL)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'nl-NL')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-es'],
            { usage: 'tts-es [텍스트]', description: 'tts (스페인어 es-ES)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'es-ES')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-de'],
            { usage: 'tts-de [텍스트]', description: 'tts (독일어 de-DE)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'de-DE')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-fr'],
            { usage: 'tts-fr [텍스트]', description: 'tts (프랑스어 fr-FR)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'fr-FR')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-hi'],
            { usage: 'tts-hi [텍스트]', description: 'tts (힌디어 hi-IN)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'hi-IN')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-it'],
            { usage: 'tts-it [텍스트]', description: 'tts (이탈리아어 it-IT)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'it-IT')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-pl'],
            { usage: 'tts-pl [텍스트]', description: 'tts (폴란드어 pl-PL)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'pl-PL')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-ru'],
            { usage: 'tts-ru [텍스트]', description: 'tts (러시아어 ru-RU)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'ru-RU')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-vi'],
            { usage: 'tts-vi [텍스트]', description: 'tts (베트남어 vi-VN)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'vi-VN')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-zu'],
            { usage: 'tts-zu [텍스트]', description: 'tts (줄루어 zu-ZA)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'zu-ZA')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-no'],
            { usage: 'tts-no [텍스트]', description: 'tts (노르웨이어 no-NO)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'no-NO')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-mn'],
            { usage: 'tts-mn [텍스트]', description: 'tts (몽골어 mn-MN)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'mn-MN')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-ne'],
            { usage: 'tts-ne [텍스트]', description: 'tts (네팔어 ne-NP)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'ne-NP')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-pt'],
            { usage: 'tts-pt [텍스트]', description: 'tts (포르투갈어 pt-PT)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'pt-PT')
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['tts-sv'],
            { usage: 'tts-sv [텍스트]', description: 'tts (스웨덴어 sv-SE)' },
            (info, ctx) => handleTTSCommand(info, ctx, 'sv-SE')
        )
    );
}

async function handleTTSCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>, lang: string) {
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

    const data = Buffer.from(await googleTTS.getAudioBase64(text, { lang }), 'base64');
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
