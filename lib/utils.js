/** @module utils */
let units = ['KB', 'MB', 'GB', 'TB'];
export function convertBytesToReadable(numBytes) {
    let repr = null;
    let i = units.length;
    while (!repr && i > 0) {
        let divisor = Math.pow(10, i * 3);
        let result = numBytes / divisor;
        let decimals = result > 10 ? 0 : 1;
        if (result > 1 || i === 0) {
            let unit = units[i - 1];
            repr = `${result.toFixed(decimals)} ${unit}`;
        }
        i--;
    }
    return repr || `${numBytes} bytes`;
}
export function compareStrings(string1, string2) {
    return string1.localeCompare(string2);
}
export function compareNumbers(number1, number2) {
    return number1 - number2;
}
export function compareDateStrings(dateString1, dateString2) {
    return new Date(dateString1).getTime() - new Date(dateString2).getTime();
}
/**
 * Convert a file containing text data into a string.
 */
export function parseTextArrayBuffer(arrayBuffer) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(arrayBuffer).toString();
    }
    else if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder().decode(new Uint8Array(arrayBuffer));
    }
    else {
        let numArray = new Uint8Array(arrayBuffer);
        return String.fromCharCode.apply(null, numArray);
    }
}
/**
 * Convert a file containing JSON encoded data into a Javascript Object or Array.
 */
export function parseJsonArrayBuffer(arrayBuffer) {
    let text = parseTextArrayBuffer(arrayBuffer);
    return JSON.parse(text);
}
/**
 * Convert a file containing text data into a string.
 */
export function arrayBufferToDataUrl(arrayBuffer, mimeType) {
    let binary = '';
    let bytes = new Uint8Array(arrayBuffer);
    for (let byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
}
/**
 * Convert a file containing text data into a string.
 */
export function fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let result = fileReader.result;
            if (result instanceof ArrayBuffer) {
                resolve(result);
            }
            else {
                reject("Could not read file " + file);
            }
        };
        fileReader.onerror = () => {
            reject(fileReader.error);
        };
        fileReader.readAsArrayBuffer(file);
    });
}
/**
 * Convert string to an ArrayBuffer.
 */
export function stringToArrayBuffer(string) {
    return Uint8Array.from([...string].map(ch => ch.charCodeAt(0))).buffer;
}
/**
 * Copy an ArrayBuffer.
 */
export function copyArrayBuffer(arrayBuffer) {
    let dst = new ArrayBuffer(arrayBuffer.byteLength);
    new Uint8Array(dst).set(new Uint8Array(arrayBuffer));
    return dst;
}
export function getOpt(...args) {
    let index = 0;
    let kwargs = {};
    while (index < args.length) {
        if (args[index].startsWith('-')) {
            let kwPair = args.splice(index, 2);
            let name = kwPair[0].substr(1);
            kwargs[name] = kwPair[1] || '';
        }
        index++;
    }
    return [args, kwargs];
}
/**
 * Create an HTML element from an HTML string
 */
export function createNode(htmlString) {
    let template = document.createElement('template');
    template.innerHTML = htmlString;
    let element = template.content.firstChild;
    if (element instanceof Element) {
        return element;
    }
    throw Error("string could not be converted to HTML element");
}
/**
 * Get the first element of a certain type in the event composedPath
 */
export function getFirstInPath(event, type) {
    for (let element of event.composedPath()) {
        if (element instanceof type) {
            return element;
        }
    }
    return null;
}
