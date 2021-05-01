/*
 * Created on Sat May 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LowdbAsync } from 'lowdb';
import { BotModule, TalkContext } from '../../api/bot';
import { ChatCmdListener, CommandInfo } from '../../api/command';
import * as OpenChannelPerms from "../../api/open-channel-perms";
import { Expression } from 'jsep';
import { Channel, ChatBuilder, KnownChatType, OpenChannelUserPerm, ReplyContent, TalkOpenChannel } from 'node-kakao';
import { evalAsync, parse } from 'expression-eval';

export type FilterItem = {
    
    added: number,
    user: {
        id: string,
        nickname: string
    },
    expRaw: string,
    exp: Expression
}

export type FilterChannelEntry = {

    filters: FilterItem[];

};

export type FilterDBSchema = {

    [channelId: string]: FilterChannelEntry;

};

export class ChatFilterManager {
    
    constructor(
        private _mod: BotModule,
        private _db: LowdbAsync<FilterDBSchema>
    ) {
        const openCommandHandler = _mod.commandHandler.open;

        openCommandHandler.addListener(
            new ChatCmdListener(
                ['filter-add'],
                { usage: 'filter-add (채팅 판별식)', description: '주어진 식에 일치하는 채팅을 가립니다', executeLevel: OpenChannelPerms.MANAGERS },
                (info, ctx) => this._onAddCommand(info, ctx)
            )
        );

        openCommandHandler.addListener(
            new ChatCmdListener(
                ['filter-list'],
                { usage: 'filter-list', description: '채팅 필터 목록을 가져옵니다', executeLevel: OpenChannelPerms.MANAGERS },
                (info, ctx) => this._onListCommand(info, ctx)
            )
        );

        openCommandHandler.addListener(
            new ChatCmdListener(
                ['filter-del'],
                { usage: 'filter-del (index)', description: '해당 index에 있는 필터를 지웁니다', executeLevel: OpenChannelPerms.MANAGERS },
                (info, ctx) => this._onDelCommand(info, ctx)
            )
        );

        _mod.on('open_chat', (ctx) => this._onChat(ctx));
    }

    async getChannelFilter(channel: Channel) {
        const channelId = channel.channelId.toString();
        
        if (!this._db.has(channelId).value()) {
            await this._db.set(channelId, { filters: [] }).write();
        }

        return this._db.get(channelId).get('filters');
    }

    private async _onAddCommand(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
        const filters = await this.getChannelFilter(ctx.channel);
        const builder = new ChatBuilder();

        builder.append(new ReplyContent(ctx.data.chat));

        if (info.args.length < 1) {
            builder.text('채팅 판별식이 필요합니다');
        } else {
            try {
                const tree = parse(info.args);
                const userInfo = ctx.data.getSenderInfo(ctx.channel);
                const item: FilterItem = {
                    added: Date.now(),
                    user: {
                        id: ctx.data.chat.sender.userId.toString(),
                        nickname: userInfo ? userInfo.nickname : '(알수없음)'
                    },
                    expRaw: info.args,
                    exp: tree
                };

                await filters.push(item).write();
                builder.text('챗 필터가 추가되었습니다');
            } catch (err) {
                builder.text(`식 추가중 오류가 발생했습니다. err: ${err}`);
            }
        }

        await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
    }

    private async _onListCommand(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
        const filters = await this.getChannelFilter(ctx.channel);

        let text = `${ctx.channel.getDisplayName()} 의 필터 목록\n\n`;
        let i = 0;
        for (const filter of filters.value()) {
            text += `(${i}) [${new Date(filter.added).toLocaleString()}] ${filter.user.nickname} 이(가) 추가\n${filter.expRaw}\n\n`;
            i++;
        }

        await ctx.channel.sendMedia(KnownChatType.TEXT, { data: Buffer.from(text), ext: 'txt', name: 'text.txt' });
    }

    private async _onDelCommand(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
        const filters = await this.getChannelFilter(ctx.channel);
        const builder = new ChatBuilder();

        builder.append(new ReplyContent(ctx.data.chat));
        try {
            const index = Number.parseInt(info.args);
            if (isNaN(index)) throw new Error('올바르지 않은 index 값');
            if (filters.size().value() <= index) throw new Error('index 범위 초과');

            const removed = (await filters.splice(index, 1).write())[0];
            builder.text(`식 ${removed.expRaw} 이(가) 제거되었습니다`);
        } catch (err) {
            builder.text(`처리중 오류가 발생했습니다. err: ${err}`);
        }

        await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
    }

    private async _onChat(ctx: TalkContext<TalkOpenChannel>) {
        const filters = await this.getChannelFilter(ctx.channel);

        const botInfo = ctx.channel.getUserInfo(ctx.bot.client.clientUser);
        if (!botInfo || botInfo.perm !== OpenChannelUserPerm.MANAGER && botInfo.perm !== OpenChannelUserPerm.OWNER) return;

        try {
            const res = await Promise.all(filters.value().map(filter => evalAsync(filter.exp, ctx.data.chat)));
            if (res.filter(result => !!result).length > 0) {
                await ctx.channel.hideChat(ctx.data.chat);
            }
        } catch (err) {
            this._mod.logger.error(`채널 ${ctx.channel.channelId} 에서 필터 실행중 오류 발생. err: ${err}`);
        }
        
    }

}
