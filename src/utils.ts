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
 */
export function parseJsonArrayBuffer(arrayBuffer : ArrayBuffer) : any {
  let text = parseTextArrayBuffer(arrayBuffer);
  return JSON.parse(text);

}

/**
 * Convert a file containing text data into a string.
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
 */
export function fileToArrayBuffer(file : File | Blob) : Promise<ArrayBuffer> {
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
 */
export function stringToArrayBuffer(string : string) : ArrayBuffer{
  return Uint8Array.from([...string].map(ch => ch.charCodeAt(0))).buffer;
}

/**
 * Copy an ArrayBuffer.
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

/**
 * Create an HTML element from an HTML string
 */
export function createNode(htmlString : string) : Element {
  let template = document.createElement('template');
  template.innerHTML = htmlString;
  let element = template.content.firstChild;
  if (element instanceof Element){
    return element;
  }
  throw Error("string could not be converted to HTML element")
}

/**
 * Get the first element of a certain type in the event composedPath
 */
export function getFirstInPath<T extends HTMLElement>(event : Event, type : new () => T) : T | null {
  for (let element of event.composedPath()){
    if (element instanceof type){
      return element;
    }
  }
  return null;
}


const REQUEST_TIMEOUT = 30;

export function getCookie(name : string) : string | null {
  let parts = document.cookie.split(`${name}=`);
  if (parts.length > 1) {
    parts = parts[1].split(';');
    return parts[0] || null;
  }
  return null;
}

export function isCrossDomain(url : URL) {
  return window.location.protocol + '//' + window.location.host !==
    url.protocol + '//' + url.host;
}

export interface Requester {
  request(url : URL, query? : {[name : string] : string}, data? : FormData | Blob | null, method? : 'GET' | 'POST' | 'PUT' | 'DELETE') : Promise<ArrayBuffer>
}


export class AjaxRequester implements Requester {
  request(url: URL, query?: { [p: string]: string }, data?: FormData | Blob | null, method?: "GET" | "POST" | "PUT" | "DELETE"): Promise<ArrayBuffer> {
    console.log("AJAX!");
    console.trace();
    return new Promise((resolve, reject) => {
      data = data || null;
      query = query || {};

      method = method || 'GET';
      if (method === 'GET' || method === 'DELETE') {
        for (let name in query){
          url.searchParams.append(name, query[name]);
        }
      }

      let request = new XMLHttpRequest();
      request.responseType = "arraybuffer";
      request.onreadystatechange = () => {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 0) {
            reject("An error has occurred");
          } else {
            let contentType = request.getResponseHeader('content-type');
            if (request.status >= 200 && request.status < 400) {
              resolve(request.response);
            } else {
              let errorText = parseTextArrayBuffer(request.response);
              let errorMessage = `${request.status} response`;
              if (contentType === 'application/json') {
                try {
                  let errorJson = JSON.parse(errorText);
                  for (let key in errorJson) {
                    errorMessage += `: ${key} - ${errorJson[key]}. `;
                  }
                  reject(new Error(errorMessage));
                } catch (e) {
                  reject("Error parsing response.");
                }
              } else if (contentType === 'text/html') {
                reject(new Error(errorMessage));
              } else {
                errorMessage += errorText;
                reject(new Error(errorMessage));
              }
            }
          }
        }
      };

      request.open(method, url.toString(), true);
      request.timeout = REQUEST_TIMEOUT * 1000;
      if (!isCrossDomain(url)) {
        request.withCredentials = true;
        let cookie = getCookie("csrftoken");
        if (cookie !== null){
          request.setRequestHeader("X-CSRFToken", cookie);
        }
      }
      request.send(data);
    });
  }
}

export const ajaxRequester = new AjaxRequester();