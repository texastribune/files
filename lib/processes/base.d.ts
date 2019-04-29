import { ProcessFile } from "./files.js";
import { File, Directory } from "../files/base.js";
declare type syscallTable = {
    open: (pathArray: string[]) => Promise<number>;
    close: (fileDescriptor: number) => void;
    read: (fileDescriptor: number) => Promise<ArrayBuffer>;
    import: (pathArray: string[], variableName: string) => Promise<any>;
    write: (fileDescriptor: number, data: ArrayBuffer) => Promise<ArrayBuffer>;
    fork: () => Promise<number>;
    exec: (pathArray: string[], ...args: string[]) => Promise<number>;
    exit: (message: string) => void;
    error: (message: string) => void;
};
export declare class Process extends ProcessFile {
    private readonly parentProcess;
    private readonly workingDirectory;
    private readonly executablePath;
    private readonly executableName;
    private readonly fileDescriptors;
    private readonly stdin;
    private readonly stdout;
    private readonly stderr;
    private readonly worker;
    constructor(parentProcess: Process | null, workingDirectory: Directory, executablePathArray: string[], stdout: File, stderr: File);
    readonly name: string;
    fork(): Process;
    readonly systemCalls: syscallTable;
}
export {};
