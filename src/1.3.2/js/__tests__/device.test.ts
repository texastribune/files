/* eslint-disable import/first */
/* global jest, test, expect, describe */


import {stringToArrayBuffer, parseTextArrayBuffer} from "../utils";
import {DeviceDirectory} from "../devices/base";
import {DomElementDevice} from "../devices/dom";
import {parseJsonArrayBuffer} from "../utils";
import {Directory} from "../files/base";


describe('Test Device Directory', () => {
    let deviceDirectory : Directory;
    let log = console.log;
    let elementId = 'el-id';
    let initialInnerText = 'Initial Text';
    let initialClass = 'device';

    beforeEach(async () => {
        console.log = log;
        document.body.innerHTML = `<div id="${elementId}" class="${initialClass}">${initialInnerText}</div>`;
        deviceDirectory = new DeviceDirectory();
    });

    test('Has devices', async () => {
        let children = await deviceDirectory.getChildren();
        let names = children.map((file) => {return file.name});
        expect(names).toContain('null');
        expect(names).toContain('console');
    });

    test('Console device write', async () => {
        // Writing to console file should output to console.
        let consoleDevice = await deviceDirectory.getFile(['console']);
        let output = "";
        console.log = (...args : any[]) => {
            for (let arg of args){
                output += arg.toString();
            }
        };
        await consoleDevice.write(stringToArrayBuffer("test console"));
        expect(output).toMatch("test console");
    });

    test('Dom device exists for element', async () => {
        // All directories should be dom devices. Should be one for the div created above.
        let children = await deviceDirectory.getChildren();
        console.log("DEVICES", children);
        let domDevices = children.filter((file) => {return file.directory});

        expect(domDevices.length).toBe(1);
        expect(domDevices[0]).toBeInstanceOf(DomElementDevice);
        expect(domDevices[0].id).toMatch(elementId);
        expect(domDevices[0].name).toMatch(`div-${elementId}`);
    });

    test('Add child dom device', async () => {
        let domElementDeviceDirectory = await deviceDirectory.getFile([`div-${elementId}`]);
        if (domElementDeviceDirectory instanceof Directory){
            let subElement = await domElementDeviceDirectory.addDirectory('span');
            let hmtlElement = document.getElementById(subElement.id);
            if (hmtlElement == null){
                throw new Error("id element directory does not exists");
            }
            expect(hmtlElement.tagName.toLowerCase()).toMatch('span');
        } else {
            throw new Error("device directory is not a directory");
        }
    });

    test('Dom element text device', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        let device = domDevices[0];

        if (device instanceof Directory){
            let domTextFile = await device.getFile(['text']);

            // TODO This not working because innerText in jest returns undefined
            // // When reading element text device it should return buffer of element current innerText
            // let readText = await domTextFile.read();
            // expect(parseTextArrayBuffer(readText)).toMatch(initialInnerText);

            // When writing element text device it should change element innerText
            await domTextFile.write(stringToArrayBuffer('test text'));
            let deviceElement = document.querySelector('.device') as HTMLDivElement;
            expect(deviceElement.innerText).toMatch('test text');
        } else {
            throw new Error('device expected to be Directory');
        }

    });

    test('Dom element class device', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        let device = domDevices[0];

        if (device instanceof Directory) {
            let domClassFile = await device.getFile(['class']);

            // When reading element class device it should return buffer of element current className
            let readClass = await domClassFile.read();
            expect(parseTextArrayBuffer(readClass)).toMatch(initialClass);

            // When writing element class device it should change element current className
            await domClassFile.write(stringToArrayBuffer('test-class'));
            expect(document.querySelectorAll('.test-class').length).toBe(1);
        } else {
            throw new Error('device expected to be Directory');
        }
    });

    test('Dom mouse device', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        let device = domDevices[0];

        if (device instanceof Directory) {
            let domMouseFile = await device.getFile(['mouse']);

            let dataPromise : Promise<ArrayBuffer> = domMouseFile.read();

            // trigger mouse event after read called
            let element = document.getElementById(elementId);
            if (element === null){
                throw new Error('dom element does not exist')
            }
            element.click();

            let data = await dataPromise;

            let dataObject = parseJsonArrayBuffer(data);
            expect(dataObject).toHaveProperty('clientX');
            expect(dataObject).toHaveProperty('clientY');
            expect(dataObject).toHaveProperty('offsetX');
            expect(dataObject).toHaveProperty('offsetY');
            expect(dataObject).toHaveProperty('pageX');
            expect(dataObject).toHaveProperty('pageY');
        } else {
            throw new Error('device expected to be Directory');
        }
    });
});