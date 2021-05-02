/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelUser, KnownChatType, Long, ReplyAttachment, TalkChatData } from "node-kakao";

/**
 * 선택된(맨션, 답장) 유저 목록 반환
 *
 * @param {TalkChatData} data
 */
export function getSelectedUsers(data: TalkChatData): ChannelUser[] {
    const targets: ChannelUser[] = [];

    for (const mention of data.mentions) {
        targets.push({ userId: Long.fromValue(mention.user_id) });
    }

    if (data.originalType === KnownChatType.REPLY) {
        const reply = data.attachment<ReplyAttachment>();
        if (reply['src_userId']) {
            targets.push({ userId: reply['src_userId'] });
        }
    }

    return targets;
}
