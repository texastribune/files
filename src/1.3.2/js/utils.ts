/** @module utils */

let units = ['KB', 'MB', 'GB', 'TB'];

export function convertBytesToReadable(numBytes : number) : string {
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

export function compareStrings(string1 : string, string2 : string) : number {
  return string1.localeCompare(string2);
}

export function compareNumbers(number1 : number, number2 : number) : number {
  return number1 - number2;
}

export function compareDateStrings(dateString1 : string, dateString2 : string) : number {
  return new Date(dateString1).getTime() - new Date(dateString2).getTime();
}


/**
 * Convert a file containing text data into a string.
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to decode.
 * @returns {string} - The text contained in the file.
 */
export function parseTextArrayBuffer(arrayBuffer : ArrayBuffer) : string {
  if (typeof Buffer !== 'undefined'){
    return Buffer.from(arrayBuffer).toString();
  } else if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(new Uint8Array(arrayBuffer));
  } else {
    let numArray = new Uint8Array(arrayBuffer) as unknown as number[];
    return String.fromCharCode.apply(null, numArray);
  }
}

/**
 * Convert a file containing JSON encoded data into a Javascript Object or Array.
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to decode.
 * @returns {Object|Array} - A Javascript Object or Array.
 */
export function parseJsonArrayBuffer(arrayBuffer : ArrayBuffer) : string {
  let text = parseTextArrayBuffer(arrayBuffer);
  return JSON.parse(text);

}

/**
 * Convert a file containing text data into a string.
 * @param {ArrayBuffer} arrayBuffer - An array buffer to encode.
 * @param {string} mimeType - The mime type of the data in the array buffer.
 * @returns {string} - Data url for file.
 */
export function arrayBufferToDataUrl(arrayBuffer : ArrayBuffer, mimeType : string) : string {
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
export function fileToArrayBuffer(file : File) : Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      let result = fileReader.result;
      if (result instanceof ArrayBuffer){
        resolve(result);
      } else {
        reject("Could not read file " + file);
      }
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
export function stringToArrayBuffer(string : string) : ArrayBuffer{
  return Uint8Array.from([...string].map(ch => ch.charCodeAt(0))).buffer;
}

/**
 * Copy an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer - ArrayBuffer to copy.
 * @returns {ArrayBuffer} - new ArrayBuffer.
 */
export function copyArrayBuffer(arrayBuffer : ArrayBuffer) : ArrayBuffer {
    let dst = new ArrayBuffer(arrayBuffer.byteLength);
    new Uint8Array(dst).set(new Uint8Array(arrayBuffer));
    return dst;
}


export function getOpt(...args : string[]){
  let index = 0;
  let kwargs : {[key:string]: string} = {};
  while (index < args.length){
    if (args[index].startsWith('-')){
      let kwPair = args.splice(index, 2);
      let name = kwPair[0].substr(1);
      kwargs[name] = kwPair[1] || '';
    }
    index ++;
  }
  return [args, kwargs];
}

