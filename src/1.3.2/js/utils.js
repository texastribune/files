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
 * @async
 * @param {File|Blob} file - File object containing text.
 * @returns {string} - The text contained in the file.
 */
export async function parseTextFile(file){
  return await new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = () => {
      reject(fileReader.error)
    };
    fileReader.readAsText(file);
  });
}

/**
 * Convert a file containing JSON encoded data into a Javascript Object or Array.
 * @async
 * @param {File|Blob} file - File object containing text.
 * @returns {Object|Array} - A Javascript Object or Array.
 */
export async function parseJsonFile(file){
  let text = await parseTextFile(file);
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Error reading json file: ${e}.`)
  }
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
 * @async
 * @param {File|Blob} file - File object containing text.
 * @returns {string} - Data url for file.
 */
export async function fileToDataUrl(file){
  return await new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = () => {
      reject(fileReader.error)
    };
    fileReader.readAsDataURL(file);
  });
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
 * Convert a dataUrl into a Blob.
 * @async
 * @param {string} dataUrl - Data url.
 * @returns {Blob} file - Blob object with data from dataUrl.
 */
export function dataUrlToBlob(dataUrl){
  let urlParts = dataUrl.split(':')[1].split(',');
  let encoding = urlParts[0];
  let data = urlParts[1];
  let encodingParts = encoding.split(';');
  let type = encodingParts[0] || 'text/plain';
  if (encodingParts[1] && encodingParts[1] === 'base64'){
    let byteString = atob(data);
    data = new Uint8Array(new ArrayBuffer(byteString.length));
    for (let i = 0; i < byteString.length; i++) {
      data[i] = byteString.charCodeAt(i);
    }
  }
  return new Blob([data], {type: type});
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
