/** @module utils */

let units = ['KB', 'MB', 'GB', 'TB'];

export function convertBytesToReadable(numBytes){
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

export function compareStrings(string1, string2){
  return string1.localeCompare(string2);
}

export function compareNumbers(number1, number2){
  return number1 - number2;
}

export function compareDateStrings(dateString1, dateString2){
  return new Date(dateString1) - new Date(dateString2);
}


/**
 * Convert a file containing text data into a string.
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to decode.
 * @returns {string} - The text contained in the file.
 */
export function parseTextArrayBuffer(arrayBuffer){
  return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));

}

/**
 * Convert a file containing JSON encoded data into a Javascript Object or Array.
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to decode.
 * @returns {Object|Array} - A Javascript Object or Array.
 */
export function parseJsonArrayBuffer(arrayBuffer){
  return JSON.parse(parseTextArrayBuffer(arrayBuffer));
}

/**
 * Convert a file containing text data into a string.
 * @param {ArrayBuffer} arrayBuffer - An array buffer to encode.
 * @param {string} mimeType - The mime type of the data in the array buffer.
 * @returns {string} - Data url for file.
 */
export function arrayBufferToDataUrl(arrayBuffer, mimeType){
  let binary = '';
  let bytes = new Uint8Array(arrayBuffer);
  for (let byte of bytes) {
      binary += String.fromCharCode(byte);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Convert a file containing text data into a string.
 * @async
 * @param {File|Blob} file - File object containing text.
 * @returns {ArrayBuffer} - ArrayBuffer with data from file.
 */
export async function fileToArrayBuffer(file){
  return await new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = () => {
      reject(fileReader.error)
    };
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Convert string to an ArrayBuffer.
 * @param {string} string - string to encode.
 * @returns {ArrayBuffer} - Data as an ArrayBuffer.
 */
export function stringToArrayBuffer(string){
  return Uint8Array.from([...string].map(ch => ch.charCodeAt(0))).buffer;
}

/**
 * Copy an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer - ArrayBuffer to copy.
 * @returns {ArrayBuffer} - new ArrayBuffer.
 */
export function copyArrayBuffer(arrayBuffer){
    let dst = new ArrayBuffer(arrayBuffer.byteLength);
    new Uint8Array(dst).set(new Uint8Array(arrayBuffer));
    return dst;
}


export function getOpt(...args){
  let index = 0;
  let kwargs = {};
  while (index < args.length){
    if (args[index].startsWith('-')){
      let kwPair = args.splice(index, 2);
      let name = kwPair[0].substr(1);
      kwargs[name] = kwPair[1] || {};
    }
    index ++;
  }
  return [args, kwargs];
}

/**
 * Compare two FileNodes or FileObjects by id.
 * @param {FileNode|FileObject} a - First object to compare.
 * @param {FileNode|FileObject} b - Second object to compare.
 * @returns {int} - comparison result.
 */
export function compareById(a, b) {
    if (a.id > b.id){
        return 1;
    }
    if (a.id < b.id){
        return -1;
    }
    return 0;
};