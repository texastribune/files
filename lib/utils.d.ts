/** @module utils */
export declare function convertBytesToReadable(numBytes: number): string;
export declare function compareStrings(string1: string, string2: string): number;
export declare function compareNumbers(number1: number, number2: number): number;
export declare function compareDateStrings(dateString1: string, dateString2: string): number;
/**
 * Convert a file containing text data into a string.
 */
export declare function parseTextArrayBuffer(arrayBuffer: ArrayBuffer): string;
/**
 * Convert a file containing JSON encoded data into a Javascript Object or Array.
 */
export declare function parseJsonArrayBuffer(arrayBuffer: ArrayBuffer): any;
/**
 * Convert a file containing text data into a string.
 */
export declare function arrayBufferToDataUrl(arrayBuffer: ArrayBuffer, mimeType: string): string;
/**
 * Convert a file containing text data into a string.
 */
export declare function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer>;
/**
 * Convert string to an ArrayBuffer.
 */
export declare function stringToArrayBuffer(string: string): ArrayBuffer;
/**
 * Copy an ArrayBuffer.
 */
export declare function copyArrayBuffer(arrayBuffer: ArrayBuffer): ArrayBuffer;
export declare function getOpt(...args: string[]): (string[] | {
    [key: string]: string;
})[];
/**
 * Create an HTML element from an HTML string
 */
export declare function createNode(htmlString: string): Element;
/**
 * Get the first element of a certain type in the event composedPath
 */
export declare function getFirstInPath<T extends HTMLElement>(event: Event, type: new () => T): T | null;
export declare function getCookie(name: string): string | null;
export declare function isCrossDomain(url: URL): boolean;
export declare function ajax(url: URL, query?: {
    [name: string]: string;
}, data?: FormData | Blob | null, method?: 'GET' | 'POST' | 'PUT' | 'DELETE'): Promise<ArrayBuffer>;
