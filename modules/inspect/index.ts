/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
*/

import { ChatBuilder, KnownChatType, KnownLinkPrivilegeMask, Long, ReplyAttachment, ReplyContent, TalkChannel, TalkNormalChannel, TalkOpenChannel } from "node-kakao";
import { BotModule, ModuleDescriptor, TalkContext } from "../../api/bot";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import * as OpenChannelPerms from "../../api/open-channel-perms";
import { getSelectedUsers } from "../../api/util/chat";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'inspect',
    name: 'inspect',

    desc: '챗, 채널, 유저 검사기'

}

export default function moduleInit(mod: BotModule) {
    mod.commandHandler.open.addListener(
        new ChatCmdListener(
            ['inspect-channel'],
            { usage: 'inspect-channel', description: '채팅방 정보를 확인합니다' },
            openChannelInspect
        )
    );

    mod.commandHandler.normal.addListener(
        new ChatCmdListener(
            ['inspect-channel'],
            { usage: 'inspect-channel', description: '채팅방 정보를 확인합니다' },
            normalChannelInspect
        )
    );

    mod.commandHandler.open.addListener(
        new ChatCmdListener(
            ['inspect-user'],
            { usage: 'inspect-user', description: '유저 정보를 확인합니다' },
            openChannelUserInspect
        )
    );

    mod.commandHandler.normal.addListener(
        new ChatCmdListener(
            ['inspect-user'],
            { usage: 'inspect-user', description: '유저 정보를 확인합니다' },
            normalChannelUserInspect
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['inspect-chat'],
            { usage: 'inspect-chat', description: '채팅 정보를 확인합니다', executeLevel: OpenChannelPerms.MANAGERS },
            chatInspect
        )
    );
}

async function normalChannelInspect(info: CommandInfo, ctx: TalkContext<TalkNormalChannel>) {
    const channel = ctx.channel;

    const privilegeMeta = channel.info.metaMap[6];
    const privilegeContent = privilegeMeta && JSON.parse(privilegeMeta.content);
    const noticeLocked = privilegeContent && privilegeContent['pin_notice'] || false;
    const channelInfo = channel.info;

    const text = `${channel.getDisplayName()} 채널 정보\n\n` +
    `channelId: ${channel.channelId}\n` + 
    `displayName: ${channel.getDisplayName()}\n` + 
    `name: ${channel.getName()}\n` + 
    `userCount: ${channel.userCount}\n` +
    `type: ${channelInfo.type}\n` +
    `noticeLocked: ${noticeLocked}\n`;

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(text),
        name: 'info.txt',
        ext: 'txt'
    });
}

async function normalChannelUserInspect(info: CommandInfo, ctx: TalkContext<TalkNormalChannel>) {
    const selected = getSelectedUsers(ctx.data)[0];
    const userInfo = selected ? ctx.channel.getUserInfo(selected) : ctx.channel.getUserInfo(ctx.data.chat.sender);
    if (!userInfo) {
        await ctx.channel.sendChat(
            new ChatBuilder()
            .append(new ReplyContent(ctx.data.chat))
            .text('유저 정보를 가져오지 못했습니다')
            .build(KnownChatType.REPLY)
        );
        return;
    }

    const text = `${userInfo.nickname} 유저 정보\n\n` +
                `userId: ${userInfo.userId}\n` + 
                `nickname: ${userInfo.nickname}\n` + 
                `profileURL: ${userInfo.profileURL}\n` + 
                `fullProfileURL: ${userInfo.fullProfileURL}\n` + 
                `originalProfileURL: ${userInfo.originalProfileURL}\n` +
                `countryIso: ${userInfo.countryIso}\n` + 
                `accountId: ${userInfo.accountId}\n` + 
                `linkedServices: ${userInfo.linkedServices}\n` + 
                `statusMessage: ${userInfo.statusMessage}\n` + 
                `suspended: ${userInfo.suspended}`;

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(text),
        name: 'info.txt',
        ext: 'txt'
    });
}

