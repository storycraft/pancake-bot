/*
 * Created on Wed May 05 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import jimp from "jimp";
import { TalkContext } from "../../api/bot";

export type JimpImage = typeof jimp.prototype;

export type ImageContext = {

    image: JimpImage

}

export type TalkImageContext<C> = ImageContext & {

    talkCtx: TalkContext<C>;

}
