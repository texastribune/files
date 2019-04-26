/* eslint-disable import/first */
/* global jest, test, expect, describe */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { stringToArrayBuffer, parseTextArrayBuffer } from "../utils";
import { DeviceDirectory } from "../devices/base";
import { DomElementDevice } from "../devices/dom";
import { parseJsonArrayBuffer } from "../utils";
import { Directory } from "../files/base";
import { ConsoleFile } from "../devices/console";
import { NullFile } from "../devices/null";
describe('Test Device Directory', () => {
    let deviceDirectory;
    let log = console.log;
    let elementId = 'el-id';
    let initialInnerText = 'Initial Text';
    let initialClass = 'device';
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        console.log = log;
        document.body.innerHTML = `<div id="${elementId}" class="${initialClass}">${initialInnerText}</div>`;
        deviceDirectory = new DeviceDirectory();
    }));
    test('Has devices', () => __awaiter(this, void 0, void 0, function* () {
        let children = yield deviceDirectory.getChildren();
        let fileMap = children.reduce((map, file) => {
            map[file.name] = file;
            return map;
        }, {});
        let names = Object.keys(fileMap);
        expect(names.length).toEqual(3);
        expect(names).toContain('null');
        expect(names).toContain('console');
        expect(names).toContain(`body-${document.body.id}`);
        expect(fileMap.null).toBeInstanceOf(NullFile);
        expect(fileMap.console).toBeInstanceOf(ConsoleFile);
        expect(fileMap[`body-${document.body.id}`]).toBeInstanceOf(DomElementDevice);
    }));
    test('Console device write', () => __awaiter(this, void 0, void 0, function* () {
        // Writing to console file should output to console.
        let consoleDevice = yield deviceDirectory.getFile(['console']);
        let output = "";
        console.log = (...args) => {
            for (let arg of args) {
                output += arg.toString();
            }
        };
        yield consoleDevice.write(stringToArrayBuffer("test console"));
        expect(output).toMatch("test console");
    }));
    test('Dom device exists for element', () => __awaiter(this, void 0, void 0, function* () {
        // All directories should be dom devices. Should be one for the div created above.
        let bodyDevice = yield deviceDirectory.getFile([`body-${document.body.id}`]);
        expect(bodyDevice.name).toMatch(`body-${document.body.id}`);
        expect(bodyDevice.id).toMatch(document.body.id);
        if (bodyDevice instanceof Directory) {
            let childDevices = [];
            for (let child of yield bodyDevice.getChildren()) {
                if (child instanceof Directory) {
                    childDevices.push(child);
                }
            }
            expect(childDevices.length).toBe(1);
            expect(childDevices[0]).toBeInstanceOf(DomElementDevice);
            expect(childDevices[0].id).toMatch(elementId);
            expect(childDevices[0].name).toMatch(`div-${elementId}`);
        }
        else {
            throw new Error("device directory is not a directory");
        }
    }));
    test('Add child dom device', () => __awaiter(this, void 0, void 0, function* () {
        let domElementDeviceDirectory = yield deviceDirectory.getFile([`body-${document.body.id}`, `div-${elementId}`]);
        if (domElementDeviceDirectory instanceof Directory) {
            let subElement = yield domElementDeviceDirectory.addDirectory('span');
            let hmtlElement = document.getElementById(subElement.id);
            if (hmtlElement == null) {
                throw new Error("id element directory does not exists");
            }
            expect(hmtlElement.tagName.toLowerCase()).toMatch('span');
        }
        else {
            throw new Error("device directory is not a directory");
        }
    }));
    test('Dom element text device', () => __awaiter(this, void 0, void 0, function* () {
        let domElementDeviceDirectory = yield deviceDirectory.getFile([`body-${document.body.id}`, `div-${elementId}`]);
        if (domElementDeviceDirectory instanceof Directory) {
            let domTextFile = yield domElementDeviceDirectory.getFile(['text']);
            // TODO This not working because innerText in jest returns undefined
            // // When reading element text device it should return buffer of element current innerText
            // let readText = await domTextFile.read();
            // expect(parseTextArrayBuffer(readText)).toMatch(initialInnerText);
            // When writing element text device it should change element innerText
            yield domTextFile.write(stringToArrayBuffer('test text'));
            let deviceElement = document.querySelector('.device');
            expect(deviceElement.innerText).toMatch('test text');
        }
        else {
            throw new Error('device expected to be Directory');
        }
    }));
    test('Dom element class device', () => __awaiter(this, void 0, void 0, function* () {
        let domElementDeviceDirectory = yield deviceDirectory.getFile([`body-${document.body.id}`, `div-${elementId}`]);
        if (domElementDeviceDirectory instanceof Directory) {
            let domClassFile = yield domElementDeviceDirectory.getFile(['class']);
            // When reading element class device it should return buffer of element current className
            let readClass = yield domClassFile.read();
            expect(parseTextArrayBuffer(readClass)).toMatch(initialClass);
            // When writing element class device it should change element current className
            yield domClassFile.write(stringToArrayBuffer('test-class'));
            expect(document.querySelectorAll('.test-class').length).toBe(1);
        }
        else {
            throw new Error('device expected to be Directory');
        }
    }));
    test('Dom mouse device', () => __awaiter(this, void 0, void 0, function* () {
        let domElementDeviceDirectory = yield deviceDirectory.getFile([`body-${document.body.id}`, `div-${elementId}`]);
        if (domElementDeviceDirectory instanceof Directory) {
            let domMouseFile = yield domElementDeviceDirectory.getFile(['mouse']);
            let dataPromise = domMouseFile.read();
            // trigger mouse event after read called
            let element = document.getElementById(elementId);
            if (element === null) {
                throw new Error('dom element does not exist');
            }
            element.click();
            let data = yield dataPromise;
            let dataObject = parseJsonArrayBuffer(data);
            expect(dataObject).toHaveProperty('clientX');
            expect(dataObject).toHaveProperty('clientY');
            expect(dataObject).toHaveProperty('offsetX');
            expect(dataObject).toHaveProperty('offsetY');
            expect(dataObject).toHaveProperty('pageX');
            expect(dataObject).toHaveProperty('pageY');
        }
        else {
            throw new Error('device expected to be Directory');
        }
    }));
});
