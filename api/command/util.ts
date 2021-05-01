/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

// https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
export function escapeRegex(string: string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
