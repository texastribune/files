import {CustomElement} from "./element.js";


interface Vector {
  x: number;
  y: number
}


/**
 An element who's position can be changed.
 */
export class Movable extends CustomElement {
  /**
   Affects how fast the element will decelerate when in motion.
   */
  protected frictionCoef = 100;
  /**
   Time in seconds between position updates from velocity vector.
   */
  protected timeStep = .010;
  private motionTimeout: number | null = null;
  private lastPositionUpdateTime: number | null = null;

  constructor() {
    super();
  }

  private _position: Vector = {x: 0, y: 0};

  /**
   The current location of the upper left corner of the element to its closes relatively positioned ancestor in pixels.
   */
  get position(): Vector {
    return Object.assign({}, this._position); // Make a copy so it doesn't get modified;
  }

  set position(value: Vector) {
    let oldPosition = this._position;
    this._position = {
      x: value.x || 0,
      y: value.y || 0
    };
    this.style.left = `${Math.round(this._position.x).toString()}px`;
    this.style.top = `${Math.round(this._position.y).toString()}px`;

    let time = new Date().getTime();
    if (this.lastPositionUpdateTime !== null) {
      let deltaT = (time - this.lastPositionUpdateTime) / 1000;
      this.velocity = {
        x: (this._position.x - oldPosition.x) / deltaT,
        y: (this._position.y - oldPosition.y) / deltaT
      };
    }
    this.lastPositionUpdateTime = time;
  }

  private _velocity: Vector = {x: 0, y: 0};

  /**
   The current motion of the element in pixels per second.
   */
  get velocity() {
    return this._velocity || {
      x: 0,
      y: 0
    };
  }

  set velocity(value) {
    if (this.motionTimeout) {
      clearTimeout(this.motionTimeout);
    }
    this.motionTimeout = null;

    let x = value.x;
    let y = value.y;
    this._velocity = {x: x, y: y};

    if (x > 0 || y > 0) {
      if (this.speed < 10) {
        this.velocity = {x: 0, y: 0};
      } else {
        const step = this.timeStep;
        this.motionTimeout = window.setTimeout(() => {
          // Update position due to velocity
          let currentPosition = this.position;
          this.position = {
            x: currentPosition.x + x * step,
            y: currentPosition.y + y * step
          };

          // Update velocity due to friction
          let frictionForce = this.frictionForce;

          // Calculate new velocity components due to friction.
          let newX = x + frictionForce.x * step;
          let newY = y + frictionForce.y * step;

          // Friction should not change direction. Check here, and set to zero if so.
          if (Math.sign(newX) !== Math.sign(x)) {
            newX = 0;
          }
          if (Math.sign(newY) !== Math.sign(y)) {
            newY = 0;
          }

          this.velocity = {
            x: newX,
            y: newY
          };
        }, step * 1000);
      }
    }
  }

  get frictionForce() {
    let vel = this.velocity;
    let xDir = Math.sign(vel.x) || 0;
    let yDir = Math.sign(vel.y) || 0;
    return {
      x: -1 * xDir * this.frictionCoef,
      y: -1 * yDir * this.frictionCoef
    }
  }

  get speed() {
    let velocity = this.velocity;
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  updateFromAttributes(attributes: { [p: string]: string | null }): void {
  }

  connectedCallback() {
    super.connectedCallback();
    this.style.position = 'absolute';
    this.lastPositionUpdateTime = null;
    this.position = {x: 0, y: 0};
  }

  center() {
    let rect = this.getBoundingClientRect();
    let x = window.innerWidth / 2 - rect.width / 2;
    let y = window.innerHeight / 2 - rect.height / 2;
    this.position = {x: x, y: y};
    this.velocity = {x: 0, y: 0};
  }
}


/**
 An element who's position can be changed by clicking and dragging.
 */
export class Grabbable extends Movable {
  public onmousedown: (ev: MouseEvent) => any;
  protected includeChildren: boolean = false;
  protected noPropagate: boolean = false;
  private startPosition: Vector = {x: 0, y: 0};
  private mouseStartPosition: Vector = {x: 0, y: 0};

