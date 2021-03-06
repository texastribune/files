import { parseTextArrayBuffer, stringToArrayBuffer } from "../utils.js";
/**
 * Create an object with configuration data from a configuration file.
 * @param {ArrayBuffer} data - The configuration file data.
 * @returns {Object} - The configuration data Object for that file.
 */
export function parseConfigFile(data) {
    let config = {};
    try {
        let configText = parseTextArrayBuffer(data);
        let lines = configText.split('\n');
        for (let line of lines) {
            let terms = line.split('=');
            if (terms.length === 2) {
                config[terms[0].trim()] = terms[1].trim();
            }
        }
    }
    catch (error) {
        console.log(`Error parsing config file: ${error}`);
    }
    return config;
}
/**
 * Update an existing configuration file with new data.
 * @param {Object} newConfig - The configuration data to add to the file.
 * @param {ArrayBuffer} [data] - The existing configuration file. If not given, a new file is created.
 * @returns {ArrayBuffer} - Blob with the new configuration data.
 */
export async function updateConfigFile(newConfig, data) {
    let config;
    if (data !== undefined) {
        config = parseConfigFile(data);
    }
    else {
        config = {};
    }
    Object.assign(config, newConfig);
    let configText = "";
    for (let configName in config) {
        if (config.hasOwnProperty(configName)) {
            configText += `${configName}=${config[configName]}\n`;
        }
    }
    return stringToArrayBuffer(configText);
}
