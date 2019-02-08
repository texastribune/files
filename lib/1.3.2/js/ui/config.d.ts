/**
 * Create an object with configuration data from a configuration file.
 * @param {ArrayBuffer} data - The configuration file data.
 * @returns {Object} - The configuration data Object for that file.
 */
export declare function parseConfigFile(data: any): {};
/**
 * Update an existing configuration file with new data.
 * @param {Object} newConfig - The configuration data to add to the file.
 * @param {ArrayBuffer} [data] - The existing configuration file. If not given, a new file is created.
 * @returns {ArrayBuffer} - Blob with the new configuration data.
 */
export declare function updateConfigFile(newConfig: any, data: any): Promise<ArrayBuffer>;
