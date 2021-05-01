/*
 * Created on Wed Apr 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Bot } from ".";
import { BotModule, ModuleDescriptor } from "./module";

export class BotModuleLoader {

    constructor(private _bot: Bot, private _moduleDir: string) {

    }

    /**
     * 해당 이름의 모듈 로드
     * @param {string} name
     * @param {Record<string, unknown>} options
     * @return {Promise<ModuleLoadResult>}
     */
    async load(name: string, options: Record<string, unknown> = {}): Promise<BotModule> {
        const dir = `../../${this._moduleDir}/${name}`;

        const loaded = await import(dir);

        if (
            !loaded.default ||
            typeof loaded.default !== 'function' ||
            !loaded.MODULE_DESC
        ) {
            throw new Error('Invalid module');
        }

        const desc = loaded.MODULE_DESC as ModuleDescriptor;

        const module = this._bot.createModule(desc);

        if (!module) throw new Error(`Module id conflicted id: ${desc.id}`);

        try {
            await loaded.default(module, options);
        } catch (err) {
            this._bot.unloadModule(module.id);
            throw err;
        }

        return module;
    }
    
}
