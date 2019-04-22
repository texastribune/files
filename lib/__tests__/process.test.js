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
const memory_1 = require("../files/memory");
const utils_1 = require("../utils");
const base_1 = require("../processes/base");
const base_2 = require("../devices/base");
const files_1 = require("../processes/files");
class MockWorker {
    constructor(url) {
        this.terminated = false;
        this.onmessage = null;
        this.onerror = null;
        let script = decodeURIComponent(url.split(',')[1]); // We assume its a data url with javascript.
        script += ';return onmessage;';
        let f = new Function('postMessage', script);
        this.workeronmessage = f((data) => {
            if (!this.terminated && this.onmessage !== null) {
                this.onmessage(new MessageEvent("test", { data: data }));
            }
        });
    }
    postMessage(message) {
        if (!this.terminated) {
            this.workeronmessage(new MessageEvent("test", { data: message }));
        }
    }
    terminate() {
        this.terminated = true;
    }
    addEventListener(type, listener, options) {
    }
    removeEventListener(type, listener, options) {
    }
    dispatchEvent(event) {
        return false;
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
    let dir = new files_1.ProcessDirectory();
    return new Promise((resolve, reject) => {
        function tick() {
            setTimeout(() => {
                dir.getChildren()
                    .then((children) => {
                    let proc;
                    let child = children.pop();
                    while (child !== undefined && proc === undefined) {
                        if (child.id === process.id) {
                            proc = child;
                        }
                        child = children.pop();
                    }
                    if (proc === undefined) {
                        resolve();
                    }
                    else {
                        tick();
                    }
                })
                    .catch(reject);
            }, 10);
        }
        tick();
    });
}
class TestFS extends memory_1.MemoryDirectory {
    constructor() {
        super(null, 'root');
        this.extraChildren = [
            new base_2.DeviceDirectory(),
            new files_1.ProcessDirectory()
        ];
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let children = yield _super.getChildren.call(this);
            return children.concat(this.extraChildren);
        });
    }
}
describe('Test Process', () => {
    let root = new TestFS();
    let consoleDev;
    let out;
    let err;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        root = new TestFS();
        consoleDev = yield root.getFile(['dev', 'console']);
        out = yield root.addFile(new ArrayBuffer(0), 'out.txt', 'text/plain');
        err = yield root.addFile(new ArrayBuffer(0), 'err.txt', 'text/plain');
    }));
    test('System exit call writes to stdout', () => __awaiter(this, void 0, void 0, function* () {
        // language=JavaScript
        let script = `
            await system.exit("text text");
        `;
        yield root.addFile(utils_1.stringToArrayBuffer(script), 'init.js', 'application/javascript');
        let process = new base_1.Process(null, root, ['init.js'], out, err);
        yield onProcessExit(process);
        let textArrayBuffer = yield out.read();
        let text = utils_1.parseTextArrayBuffer(textArrayBuffer);
        expect(text).toMatch("text text");
    }));
    test('In process directory until exit', () => __awaiter(this, void 0, void 0, function* () {
        // language=JavaScript
        let script = `
            let fd = await system.open(["proc"]);
            let procDirText = new TextDecoder().decode(new Uint8Array(await system.read(fd));
            await system.exit(procDirText);
        `;
        yield root.addFile(utils_1.stringToArrayBuffer(script), 'init.js', 'application/javascript');
        let process = new base_1.Process(null, root, ['init.js'], out, err);
        yield onProcessExit(process);
        let textArrayBuffer = yield out.read();
        let inProcessData = utils_1.parseJsonArrayBuffer(textArrayBuffer);
        expect(inProcessData.length).toBe(1);
        expect(inProcessData[0].id).toMatch(process.id);
        let procDir = yield root.getFile(['proc']);
        let postProcessData = yield procDir.readJSON();
        expect(postProcessData.length).toBe(0);
    }));
    test('get file descriptor', () => __awaiter(this, void 0, void 0, function* () {
        // language=JavaScript
        let script = `            
            let fd = await system.open(["test.txt"]);
            console.log("FD", fd);
            await system.exit(fd.toString());
        `;
        yield root.addFile(utils_1.stringToArrayBuffer(script), 'init.js', 'application/javascript');
        yield root.addFile(utils_1.stringToArrayBuffer("text"), 'test.txt', 'text/plain');
        let process = new base_1.Process(null, root, ['init.js'], out, err);
        yield onProcessExit(process);
        let textArrayBuffer = yield out.read();
        let text = utils_1.parseTextArrayBuffer(textArrayBuffer);
        console.log("text", text, utils_1.parseTextArrayBuffer(yield consoleDev.read()), utils_1.parseTextArrayBuffer(yield err.read()));
        expect(Number.parseInt(text)).toBeGreaterThan(0);
    }));
    test('read system call', () => __awaiter(this, void 0, void 0, function* () {
        // language=JavaScript
        let script = `
            let fd = await system.open(["test.txt"]);
            let data = await system.read(fd);
            let numArray = new Uint8Array(data);
            let str = String.fromCharCode.apply(null, numArray);
            await system.exit(str);
            
        `;
        yield root.addFile(utils_1.stringToArrayBuffer(script), 'init.js', 'application/javascript');
        yield root.addFile(utils_1.stringToArrayBuffer("text"), 'test.txt', 'text/plain');
        let process = new base_1.Process(null, root, ['init.js'], out, err);
        yield onProcessExit(process);
        let textArrayBuffer = yield out.read();
        let text = utils_1.parseTextArrayBuffer(textArrayBuffer);
        expect(text).toMatch('text');
    }));
    test('Write system call', () => __awaiter(this, void 0, void 0, function* () {
        // language=JavaScript
        let script = `
            let buf = Uint8Array.from([..."text"].map(ch => ch.charCodeAt(0))).buffer;
            let fd = await system.open(["test.txt"]);
            await system.write(fd, buf);
        `;
        yield root.addFile(utils_1.stringToArrayBuffer(script), 'init.js', 'application/javascript');
        let testFile = yield root.addFile(new ArrayBuffer(0), 'test.txt', 'text/plain');
        let process = new base_1.Process(null, root, ['init.js'], out, err);
        yield onProcessExit(process);
        let textArrayBuffer = yield out.read();
        let text = utils_1.parseTextArrayBuffer(textArrayBuffer);
        expect(text).toMatch('text');
    }));
});
