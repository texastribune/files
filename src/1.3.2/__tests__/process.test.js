/* eslint-disable import/first */
/* global jest, test, expect, describe */


import {MemoryDirectory} from "../js/files/memory.js";
import {stringToArrayBuffer} from "../js/utils.js";
import {Process} from "../js/processes/base.js";
import {DeviceDirectory} from "../js/files/devices/base.js";
import {ProcessDirectory} from "../js/processes/files.js";

class MockWorker {
    constructor(url){
        this._terminated = false;
        let script = decodeURIComponent(url.split(',')[1]);  // We assume its a data url with javascript.
        script += ';return onmessage;';
        this.onmessage = (event) => {};

        let f = new Function('postMessage', script);
        this._workeronmessage = f((data) => {
            if (!this._terminated){
                this.onmessage(new MessageEvent("test", {data: data}));
            }
        });
    }

    postMessage(data){
        if (!this._terminated){
            this._workeronmessage(new MessageEvent("test", {data: data}));
        }
    }

    terminate(){
        this._terminated = true;
    }
}

global.window.Worker = MockWorker;


/**
 *
 * @param process - The promise to wait for.
 * @returns {Promise} - A promise which resolves when the given process has exited.
 */
function onProcessExit(process) {
    // Returns a promise that resolves after the process has exited. Does this
    // by checking every 10ms for the process file in the process directory.
    let dir = new ProcessDirectory();
    return new Promise((resolve, reject) => {
        function tick(){
            setTimeout(() => {
                dir.getChildren()
                    .then((children) => {
                        let proc;
                        while (children.length > 0 && proc === undefined){
                            let child = children.pop();
                            if (child.id === process.id){
                                proc = child;
                            }
                        }
                        if (proc === undefined){
                            resolve();
                        } else {
                            tick();
                        }
                    })
                    .catch(reject);
            }, 10);
        }
        tick();
    });
}

class TestFS extends MemoryDirectory {
    constructor(){
        super(null, 'root');
    }

    async getChildren(){
        let children = await super.getChildren();
        children.push(new DeviceDirectory());
        children.push(new ProcessDirectory());
        return children;
    }
}

describe('Test Process', () => {
    let root = new TestFS();
    let consoleDev;
    let out;
    let err;

    beforeEach(async () => {
        consoleDev = await root.getFile(['dev', 'console']);
        out = await root.addFile(new ArrayBuffer(0), 'out.txt', 'text/plain');
        err = await root.addFile(new ArrayBuffer(0), 'err.txt', 'text/plain');
    });

    afterEach(async () => {
        root._children = [];
    });

    test('System exit call writes to stdout', async () => {
        let script = `
            await system.exit("text text");
        `;
        await root.addFile(stringToArrayBuffer(script), 'init.js');

        let process = new Process(null, root, ['init.js'], out, err);
        await onProcessExit(process);
        let text = await out.readText();
        expect(text).toMatch("text text");
    });

    test('In process directory until exit', async () => {
        let script = `
            let fd = await system.open(["proc"]);
            let procDirText = await system.readText(fd);
            await system.exit(procDirText);
        `;
        await root.addFile(stringToArrayBuffer(script), 'init.js');
        let process = new Process(null, root, ['init.js'], out, err);
        await onProcessExit(process);
        let inProcessData = await out.readJSON();
        expect(inProcessData.length).toBe(1);
        expect(inProcessData[0].id).toMatch(process.id);

        let procDir = await root.getFile(['proc']);
        let postProcessData = await procDir.readJSON();
        expect(postProcessData.length).toBe(0);
    });

    test('Write system call', async () => {
        let script = `
            let buf = Uint8Array.from([..."text"].map(ch => ch.charCodeAt(0))).buffer;
            let fd = await system.open(["test.txt"]);
            await system.write(fd, buf);
        `;
        await root.addFile(stringToArrayBuffer(script), 'init.js');
        let testFile = await root.addFile(new ArrayBuffer(0), 'test.txt', 'text/plain');
        let process = new Process(null, root, ['init.js'], out, err);
        await onProcessExit(process);
        let outText = await testFile.readText();
        expect(outText).toMatch('text');
    });
});