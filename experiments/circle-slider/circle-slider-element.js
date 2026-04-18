/**
 * Optional `<circle-slider>` custom element — light DOM (page must include `circle-slider.css`).
 *
 * Register once per document: `registerCircleSliderElement()` (see `circle-slider-bundle-entry.js`).
 */

import { DEFAULT_CONFIG, normalizeRuntimeConfig } from "./circle-slider-config.js";
import { initCircleSlider } from "./circle-slider.js";
import { renderCircleSliderStage } from "./circle-slider-stage.js";

let gradientIdSeq = 0;

const BEHAVIORS = /** @type {const} */ ({
  velocityUnbounded: "velocityUnbounded",
  velocityBounded100: "velocityBounded100",
  velocityBoundedRange: "velocityBoundedRange",
});

export class CircleSliderElement extends HTMLElement {
  constructor() {
    super();
    /** @type {ReturnType<typeof import("./circle-slider.js").initCircleSlider> | null} */
    this._api = null;
    this._reflectingAttr = false;
  }

  static get observedAttributes() {
    return ["value", "min", "max", "behavior"];
  }

  connectedCallback() {
    if (this._api) return;
    this._mount();
  }

  disconnectedCallback() {
    if (this._api) {
      this._api.destroy();
      this._api = null;
    }
  }

  /**
   * @param {string} name
   * @param {string | null} oldVal
   * @param {string | null} newVal
   */
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this._api) return;
    if (name === "value" && !this._reflectingAttr) {
      const n = Number.parseInt(String(newVal), 10);
      if (Number.isFinite(n)) this._api.setValue(n);
      return;
    }
    if (name === "behavior" || name === "min" || name === "max") {
      this._remount();
    }
  }

  _remount() {
    if (this._api) {
      this._api.destroy();
      this._api = null;
    }
    this.replaceChildren();
    if (this.isConnected) this._mount();
  }

  _mount() {
    const behavior = parseBehaviorAttr(this.getAttribute("behavior"));
    /** @type {import("./circle-slider-config.js").CircleSliderConfig} */
    const cfg = Object.assign({}, DEFAULT_CONFIG);

    const vmin = Number.parseInt(String(this.getAttribute("min")), 10);
    const vmax = Number.parseInt(String(this.getAttribute("max")), 10);
    const vAttr = Number.parseInt(String(this.getAttribute("value")), 10);

    if (behavior === BEHAVIORS.velocityBoundedRange) {
      if (Number.isFinite(vmin)) cfg.rangeMin = vmin;
      if (Number.isFinite(vmax)) cfg.rangeMax = vmax;
      if (Number.isFinite(vAttr)) cfg.initialValueRange = vAttr;
    } else if (behavior === BEHAVIORS.velocityBounded100) {
      if (Number.isFinite(vAttr)) cfg.initialValueRange = Math.max(0, Math.min(100, vAttr));
    } else {
      if (Number.isFinite(vAttr)) cfg.initialValue = vAttr;
    }

    normalizeRuntimeConfig(cfg);

    const gid = `cs-ce-track-fade-${++gradientIdSeq}`;
    const self = this;

    const stage = renderCircleSliderStage(this, {
      gradientId: gid,
      stageId: "",
      stageAriaLabel: this.getAttribute("aria-label") || "Circle slider",
      cardAriaLabel:
        this.getAttribute("label") ||
        (behavior === BEHAVIORS.velocityBounded100
          ? "Value from 0 to 100, press and drag outward to adjust"
          : "Value, press and drag outward to adjust"),
      initialDisplayValue:
        behavior === BEHAVIORS.velocityBounded100 || behavior === BEHAVIORS.velocityBoundedRange
          ? cfg.initialValueRange
          : cfg.initialValue,
      cardAriaValueMin:
        behavior === BEHAVIORS.velocityBounded100
          ? 0
          : behavior === BEHAVIORS.velocityBoundedRange
            ? cfg.rangeMin != null
              ? cfg.rangeMin
              : null
            : null,
      cardAriaValueMax:
        behavior === BEHAVIORS.velocityBounded100
          ? 100
          : behavior === BEHAVIORS.velocityBoundedRange
            ? cfg.rangeMax != null
              ? cfg.rangeMax
              : null
            : null,
    });

    this._api = initCircleSlider(stage, cfg, {
      behavior,
      onInput: function (val) {
        self._reflectValueAttr(val);
      },
      onChange: function (val) {
        self._reflectValueAttr(val);
      },
    });
  }

  /**
   * @param {number} v
   */
  _reflectValueAttr(v) {
    const next = String(Math.round(v));
    if (this.getAttribute("value") === next) return;
    this._reflectingAttr = true;
    try {
      this.setAttribute("value", next);
    } finally {
      this._reflectingAttr = false;
    }
  }
}

/**
 * @param {string | null} [raw]
 */
function parseBehaviorAttr(raw) {
  if (raw === BEHAVIORS.velocityBounded100 || raw === BEHAVIORS.velocityBoundedRange) return raw;
  return BEHAVIORS.velocityUnbounded;
}

let defined = false;

/** Defines the custom element `circle-slider` once. Safe to call multiple times. */
export function registerCircleSliderElement() {
  if (defined) return;
  if (typeof customElements === "undefined") return;
  customElements.define("circle-slider", CircleSliderElement);
  defined = true;
}
