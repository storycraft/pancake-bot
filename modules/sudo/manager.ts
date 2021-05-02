/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LowdbAsync } from "lowdb";
import { Channel, ChatBuilder, KnownChatType, OpenChannelUserPerm, ReplyContent, TalkChannel, TalkOpenChannel } from "node-kakao";
import { BotModule, TalkContext } from "../../api/bot";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import * as OpenChannelPerms from "../../api/open-channel-perms";
import { getSelectedUsers } from "../../api/util/chat";

export type SudoerItem = {
    nickname: string;
    added: number;
};

export type SudoDBScheme = {
    [channelId: string]: { [strId: string]: SudoerItem };
};

export class SudoManager {

    constructor(
        private _mod: BotModule,
        private _db: LowdbAsync<SudoDBScheme>
    ) {
        const commandHandler = _mod.commandHandler;

        commandHandler.open.addListener(
            new ChatCmdListener(
                ['sudoers-add'],
                { usage: 'sudoers-add [유저1]...', description: '선택된 유저들을 sudoer 목록에 추가합니다', executeLevel: OpenChannelUserPerm.OWNER },
                (info, ctx) => this._onAddCommand(info, ctx)
            )
        );

        commandHandler.open.addListener(
            new ChatCmdListener(
                ['sudoers-list'],
                { usage: 'sudoers-list', description: 'sudoer 목록을 가져옵니다', executeLevel: OpenChannelUserPerm.OWNER },
                (info, ctx) => this._onListCommand(info, ctx)
            )
        );

        commandHandler.open.addListener(
            new ChatCmdListener(
                ['sudoers-del'],
                { usage: 'sudoers-del [유저1]...', description: '해당 유저를 sudoer에서 지웁니다', executeLevel: OpenChannelUserPerm.OWNER },
                (info, ctx) => this._onDelCommand(info, ctx)
            )
        );

        commandHandler.open.addListener(
            new ChatCmdListener(
                ['sudo'],
                { usage: 'sudo (명령어)', description: '상승된 권한으로 명령어 실행', executeLevel: OpenChannelPerms.ALL },
                (info, ctx) => this._onSudoCommand(info, ctx)
            )
        );
    }

    async getChannelUserList(channel: Channel) {
        const channelId = channel.channelId.toString();
        
        if (!this._db.has(channelId).value()) {
            await this._db.set(channelId, {}).write();
        }

        return this._db.get(channelId);
    }

    private async _onAddCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
        const list = await this.getChannelUserList(ctx.channel);
        const builder = new ChatBuilder();

        builder.append(new ReplyContent(ctx.data.chat));

        const selected = getSelectedUsers(ctx.data);
        let added = 0;
        let chain = list;
        for (const user of selected) {
            const strId = user.userId.toString();
            if (list.has(strId).value()) continue;

            const info = ctx.channel.getUserInfo(user);
            const nickname = info ? info.nickname : '(알수없음)';

            chain = chain.set(strId, { nickname, added: Date.now() });
            added++;
        }

        await chain.write();
        builder.text(`sudoers 목록에 ${added} 명을 새로 추가했습니다`);
        await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
    }

    private async _onListCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
        const list = await this.getChannelUserList(ctx.channel);

        let text = `${ctx.channel.getDisplayName()} 의 suoder 목록${'\u200b'.repeat(500)}\n\n`;
        for (const [ strId, item ] of list.entries().value()) {
            text += `${strId} (${item.nickname}) ${new Date(item.added).toLocaleString()} 에 추가됨\n`;
        }

        await ctx.channel.sendMedia(KnownChatType.TEXT, { data: Buffer.from(text), ext: 'txt', name: 'list.txt' });
    }

    private async _onDelCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
        const list = await this.getChannelUserList(ctx.channel);
        const builder = new ChatBuilder();

        builder.append(new ReplyContent(ctx.data.chat));

        const selected = getSelectedUsers(ctx.data);

        let deleted = 0;
        for (const user of selected) {
            const strId = user.userId.toString();
            if (!list.has(strId).value()) continue;

            await list.unset(strId).write();
            deleted++;
        }

        builder.text(`sudoers 목록에서 ${deleted} 명을 제거했습니다`);
        await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
    }

    private async _onSudoCommand(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
        const list = await this.getChannelUserList(ctx.channel);
        const command = info.args;
        if (command.length < 1) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                .append(new ReplyContent(ctx.data.chat))
                .text('실행할 명령어가 없습니다')
                .build(KnownChatType.REPLY)
            );
            return;
        }

        const commandInfo = ctx.bot.chatParser.parse(command);
        if (!commandInfo) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                .append(new ReplyContent(ctx.data.chat))
                .text('잘못된 명령어입니다')
                .build(KnownChatType.REPLY)
            );
            return;
        }

        const sender = ctx.data.chat.sender;
        if (!list.has(sender.userId.toString()).value()) {
            const info = ctx.channel.getUserInfo(sender);
            const nickname = info ? info.nickname : '(알수없음)';
            await ctx.channel.sendChat(
                new ChatBuilder()
                .append(new ReplyContent(ctx.data.chat))
                .text(`${nickname} 은(는) sudoers 설정 파일에 없습니다. 이 시도를 보고합니다.`)
                .build(KnownChatType.REPLY)
            );
            return;
        }

        const sudoCtx = { ...ctx, userLevel: OpenChannelUserPerm.OWNER };

        let res = await ctx.bot.dispatchOpenCommand(commandInfo, sudoCtx);
        if (!res) res = await ctx.bot.dispatchAnyCommand(commandInfo, sudoCtx);

        if (!res) {
            await ctx.channel.sendChat(
                new ChatBuilder()
                .append(new ReplyContent(ctx.data.chat))
                .text('명령어를 찾지 못했습니다')
                .build(KnownChatType.REPLY)
            );
            return;
        }
    }
}
