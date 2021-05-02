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
import { SudoManager } from "./manager";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'sudo',
    name: 'sudo',

    desc: 'Extended user privilege elevation system'

}

export default async function moduleInit(mod: BotModule) {
    const sudoersDBPath = path.join(mod.dataDir, 'sudoers.json');
    await ensureFile(sudoersDBPath);

    mod.logger.info('sudoers 불러오는 중...');
    const sudoersDB = await low(new FileAsync(sudoersDBPath, { defaultValue: {} }));
    mod.logger.info('sudoers 로드 완료');

    new SudoManager(mod, sudoersDB);
}
