/*
 * Created on Tue May 04 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatBuilder, KnownChatType, ReplyContent, TalkChannel } from "node-kakao";
import { BotModule, TalkContext } from "../../api/bot";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import { nodeHashHex } from "./util";

export function addNodeHashCmd(mod: BotModule, method: string) {
    addHashCmd(mod, method, (input) => nodeHashHex(method, input));
}

export function addHashCmd(
    mod: BotModule,
    method: string,
    calculator: (input: string) => string | Promise<string>
) {
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            [method],
            { usage: `${method} (문자열)`, description: `주어진 문자열의 ${method} 을 계산합니다` },
            async (info, ctx) => {
                const builder = new ChatBuilder();
        
                builder.append(new ReplyContent(ctx.data.chat));
        
                if (info.args.length < 1) {
                    builder.text('문자열을 입력해주세요');
                } else {
                    try {
                        const res = await calculator(info.args);
                        builder.text(res);
                    } catch (err) {
                        builder.text(`해시 계산중 오류가 발생했습니다. err: ${err}`);
                    }
                }
        
                await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
            }
        )
    );
}

export function addEncodingCmd(
    mod: BotModule,
    method: string,
    encode: boolean,
    calculator: (input: string) => string | Promise<string>
) {
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            [`${method}-${encode ? 'en' : 'de'}`],
            { usage: `${method} (문자열)`, description: `주어진 문자열을 ${method} 로 ${encode ? '인코딩' : '디코딩'}합니다` },
            async (info, ctx) => {
                const builder = new ChatBuilder();
        
                builder.append(new ReplyContent(ctx.data.chat));
        
                if (info.args.length < 1) {
                    builder.text('문자열을 입력해주세요');
                } else {
                    try {
                        const res = await calculator(info.args);
                        builder.text(res);
                    } catch (err) {
                        builder.text(`변환중 오류가 발생했습니다. err: ${err}`);
                    }
                }
        
                await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
            }
        )
    );
}
