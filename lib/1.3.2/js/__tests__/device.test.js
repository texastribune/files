"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const base_1 = require("../devices/base");
const dom_1 = require("../devices/dom");
const utils_2 = require("../utils");
const base_2 = require("../files/base");
describe('Test Device Directory', () => {
    let deviceDirectory;
    let log = console.log;
    let elementId = 'el-id';
    let initialInnerText = 'Initial Text';
    let initialClass = 'device';
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        console.log = log;
        document.body.innerHTML = `<div id="${elementId}" class="${initialClass}">${initialInnerText}</div>`;
        deviceDirectory = new base_1.DeviceDirectory();
    }));
    test('Has devices', () => __awaiter(this, void 0, void 0, function* () {
        let children = yield deviceDirectory.getChildren();
        let names = children.map((file) => { return file.name; });
        expect(names).toContain('null');
        expect(names).toContain('console');
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
        yield consoleDevice.write(utils_1.stringToArrayBuffer("test console"));
        expect(output).toMatch("test console");
    }));
    test('Dom device exists for element', () => __awaiter(this, void 0, void 0, function* () {
        // All directories should be dom devices. Should be one for the div created above.
        let children = yield deviceDirectory.getChildren();
        let domDevices = children.filter((file) => { return file.directory; });
        expect(domDevices.length).toBe(1);
        expect(domDevices[0]).toBeInstanceOf(dom_1.DomElementDevice);
        expect(domDevices[0].id).toMatch(elementId);
        expect(domDevices[0].name).toMatch(`div-${elementId}`);
    }));
    test('Add child dom device', () => __awaiter(this, void 0, void 0, function* () {
        let domElementDeviceDirectory = yield deviceDirectory.getFile([`div-${elementId}`]);
        if (domElementDeviceDirectory instanceof base_2.Directory) {
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
        let children = yield deviceDirectory.getChildren();
        let domDevices = children.filter((file) => { return file instanceof dom_1.DomElementDevice; });
        let device = domDevices[0];
        if (device instanceof base_2.Directory) {
            let domTextFile = yield device.getFile(['text']);
            // TODO This not working because innerText in jest returns undefined
            // // When reading element text device it should return buffer of element current innerText
            // let readText = await domTextFile.read();
            // expect(parseTextArrayBuffer(readText)).toMatch(initialInnerText);
            // When writing element text device it should change element innerText
            yield domTextFile.write(utils_1.stringToArrayBuffer('test text'));
            let deviceElement = document.querySelector('.device');
            expect(deviceElement.innerText).toMatch('test text');
        }
        else {
            throw new Error('device expected to be Directory');
        }
    }));
    test('Dom element class device', () => __awaiter(this, void 0, void 0, function* () {
        let children = yield deviceDirectory.getChildren();
        let domDevices = children.filter((file) => { return file instanceof dom_1.DomElementDevice; });
        let device = domDevices[0];
        if (device instanceof base_2.Directory) {
            let domClassFile = yield device.getFile(['class']);
            // When reading element class device it should return buffer of element current className
            let readClass = yield domClassFile.read();
            expect(utils_1.parseTextArrayBuffer(readClass)).toMatch(initialClass);
            // When writing element class device it should change element current className
            yield domClassFile.write(utils_1.stringToArrayBuffer('test-class'));
            expect(document.querySelectorAll('.test-class').length).toBe(1);
        }
        else {
            throw new Error('device expected to be Directory');
        }
    }));
    test('Dom mouse device', () => __awaiter(this, void 0, void 0, function* () {
        let children = yield deviceDirectory.getChildren();
        let domDevices = children.filter((file) => { return file instanceof dom_1.DomElementDevice; });
        let device = domDevices[0];
        if (device instanceof base_2.Directory) {
            let domMouseFile = yield device.getFile(['mouse']);
            let data = yield new Promise((resolve, reject) => {
                // read should not resolve until a mouse event occurs.
                domMouseFile.read()
                    .then((eventData) => {
                    resolve(eventData);
                });
                // trigger mouse event after read called
                let mouseEvent = new MouseEvent('click');
                let element = document.getElementById(elementId);
                if (element === null) {
                    throw new Error('dom element does not exist');
                }
                element.dispatchEvent(mouseEvent);
            });
            let dataObject = utils_2.parseJsonArrayBuffer(data);
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