  constructor() {
    super();

    this.onmousedown = (event: MouseEvent) => {
      if (this.noPropagate) {
        event.stopImmediatePropagation();
      }

      if (event.target === this || this.includeChildren) {
        event.preventDefault();
        this.startPosition = this.position;
        this.mouseStartPosition = {x: event.clientX, y: event.clientY};

        this.startDrag();
      }
    };
    this.ontouchstart = (event: TouchEvent) => {
      if (this.noPropagate) {
        event.stopImmediatePropagation();
      }

      if (event.target === this || this.includeChildren) {
        event.preventDefault();
        this.startPosition = this.position;
        this.mouseStartPosition = {x: event.touches[0].clientX, y: event.touches[0].clientY};

        this.startDrag();
      }
    };
  }

  private startDrag() {
    document.onmousemove = (event: MouseEvent) => {
      event.preventDefault();
      if (this.noPropagate) {
        event.stopImmediatePropagation();
      }

      let xMovement = event.clientX - this.mouseStartPosition.x;
      let yMovement = event.clientY - this.mouseStartPosition.y;
      this.position = {
        x: this.startPosition.x + xMovement,
        y: this.startPosition.y + yMovement
      };
      this.velocity = {x: 0, y: 0};
    };
    document.onmouseup = this.stopDrag.bind(this);

    document.ontouchmove = (event: TouchEvent) => {
      if (this.noPropagate) {
        event.stopImmediatePropagation();
      }

      let xMovement = event.touches[0].clientX - this.mouseStartPosition.x;
      let yMovement = event.touches[0].clientY - this.mouseStartPosition.y;
      this.position = {
        x: this.startPosition.x + xMovement,
        y: this.startPosition.y + yMovement
      };
      this.velocity = {x: 0, y: 0};
    };
    document.ontouchend = this.stopDrag.bind(this);
  }

  private stopDrag(event: MouseEvent | TouchEvent) {
    if (this.noPropagate) {
      event.stopImmediatePropagation();
    }
    event.preventDefault();

    document.onmousemove = null;
    document.onmouseup = null;

    document.ontouchmove = null;
    document.ontouchend = null;
  }
}

interface TouchData {
  coords: Vector;
  elementPosition: Vector;
}


/**
 An element who's position can be changed using the scroll wheel of the mouse.
 */
export class Scrollable extends Movable {
  static scrollSpeedAttribute = 'scroll-speed';
  private static defaultScrollSpeed = 1;

  /**
   A multiplier for the rate the element moves when scrolled. Can be set with "scroll-speed" attribute .
   */
  protected scrollSpeed = Scrollable.defaultScrollSpeed;
  private touchStartPosition: { [key: string]: TouchData } = {};

  constructor() {
    super();

    this.onwheel = (event: WheelEvent) => {
      let currentPosition = this.position;
      currentPosition.y -= event.deltaY * this.scrollSpeed;
      this.position = currentPosition;
    };

    this.ontouchstart = (event: TouchEvent) => {
      for (let touch of event.targetTouches) {
        this.touchStartPosition[touch.identifier] = {
          coords: {x: touch.clientX, y: touch.clientY},
          elementPosition: this.position
        };
      }
    };

    this.ontouchmove = (event: TouchEvent) => {
      for (let touch of event.targetTouches) {
        let startData = this.touchStartPosition[touch.identifier];
        if (startData) {
          let deltaX = touch.clientX - startData.coords.x;
          let deltaY = touch.clientY - startData.coords.y;
          this.position = {x: startData.elementPosition.x + deltaX, y: startData.elementPosition.y + deltaY};
        }
      }
    };

    this.ontouchend = (event: TouchEvent) => {
      for (let touch of event.targetTouches) {
        delete this.touchStartPosition[touch.identifier];
      }
    };
  }

  static get observedAttributes() {
    return [Scrollable.scrollSpeedAttribute];
  }

  updateFromAttributes(attributes: { [p: string]: string | null }): void {
    let scrollSpeed = attributes[Scrollable.scrollSpeedAttribute];
    if (scrollSpeed === null) {
      this.scrollSpeed = Scrollable.defaultScrollSpeed;
    } else {
      this.scrollSpeed = Number.parseFloat(scrollSpeed);
    }
  }
}