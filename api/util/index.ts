/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './chained-iterator';

export function delay(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}
