/**
 * Live root sizing for the docs demos and the examples page: a grip on the
 * drawn root's corner that drags (or arrow-keys) the root's size, and
 * Fit / Fill / Reset controls that size it to the preview pane or the whole
 * viewport and keep it tracking that box as it resizes.
 *
 * The size is an override on the root node, applied after the example's own
 * style and before layout, so editing the code keeps it.
 */

export type Size = { width: number; height: number };

/** The size of `el`'s content box: its client size without its padding. */
export function contentBox(el: HTMLElement): Size {
  const style = getComputedStyle(el);
  return {
    width: Math.max(0, el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)),
    height: Math.max(0, el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)),
  };
}

export interface DragHandlers {
  /** Called on pointer down; returning false cancels the drag. */
  start(event: PointerEvent): boolean | void;
  /** Screen pixels moved since the drag started. */
  move(dx: number, dy: number): void;
  end?(): void;
}

/** Tracks a pointer drag that starts on `handle`, capturing the pointer so it follows outside the element. */
export function dragPointer(handle: HTMLElement, handlers: DragHandlers): void {
  let id: number | null = null;
  let x0 = 0;
  let y0 = 0;
  handle.addEventListener("pointerdown", (event) => {
    if (id !== null || event.button !== 0) return;
    if (handlers.start(event) === false) return;
    event.preventDefault();
    id = event.pointerId;
    x0 = event.clientX;
    y0 = event.clientY;
    handle.setPointerCapture(id);
    handle.focus({ preventScroll: true });
  });
  handle.addEventListener("pointermove", (event) => {
    if (event.pointerId === id) handlers.move(event.clientX - x0, event.clientY - y0);
  });
  const finish = (event: PointerEvent) => {
    if (event.pointerId !== id) return;
    id = null;
    handlers.end?.();
  };
  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", finish);
}

/** Runs `fn` at most once per animation frame, however often it is asked for. */
export function perFrame(fn: () => void): () => void {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}

/** The part of a node the override needs. */
interface Sizable {
  setWidth(width: number): void;
  setHeight(height: number): void;
}

export interface SizerOptions {
  /** The element that goes fixed over the viewport on Fill. */
  container: HTMLElement;
  /** The scrolling pane the root is drawn in; Fit and Fill track its content box. */
  preview: HTMLElement;
  /** The canvas the root is drawn on; the grip sits on its bottom-right corner. */
  stage: HTMLCanvasElement;
  handle: HTMLElement;
  fit: HTMLButtonElement;
  fill: HTMLButtonElement;
  reset: HTMLButtonElement;
  /** The root's size from the last layout. */
  rootSize(): Size;
  /** Canvas CSS pixels per layout pixel. */
  scale(): number;
  /** Rebuilds and lays out the tree; it calls `apply` on the root and `place` after drawing. */
  relayout(): void;
  /** Redraws the last layout for a new pane size. */
  redraw(): void;
}

/** Owns one preview's root size override and the controls that change it. */
export class Sizer {
  /** The root's size in layout pixels, or null for the example's own size. */
  override: Size | null = null;
  /** Whether the override follows the preview's content box. */
  private tracking = false;
  private filled = false;
  /** What Fill restores on exit. */
  private beforeFill: { override: Size | null; tracking: boolean } | null = null;
  private overflow = { html: "", body: "" };
  private readonly o: SizerOptions;
  private readonly schedule: () => void;

  constructor(options: SizerOptions) {
    this.o = options;
    this.schedule = perFrame(() => options.relayout());
    const { handle, preview, fit, fill, reset } = options;

    let from: Size = { width: 0, height: 0 };
    let scale = 1;
    dragPointer(handle, {
      start: () => {
        from = this.override ?? options.rootSize();
        // Held for the whole drag: the scale changes as the root outgrows the pane.
        scale = options.scale() || 1;
        this.tracking = false;
        handle.classList.add("is-dragging");
      },
      move: (dx, dy) => this.set({ width: from.width + dx / scale, height: from.height + dy / scale }),
      end: () => handle.classList.remove("is-dragging"),
    });
    handle.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 10 : 1;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const d = delta[event.key];
      if (d === undefined) return;
      event.preventDefault();
      const size = this.override ?? options.rootSize();
      this.tracking = false;
      this.set({ width: size.width + d[0], height: size.height + d[1] });
    });

    fit.addEventListener("click", () => {
      this.tracking = !this.tracking;
      if (this.tracking) this.set(contentBox(preview));
      else this.set(null);
    });
    fill.addEventListener("click", () => (this.filled ? this.exitFill() : this.enterFill()));
    reset.addEventListener("click", () => {
      this.tracking = false;
      this.set(null);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.filled && !event.defaultPrevented) {
        event.preventDefault();
        this.exitFill();
      }
    });

    new ResizeObserver(() => {
      if (this.tracking) this.set(contentBox(preview));
      else options.redraw();
    }).observe(preview);
    this.sync();
  }

  /** Sets the root's size on `root`, overriding the example's own. */
  apply(root: Sizable): void {
    if (this.override === null) return;
    root.setWidth(this.override.width);
    root.setHeight(this.override.height);
  }

  /** Drops a dragged size, which belonged to the previous example; Fit and Fill keep tracking. */
  forget(): void {
    if (!this.tracking && this.override !== null) this.set(null);
  }

  /** A note for the status line when the size is not the example's own. */
  get note(): string {
    if (this.override === null) return "";
    return this.tracking ? (this.filled ? " · filled" : " · fit") : " · resized";
  }

  /** Moves the grip to the drawn root's bottom-right corner; call after drawing. */
  place(): void {
    const { stage, handle } = this.o;
    handle.style.left = `${stage.offsetLeft + stage.offsetWidth}px`;
    handle.style.top = `${stage.offsetTop + stage.offsetHeight}px`;
  }

  private set(size: Size | null): void {
    this.override =
      size === null ? null : { width: Math.max(1, Math.round(size.width)), height: Math.max(1, Math.round(size.height)) };
    this.sync();
    this.schedule();
  }

  private enterFill(): void {
    this.beforeFill = { override: this.override, tracking: this.tracking };
    this.filled = true;
    this.overflow = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    this.o.container.classList.add("is-fill");
    this.tracking = true;
    this.set(contentBox(this.o.preview));
  }

  private exitFill(): void {
    this.filled = false;
    this.o.container.classList.remove("is-fill");
    document.documentElement.style.overflow = this.overflow.html;
    document.body.style.overflow = this.overflow.body;
    const before = this.beforeFill ?? { override: null, tracking: false };
    this.beforeFill = null;
    this.tracking = before.tracking;
    this.set(this.tracking ? contentBox(this.o.preview) : before.override);
    this.o.container.scrollIntoView({ block: "nearest" });
  }

  /** Reflects the state on the buttons. */
  private sync(): void {
    const { fit, fill, reset } = this.o;
    fit.setAttribute("aria-pressed", String(this.tracking));
    fill.setAttribute("aria-pressed", String(this.filled));
    fill.title = this.filled ? "Exit fill (Esc)" : "Fill the viewport; the root tracks its size";
    reset.disabled = this.override === null;
  }
}
