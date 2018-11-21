/* eslint-disable import/first */
/* global jest, test, expect, describe */


import {stringToArrayBuffer, parseTextArrayBuffer} from "../js/utils.js";
import {DeviceDirectory} from "../js/files/devices/base.js";
import {DomElementDevice} from "../js/files/devices/dom.js";
import {parseJsonArrayBuffer} from "../js/utils";


describe('Test Device Directory', () => {
    let deviceDirectory;
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
        console.log = (...args) => {
            for (let arg of args){
                output += arg.toString();
            }
        };
        await consoleDevice.write(stringToArrayBuffer("test console"));
        expect(output).toMatch("test console");
    });

    test('Dom device exists for element', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        expect(domDevices.length).toBe(1);
    });

    test('Dom element text device', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        let device = domDevices[0];

        let domTextFile = await device.getFile(['text']);

        // TODO This not working because innerText in jest returns undefined
        // // When reading element text device it should return buffer of element current innerText
        // let readText = await domTextFile.read();
        // expect(parseTextArrayBuffer(readText)).toMatch(initialInnerText);

        // When writing element text device it should change element innerText
        await domTextFile.write(stringToArrayBuffer('test text'));
        expect(document.querySelector('.device').innerText).toMatch('test text');
    });

    test('Dom element class device', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        let device = domDevices[0];

        let domClassFile = await device.getFile(['class']);

        // When reading element class device it should return buffer of element current className
        let readClass = await domClassFile.read();
        expect(parseTextArrayBuffer(readClass)).toMatch(initialClass);

        // When writing element class device it should change element current className
        await domClassFile.write(stringToArrayBuffer('test-class'));
        expect(document.querySelectorAll('.test-class').length).toBe(1);
    });

    test('Dom mouse device', async () => {
        let children = await deviceDirectory.getChildren();
        let domDevices = children.filter((file) => {return file instanceof DomElementDevice});
        let device = domDevices[0];

        let domMouseFile = await device.getFile(['mouse']);

        let data = await new Promise((resolve, reject) => {
            // read should not resolve until a mouse event occurs.
            domMouseFile.read()
                .then((eventData) => {
                    resolve(eventData)
                });

            // trigger mouse event after read called
            let mouseEvent = new MouseEvent('click');
            let element = document.getElementById(elementId);
            element.dispatchEvent(mouseEvent);
        });

        let dataObject = parseJsonArrayBuffer(data);
        expect(dataObject).toHaveProperty('clientX');
        expect(dataObject).toHaveProperty('clientY');
        expect(dataObject).toHaveProperty('offsetX');
        expect(dataObject).toHaveProperty('offsetY');
        expect(dataObject).toHaveProperty('pageX');
        expect(dataObject).toHaveProperty('pageY');
    });
});