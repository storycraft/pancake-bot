/*
 * Created on Thu Apr 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChannelUserPerm, TalkChatData } from "node-kakao";
import { Bot } from ".";

export interface Context {
    readonly bot: Bot;
}

export interface TalkContext<C> extends Context {

    readonly data: TalkChatData;
    readonly userLevel: OpenChannelUserPerm;
    readonly channel: C;

}

export interface ConsoleContext extends Context {

    

}
