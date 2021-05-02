/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelUser, ChatBuilder, KnownChatType, Long, OpenChannelUserPerm, ReplyAttachment, TalkOpenChannel } from "node-kakao";
import { BotModule, ModuleDescriptor, TalkContext } from "../api/bot";
import { ChatCmdListener, CommandInfo } from "../api/command";
import * as OpenChannelPerms from "../api/open-channel-perms";
import { getSelectedUsers } from "../api/util/chat";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'open-channel-manager',
    name: 'open channel manager',

    desc: '오픈 채팅방 관리 모듈'

}

export default function moduleInit(mod: BotModule) {
    mod.commandHandler.open.addListener(
        new ChatCmdListener(
            ['softkick'],
            { usage: 'softkick [유저]...', description: '내보내고 해제하기', executeLevel: OpenChannelPerms.MANAGERS },
            softKickCommand
        )
    );
}

async function softKickCommand(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
    const builder = new ChatBuilder();

    const botInfo = ctx.channel.getUserInfo(ctx.bot.client.clientUser);
    if (!botInfo || botInfo.perm !== OpenChannelUserPerm.MANAGER && botInfo.perm !== OpenChannelUserPerm.OWNER) {
        builder.text(`봇에 명령어를 실행할 권한이 없습니다`);
    } else {
        const targets = getSelectedUsers(ctx.data);

        if (targets.length < 1) {
            builder.text(`선택된 유저가 없습니다`);
        } else {
            let counter = 0;
            for (const user of targets) {
                const kickRes = await ctx.channel.kickUser(user);
                if (kickRes.success) {
                    await ctx.channel.removeKicked(user);
                    counter++;
                }
            }
    
            builder.text(`${counter} 명을 소프트킥 했습니다`);
        }
    }

    await ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
}
