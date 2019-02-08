/** @module utils */
export declare function convertBytesToReadable(numBytes: number): string;
export declare function compareStrings(string1: string, string2: string): number;
export declare function compareNumbers(number1: number, number2: number): number;
export declare function compareDateStrings(dateString1: string, dateString2: string): number;
/**
 * Convert a file containing text data into a string.
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to decode.
 * @returns {string} - The text contained in the file.
 */
export declare function parseTextArrayBuffer(arrayBuffer: ArrayBuffer): string;
/**
 * Convert a file containing JSON encoded data into a Javascript Object or Array.
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to decode.
 * @returns {Object|Array} - A Javascript Object or Array.
 */
export declare function parseJsonArrayBuffer(arrayBuffer: ArrayBuffer): string;
/**
 * Convert a file containing text data into a string.
 * @param {ArrayBuffer} arrayBuffer - An array buffer to encode.
 * @param {string} mimeType - The mime type of the data in the array buffer.
 * @returns {string} - Data url for file.
 */
export declare function arrayBufferToDataUrl(arrayBuffer: ArrayBuffer, mimeType: string): string;
/**
 * Convert a file containing text data into a string.
 * @async
 * @param {File|Blob} file - File object containing text.
 * @returns {ArrayBuffer} - ArrayBuffer with data from file.
 */
export declare function fileToArrayBuffer(file: File): Promise<ArrayBuffer>;
/**
 * Convert string to an ArrayBuffer.
 * @param {string} string - string to encode.
 * @returns {ArrayBuffer} - Data as an ArrayBuffer.
 */
export declare function stringToArrayBuffer(string: string): ArrayBuffer;
/**
 * Copy an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer - ArrayBuffer to copy.
 * @returns {ArrayBuffer} - new ArrayBuffer.
 */
export declare function copyArrayBuffer(arrayBuffer: ArrayBuffer): ArrayBuffer;
export declare function getOpt(...args: string[]): (string[] | {
    [key: string]: string;
})[];
