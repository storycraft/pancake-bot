/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import PixivApp from "pixiv-app-api";

export class PixivApi {

    private _lastLogin: number;

    constructor(private _api: PixivApp) {
        this._lastLogin = 0;
    }

    async getApp(): Promise<PixivApp> {
        if (!this._api.auth || this._lastLogin + this._api.auth.expiresIn < Date.now()) await this._api.login();

        return this._api;
    }

}
