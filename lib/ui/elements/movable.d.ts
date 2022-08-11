import { CustomElement } from "./element.js";
interface Vector {
    x: number;
    y: number;
}
/**
 An element who's position can be changed.
 */
export declare class Movable extends CustomElement {
    /**
     Affects how fast the element will decelerate when in motion.
     */
    protected frictionCoef: number;
    /**
     Time in seconds between position updates from velocity vector.
     */
    protected timeStep: number;
    private motionTimeout;
    private lastPositionUpdateTime;
    constructor();
    private _position;
    /**
     The current location of the upper left corner of the element to its closes relatively positioned ancestor in pixels.
     */
    get position(): Vector;
    set position(value: Vector);
    private _velocity;
    /**
     The current motion of the element in pixels per second.
     */
    get velocity(): Vector;
    set velocity(value: Vector);
    get frictionForce(): {
        x: number;
        y: number;
    };
    get speed(): number;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    connectedCallback(): void;
    center(): void;
}
/**
 An element who's position can be changed by clicking and dragging.
 */
export declare class Grabbable extends Movable {
    onmousedown: (ev: MouseEvent) => any;
    protected includeChildren: boolean;
    protected noPropagate: boolean;
    private startPosition;
    private mouseStartPosition;
    constructor();
    private startDrag;
    private stopDrag;
}
/**
 An element who's position can be changed using the scroll wheel of the mouse.
 */
export declare class Scrollable extends Movable {
    static scrollSpeedAttribute: string;
    private static defaultScrollSpeed;
    /**
     A multiplier for the rate the element moves when scrolled. Can be set with "scroll-speed" attribute .
     */
    protected scrollSpeed: number;
    private touchStartPosition;
    constructor();
    static get observedAttributes(): string[];
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
export {};
