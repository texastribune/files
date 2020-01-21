/* eslint-disable import/first */
/* global jest, test, expect, describe */
import { MemoryDirectory } from "../files/memory";
import { parseTextArrayBuffer, stringToArrayBuffer } from "../utils";
import { Process } from "../processes/base";
import { DeviceDirectory } from "../devices/base";
import { ProcessDirectory } from "../processes/files";
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
    let dir = new ProcessDirectory();
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
class TestFS extends MemoryDirectory {
    constructor() {
        super(null, 'root');
        this.extraChildren = [
            new DeviceDirectory(),
            new ProcessDirectory()
        ];
    }
    async getChildren() {
        let children = await super.getChildren();
        return children.concat(this.extraChildren);
    }
}
// TODO Fix these tests
describe('Test Process', () => {
    let root = new TestFS();
    let consoleDev;
    let out;
    let err;
    beforeEach(async () => {
        root = new TestFS();
        consoleDev = await root.getFile(['dev', 'console']);
        out = await root.addFile(new ArrayBuffer(0), 'out.txt', 'text/plain');
        err = await root.addFile(new ArrayBuffer(0), 'err.txt', 'text/plain');
    });
    test('System exit call writes to stdout', async () => {
        // language=JavaScript
        let script = `
            await system.exit("text text");
        `;
        await root.addFile(stringToArrayBuffer(script), 'init.js', 'application/javascript');
        let process = new Process(null, root, ['init.js'], out, err);
        await onProcessExit(process);
        let textArrayBuffer = await out.read();
        let text = parseTextArrayBuffer(textArrayBuffer);
        expect(text).toMatch("text text");
    });
    //
    //     test('In process directory until exit', async () => {
    //         // language=JavaScript
    //         let script = `
    //             let fd = await system.open(["proc"]);
    //             let procDirText = new TextDecoder().decode(new Uint8Array(await system.read(fd));
    //             await system.exit(procDirText);
    //         `;
    //         await root.addFile(stringToArrayBuffer(script), 'init.js', 'application/javascript');
    //         let process = new Process(null, root, ['init.js'], out, err);
    //         await onProcessExit(process);
    //         let textArrayBuffer = await out.read();
    //         let inProcessData = parseJsonArrayBuffer(textArrayBuffer);
    //         expect(inProcessData.length).toBe(1);
    //         expect(inProcessData[0].id).toMatch(process.id);
    //
    //         let procDir = await root.getFile(['proc']);
    //         let postProcessData = await procDir.readJSON();
    //         expect(postProcessData.length).toBe(0);
    //     });
    //
    //     test('get file descriptor', async () => {
    //         // language=JavaScript
    //         let script = `
    //             let fd = await system.open(["test.txt"]);
    //             console.log("FD", fd);
    //             await system.exit(fd.toString());
    //         `;
    //         await root.addFile(stringToArrayBuffer(script), 'init.js', 'application/javascript');
    //         await root.addFile(stringToArrayBuffer("text"), 'test.txt', 'text/plain');
    //         let process = new Process(null, root, ['init.js'], out, err);
    //         await onProcessExit(process);
    //         let textArrayBuffer = await out.read();
    //         let text = parseTextArrayBuffer(textArrayBuffer);
    //         console.log("text", text, parseTextArrayBuffer(await consoleDev.read()), parseTextArrayBuffer(await err.read()));
    //         expect(Number.parseInt(text)).toBeGreaterThan(0);
    //     });
    //
    //     test('read system call', async () => {
    //         // language=JavaScript
    //         let script = `
    //             let fd = await system.open(["test.txt"]);
    //             let data = await system.read(fd);
    //             let numArray = new Uint8Array(data);
    //             let str = String.fromCharCode.apply(null, numArray);
    //             await system.exit(str);
    //
    //         `;
    //         await root.addFile(stringToArrayBuffer(script), 'init.js', 'application/javascript');
    //         await root.addFile(stringToArrayBuffer("text"), 'test.txt', 'text/plain');
    //         let process = new Process(null, root, ['init.js'], out, err);
    //         await onProcessExit(process);
    //         let textArrayBuffer = await out.read();
    //         let text = parseTextArrayBuffer(textArrayBuffer);
    //         expect(text).toMatch('text');
    //     });
    //
    //     test('Write system call', async () => {
    //         // language=JavaScript
    //         let script = `
    //             let buf = Uint8Array.from([..."text"].map(ch => ch.charCodeAt(0))).buffer;
    //             let fd = await system.open(["test.txt"]);
    //             await system.write(fd, buf);
    //         `;
    //         await root.addFile(stringToArrayBuffer(script), 'init.js', 'application/javascript');
    //         let testFile = await root.addFile(new ArrayBuffer(0), 'test.txt', 'text/plain');
    //         let process = new Process(null, root, ['init.js'], out, err);
    //         await onProcessExit(process);
    //         let textArrayBuffer = await out.read();
    //         let text = parseTextArrayBuffer(textArrayBuffer);
    //         expect(text).toMatch('text');
    //     });
});
