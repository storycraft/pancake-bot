/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChannelUserPerm } from "node-kakao";

export const ALL: number = OpenChannelUserPerm.NONE | OpenChannelUserPerm.MANAGER | OpenChannelUserPerm.OWNER | OpenChannelUserPerm.BOT;

export const MANAGERS: number = OpenChannelUserPerm.MANAGER | OpenChannelUserPerm.OWNER;
export const MANAGERS_BOT: number = MANAGERS | OpenChannelUserPerm.BOT;
