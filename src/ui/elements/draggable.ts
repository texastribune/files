import {HTMLElementWithCallbacks} from "./element";

export function DroppableMixin<T extends new(...args: any[]) => HTMLElement>(ElementClass: T) {
  return class Droppable extends ElementClass {
    static dragOverClass = 'dragover';
    static pendingActionClass = 'pending-action';
    // Have to make the below public instead of private due to https://github.com/Microsoft/TypeScript/issues/24226
    public dragOverActions: (() => void)[] = []; // Actions to happen after dragover for dragOverDelay
    public dragOverDelay = 2000;
    public timeOuts: number[] = [];
    public counterSet: Set<EventTarget> = new Set();

    protected constructor(...args: any[]) {
      super(...args);

      // Update the dragover counter if a child is removed.
      let mutationObserver = new MutationObserver((mutationList) => {
        for (let mutation of mutationList) {
          if (mutation.removedNodes.length > 0) {
            this.handleChildrenRemoved(mutation.removedNodes);
          }
        }
      });
      mutationObserver.observe(this, {childList: true, subtree: true});

      this.addEventListener("dragover", this.handleDragOver.bind(this));
      this.addEventListener("dragenter", this.handleDragEnter.bind(this));
      this.addEventListener("dragleave", this.handleDragLeave.bind(this));
      this.addEventListener("drop", this.handleDrop.bind(this));
    }

    get isOver() {
      return this.classList.contains(Droppable.dragOverClass);
    }

    /**
     * Add callback to be called when dragover starts after the dragover delay.
     */
    addDragoverAction(callback: () => void) {
      this.dragOverActions.push(callback);
    }

    /**
     * Called when dragover event is triggered.
     */
    handleDragOver(event: Event) {
      event.preventDefault();
    }

    /**
     * Called when dragenter event triggered.
     */
    handleDragEnter(event: Event) {
      event.preventDefault();

      if (this.counterSet.size === 0) {
        this.classList.add(Droppable.dragOverClass);
        this.setTimeouts();
      }
      if (event.target !== null) {
        this.counterSet.add(event.target);
      }
    }

    /**
     * Called when dragleave event triggered.
     */
    handleDragLeave(event: Event) {
      event.preventDefault();

      if (event.target !== null) {
        this.counterSet.delete(event.target);
      }
      if (this.counterSet.size === 0) {
        this.classList.remove(Droppable.dragOverClass);
        this.clearTimeOuts();
      }
    }

    /**
     * Called when drop event triggered.
     */
    handleDrop(event: Event) {
      event.preventDefault();

      this.counterSet = new Set();
      this.classList.remove(Droppable.dragOverClass);
      this.clearTimeOuts();

    }

    handleChildrenRemoved(removedChildren: NodeList) {
      for (let child of removedChildren) {
        this.counterSet.delete(child);
        this.handleChildrenRemoved(child.childNodes);
      }
    }

    /**
     * Set timeouts to call dragover actions.
     */
    setTimeouts() {
      if (this.dragOverActions.length > 0) {
        for (let action of this.dragOverActions) {
          let timeoutId = window.setTimeout(() => {
            action();
          }, this.dragOverDelay);
          this.timeOuts.push(timeoutId);
        }
        this.classList.add(Droppable.pendingActionClass);
      }
    }

    /**
     * Remove timeouts to call dragover actions.
     */
    clearTimeOuts() {
      this.classList.remove(Droppable.pendingActionClass);
      for (let timeout of this.timeOuts) {
        window.clearTimeout(timeout);
      }
      this.timeOuts = [];
    }
  }
}

export function DraggableMixin<T extends new(...args: any[]) => HTMLElementWithCallbacks>(ElementClass: T) {
  abstract class Draggable extends ElementClass {
    /**
     * The class name of the element when it is being dragged.
     */
    static draggingClass = 'dragging';

    protected constructor(...args: any[]) {
      super(...args);

      this.addEventListener('dragstart', this.handleDragStart.bind(this));
      this.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    connectedCallback(){
      super.connectedCallback();
      this.draggable = true;
    }

    /**
     * Called when dragstart event is fired.
     */
    handleDragStart(event: DragEvent) {
      this.classList.add(Draggable.draggingClass);
    }

    /**
     * Called when dragend event is fired.
     */
    handleDragEnd(event: DragEvent) {
      this.classList.remove(Draggable.draggingClass);
    }
  }

  return Draggable;
}
