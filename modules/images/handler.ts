/*
 * Created on Wed May 05 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatBuilder, Chatlog, KnownChatType, MediaUploadTemplate, MentionContent, ReplyAttachment, ReplyContent, stream, TalkChannel, TalkChatData } from "node-kakao";
import { TalkContext } from "../../api/bot";
import { CommandHelpMap, CommandInfo, CommandListener } from "../../api/command";
import { ImageContext, TalkImageContext } from "./context";
import jimp from "jimp";
import { LONG_CHAT_SPLITTER } from "../../api/util";
import { GifCodec, GifUtil } from "gifwrap";

export function createChatImageProcessor<C extends TalkChannel>(
    handler: (info: CommandInfo, ctx: TalkImageContext<C>) => void | Promise<void>
): (info: CommandInfo, ctx: TalkContext<C>) => Promise<void> {
    return async (info: CommandInfo, ctx: TalkContext<C>) => {
        let chat: Chatlog | undefined;
        if (ctx.data.originalType === KnownChatType.REPLY) {
            const attachment = ctx.data.attachment<ReplyAttachment>();
            const logId = attachment['src_logId'];
            if (logId) {
                chat = await ctx.channel.chatListStore.get(logId);
            }
        }

        if (!chat) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                    .append(new ReplyContent(ctx.data.chat))
                    .text('채팅을 선택해주세요')
                    .build(KnownChatType.REPLY)
            );
            return;
        }

        const selected = new TalkChatData(chat);

        if (selected.originalType !== KnownChatType.PHOTO && selected.originalType !== KnownChatType.MULTIPHOTO) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                    .append(new ReplyContent(ctx.data.chat))
                    .text('사진을 선택해주세요')
                    .build(KnownChatType.REPLY)
            );
            return;
        }

        const medias = selected.medias;
        const filtered = medias.filter((media) => media.size <= 52428800);
        if (medias.length - filtered.length > 0) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                    .append(new ReplyContent(ctx.data.chat))
                    .text(`용량이 큰 사진 ${medias.length - filtered.length}장을 건너뜁니다`)
                    .build(KnownChatType.REPLY)
            );
        }

        const senderInfo = ctx.data.getSenderInfo(ctx.channel);

        const res: MediaUploadTemplate[] = [];
        const errors: unknown[] = [];

        const startTime = Date.now();
        for (const media of filtered) {
            try {
                const streamRes = await ctx.channel.downloadMedia(media, KnownChatType.PHOTO);
                if (!streamRes.success) continue;

                const buffer = await stream.ReadStreamUtil.all(streamRes.result);
                const image = await jimp.read(Buffer.from(buffer));

                if (image.getMIME() == jimp.MIME_GIF) {
                    const codec = new GifCodec();
                    const gif = await codec.decodeGif(Buffer.from(buffer));

                    for (const frame of gif.frames) {
                        const jimpFrame = GifUtil.shareAsJimp(jimp, frame);

                        await handler(info, { image: jimpFrame, talkCtx: ctx });
                    }

                    const encoded = await codec.encodeGif(gif.frames, { loops: gif.loops, colorScope: gif.colorScope });

                    res.push({
                        name: 'result.gif',
                        ext: 'png',
                        data: encoded.buffer,
                        width: encoded.width,
                        height: encoded.height
                    });
                } else {
                    await handler(info, { image, talkCtx: ctx });
                    const data = await image.getBufferAsync('image/png');

                    res.push({
                        name: 'result.png',
                        ext: 'png',
                        data,
                        width: image.getWidth(),
                        height: image.getHeight()
                    });
                }
            } catch (err) {
                errors.push(err);
            }
        }

        if (errors.length > 0) {
            let text = `사진 ${errors.length} 장이 오류로 처리되지 못했습니다${LONG_CHAT_SPLITTER}\n`;

            for (let i = 0; i < errors.length; i++) {
                const err = errors[i];
                text += `\nerr#${i}: ${err}`;
            }

            await ctx.channel.sendMedia(KnownChatType.TEXT, {
                name: 'errors.txt',
                ext: 'txt',
                data: Buffer.from(text)
            });
        }

        if (res.length < 1) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                    .append(new ReplyContent(ctx.data.chat))
                    .text(`처리된 이미지가 없습니다`)
                    .build(KnownChatType.REPLY)
            );
        } else {
            if (res.length === 1) {
                await ctx.channel.sendMedia(KnownChatType.PHOTO, res[0]);
            } else {
                await ctx.channel.sendMultiMedia(KnownChatType.MULTIPHOTO, res);
            }

            const builder = new ChatBuilder();
            if (senderInfo) builder.append(new MentionContent(senderInfo)).text(' ');
            builder.text(`처리 완료. ${Date.now() - startTime} ms`);

            await ctx.channel.sendChat(builder.build(KnownChatType.TEXT));
        }
    }
}

export class ImageCmdListener implements CommandListener<ImageContext> {

    constructor(
        private _commands: string[],
        private _helpMap: CommandHelpMap,
        private _listener: (info: CommandInfo, ctx: ImageContext) => void | Promise<void>
    ) {

    }

    get helpMap(): CommandHelpMap {
        return this._helpMap;
    }

    async onCommand(info: CommandInfo, ctx: ImageContext): Promise<boolean> {
        if (info.namespace !== '' || !this._commands.find((command) => command === info.command)) return false;

        await this._listener(info, ctx);

        return true;
    }

}
