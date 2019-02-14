"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/**
 * Create an object with configuration data from a configuration file.
 * @param {ArrayBuffer} data - The configuration file data.
 * @returns {Object} - The configuration data Object for that file.
 */
function parseConfigFile(data) {
    let config = {};
    try {
        let configText = utils_1.parseTextArrayBuffer(data);
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
exports.parseConfigFile = parseConfigFile;
/**
 * Update an existing configuration file with new data.
 * @param {Object} newConfig - The configuration data to add to the file.
 * @param {ArrayBuffer} [data] - The existing configuration file. If not given, a new file is created.
 * @returns {ArrayBuffer} - Blob with the new configuration data.
 */
function updateConfigFile(newConfig, data) {
    return __awaiter(this, void 0, void 0, function* () {
        let config;
        if (data) {
            config = parseConfigFile(data);
        }
        else {
            config = {};
        }
        Object.assign(config, newConfig);
        let configText = "";
        for (let configName in config) {
            configText += `${configName}=${config[configName]}\n`;
        }
        return utils_1.stringToArrayBuffer(configText);
    });
}
exports.updateConfigFile = updateConfigFile;
