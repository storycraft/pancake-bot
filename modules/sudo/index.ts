/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BotModule, ModuleDescriptor } from "../../api/bot";
import * as path from 'path';
import low from 'lowdb';
import { ensureFile } from "fs-extra";
import FileAsync from "lowdb/adapters/FileAsync";
import { ExecuteManager } from "./manager";
import { OpenChannelUserPerm } from "node-kakao";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'sudo',
    name: 'sudo',

    desc: 'Extended user privilege elevation system'

}

export default async function moduleInit(mod: BotModule) {
    const sudoersDBPath = path.join(mod.dataDir, 'sudoers.json');
    const adminDBPath = path.join(mod.dataDir, 'admins.json');
    await ensureFile(adminDBPath);
    await ensureFile(sudoersDBPath);

    mod.logger.info('admin db 불러오는 중...');
    const adminDB = await low(new FileAsync(adminDBPath, { defaultValue: {} }));
    mod.logger.info('admin db 로드 완료');

    mod.logger.info('sudoers 불러오는 중...');
    const sudoersDB = await low(new FileAsync(sudoersDBPath, { defaultValue: {} }));
    mod.logger.info('sudoers 로드 완료');

    new ExecuteManager(mod, 'sudoers', 'sudoer', 'sudo', OpenChannelUserPerm.OWNER, sudoersDB);
    new ExecuteManager(mod, 'admins', 'admin', 'mod', OpenChannelUserPerm.MANAGER, adminDB);
}