async function openChannelInspect(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
    const channel = ctx.channel;

    const privilegeMeta = channel.info.metaMap[6];
    const privilegeContent = privilegeMeta && JSON.parse(privilegeMeta.content);
    const noticeLocked = privilegeContent && privilegeContent['pin_notice'] || false;
    const channelInfo = channel.info;
    const openLink = channelInfo.openLink;
    const pv = Long.fromValue(openLink?.privilege || 0);

    const text = `${channel.getDisplayName()} 채널 정보\n\n` +
    `channelId: ${channel.channelId}\n` + 
    `displayName: ${channel.getDisplayName()}\n` + 
    `name: ${channel.getName()}\n` + 
    `userCount: ${channel.userCount}\n` +
    `type: ${channelInfo.type}\n` +
    `noticeLocked: ${noticeLocked}\n` +
    `linkId: ${openLink?.linkId}\n` + 
    `openToken: ${openLink?.openToken}\n` + 
    `linkURL: ${openLink?.linkURL}\n` + 
    `linkCoverURL: ${openLink?.linkCoverURL}\n` + 
    `linkCreated: ${openLink?.createdAt}\n` + 
    `linkSearchable: ${openLink?.searchable}\n` + 
    `linkTagList: ${openLink?.profileTagList}\n` + 
    `linkOwnerId: ${openLink?.linkOwner.linkId}\n` + 
    `linkOwnerNickname: ${openLink?.linkOwner.nickname}\n` + 
    `linkOwnerProfileURL: ${openLink?.linkOwner.profileURL}\n` + 
    `linkOwnerFullProfileURL: ${openLink?.linkOwner.fullProfileURL}\n` + 
    `linkOwnerOriginalProfileURL: ${openLink?.linkOwner.originalProfileURL}\n` + 
    `linkPrivilege USE_BOT: ${!pv.and(KnownLinkPrivilegeMask.USE_BOT).isZero()}\n` + 
    `linkPrivilege URL_SHARABLE: ${!pv.and(KnownLinkPrivilegeMask.URL_SHARABLE).isZero()}\n` + 
    `linkPrivilege NON_SPECIAL_LINK: ${!pv.and(KnownLinkPrivilegeMask.NON_SPECIAL_LINK).isZero()}\n` + 
    `linkPrivilege USE_PASS_CODE: ${!pv.and(KnownLinkPrivilegeMask.USE_PASS_CODE).isZero()}\n` + 
    `linkPrivilege REPORTABLE: ${!pv.and(KnownLinkPrivilegeMask.REPORTABLE).isZero()}\n` + 
    `linkPrivilege BLINDABLE: ${!pv.and(KnownLinkPrivilegeMask.BLINDABLE).isZero()}\n` + 
    `linkPrivilege ANY_PROFILE_ALLOWED: ${!pv.and(KnownLinkPrivilegeMask.ANY_PROFILE_ALLOWED).isZero()}\n` + 
    `linkPrivilege PROFILE_EDITABLE: ${!pv.and(KnownLinkPrivilegeMask.PROFILE_EDITABLE).isZero()}`;

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(text),
        name: 'info.txt',
        ext: 'txt'
    });
}

async function openChannelUserInspect(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
    const selected = getSelectedUsers(ctx.data)[0];
    const userInfo = selected ? ctx.channel.getUserInfo(selected) : ctx.channel.getUserInfo(ctx.data.chat.sender);
    if (!userInfo) {
        await ctx.channel.sendChat(
            new ChatBuilder()
            .append(new ReplyContent(ctx.data.chat))
            .text('유저 정보를 가져오지 못했습니다')
            .build(KnownChatType.REPLY)
        );
        return;
    }

    const text = `${userInfo.nickname} 유저 정보\n\n` +
                `userId: ${userInfo.userId}\n` + 
                `nickname: ${userInfo.nickname}\n` + 
                `profileURL: ${userInfo.profileURL}\n` + 
                `fullProfileURL: ${userInfo.fullProfileURL}\n` + 
                `originalProfileURL: ${userInfo.originalProfileURL}\n` +
                `openToken: ${userInfo.openToken}\n` + 
                `perm: ${userInfo.perm}\n` + 
                `userType: ${userInfo.userType}\n` + 
                `linkId: ${userInfo.linkId}`;

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(text),
        name: 'info.txt',
        ext: 'txt'
    });
}

async function chatInspect(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    let logId;
    if (ctx.data.originalType === KnownChatType.REPLY) {
        const reply = ctx.data.attachment<ReplyAttachment>();
        if (reply['src_logId']) {
            logId = reply['src_logId'];
        } else {
            await ctx.channel.sendChat('선택된 채팅에 일부 정보가 없습니다');
            return;
        }
    }

    if (!logId) {
        await ctx.channel.sendChat(
            new ChatBuilder()
            .append(new ReplyContent(ctx.data.chat))
            .text('답장 기능을 통해 채팅을 선택해주세요')
            .build(KnownChatType.REPLY)
        );
        return;
    }

    const chat = await ctx.channel.chatListStore.get(logId);
    if (!chat) {
        await ctx.channel.sendChat(
            new ChatBuilder()
            .append(new ReplyContent(ctx.data.chat))
            .text('채팅을 찾지 못했습니다')
            .build(KnownChatType.REPLY)
        );
        return;
    }

    const text = `${chat.logId} 채팅 정보\n\n` +
                `logId: ${chat.logId}\n` + 
                `prevLogId: ${chat.prevLogId}\n` +
                `sendAt: ${chat.sendAt}\n` + 
                `type: ${chat.type}\n` + 
                `text: ${chat.text}\n` + 
                `sender.userId: ${chat.sender.userId}\n` +
                `attachment: ${chat.attachment}\n` + 
                `supplement: ${chat.supplement}\n` + 
                `messageId: ${chat.messageId}`;

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(text),
        name: 'info.txt',
        ext: 'txt'
    });
}
