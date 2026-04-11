import {
  DEFAULT_CONFIG,
  STORAGE_KEY,
  VISUAL_CONFIG_KEYS,
  scheduleSaveConfig,
} from "./circle-slider-config.js";
import { applyVisualConfig } from "./circle-slider-view.js";

/**
 * @param {string} n
 * @param {number} fallback
 */
function parseNum(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * @param {HTMLElement} panel
 * @param {import("./circle-slider-config.js").CircleSliderConfig} cfg
 * @param {HTMLElement} sliderRoot
 * @param {{ resetValue: () => void; getValue: () => number; setValue: (n: number) => void }} sliderApi
 * @param {HTMLElement | null | undefined} rangeRoot
 * @param {{ resetValue: () => void; getValue: () => number; setValue: (n: number) => void } | null | undefined} rangeApi
 */
export function initTweakPanel(panel, cfg, sliderRoot, sliderApi, rangeRoot, rangeApi) {
  const toggle = panel.querySelector("[data-cs-tweak-toggle]");
  const body = panel.querySelector("[data-cs-tweak-body]");
  if (!toggle || !body) return;

  const expandedKey = "dwarph.io.experiments.circleSlider.panelOpen";

  function setExpanded(on) {
    body.hidden = !on;
    panel.classList.toggle("cs-tweak-panel--open", on);
    toggle.setAttribute("aria-expanded", on ? "true" : "false");
    try {
      localStorage.setItem(expandedKey, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  try {
    setExpanded(localStorage.getItem(expandedKey) === "1");
  } catch {
    setExpanded(false);
  }

  toggle.addEventListener("click", function () {
    setExpanded(body.hidden);
  });

  /**
   * @param {string} key
   * @param {number | string} v
   */
  function assignConfig(key, v) {
    if (key === "rotationOrigin") {
      cfg.rotationOrigin = v === "initialPress" ? "initialPress" : "cardCenter";
      return;
    }
    if (key === "requireOutsideCardToActivate") {
      cfg.requireOutsideCardToActivate = Boolean(v);
      return;
    }
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num)) return;
    if (key === "initialValue") {
      cfg.initialValue = Math.round(num);
      return;
    }
    cfg[/** @type {keyof import("./circle-slider-config.js").CircleSliderConfig} */ (key)] = num;
  }

  function refreshOutputs() {
    panel.querySelectorAll("[data-cs-tweak-out]").forEach(function (span) {
      const key = span.getAttribute("data-cs-tweak-out");
      if (!key) return;
      const v = cfg[/** @type {keyof import("./circle-slider-config.js").CircleSliderConfig} */ (key)];
      if (typeof v === "number") {
        const dec = span.getAttribute("data-decimals");
        const d = dec != null ? parseInt(dec, 10) : 2;
        span.textContent = v.toFixed(Math.min(12, Math.max(0, d)));
      } else {
        span.textContent = String(v);
      }
    });

    panel.querySelectorAll("[data-cs-config-key]").forEach(function (el) {
      const key = el.getAttribute("data-cs-config-key");
      if (!key || !(key in cfg)) return;
      const v = cfg[/** @type {keyof import("./circle-slider-config.js").CircleSliderConfig} */ (key)];
      if (el instanceof HTMLInputElement) {
        if (el.type === "radio") {
          el.checked = el.value === String(v);
        } else if (el.type === "checkbox") {
          el.checked = Boolean(v);
        } else if (el.tagName === "SELECT") {
          el.value = String(v);
        } else {
          el.value = String(v);
        }
      }
    });
  }

  function onControlInput(ev) {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLSelectElement)) return;
    const key = t.getAttribute("data-cs-config-key");
    if (!key) return;

    if (t instanceof HTMLSelectElement) {
      assignConfig(key, t.value);
    } else if (t.type === "radio") {
      if (t.checked) assignConfig(key, t.value);
    } else if (t.type === "checkbox") {
      assignConfig(key, t.checked);
    } else {
      let num = t.valueAsNumber;
      if (Number.isNaN(num)) {
        const cur = cfg[/** @type {keyof import("./circle-slider-config.js").CircleSliderConfig} */ (key)];
        num = parseNum(t.value, typeof cur === "number" ? cur : 0);
      }
      if (!Number.isFinite(num)) return;
      assignConfig(key, num);
    }

    if (key === "blurAppearPx") {
      cfg.blurHidePx = cfg.blurAppearPx;
    }
    if (key === "appearDurationMs") {
      cfg.hideDurationMs = cfg.appearDurationMs;
    }

    scheduleSaveConfig(cfg);

    if (VISUAL_CONFIG_KEYS.indexOf(key) !== -1) {
      applyVisualConfig(sliderRoot, cfg);
      if (rangeRoot) applyVisualConfig(rangeRoot, cfg);
    }

    refreshOutputs();
  }

  function applyVisualAll() {
    applyVisualConfig(sliderRoot, cfg);
    if (rangeRoot) applyVisualConfig(rangeRoot, cfg);
  }

  panel.addEventListener("input", onControlInput);
  panel.addEventListener("change", onControlInput);

  const resetValBtn = panel.querySelector("[data-cs-reset-value]");
  if (resetValBtn) {
    resetValBtn.addEventListener("click", function () {
      sliderApi.resetValue();
      if (rangeApi) rangeApi.resetValue();
    });
  }

  const resetCfgBtn = panel.querySelector("[data-cs-reset-config]");
  if (resetCfgBtn) {
    resetCfgBtn.addEventListener("click", function () {
      Object.assign(cfg, { ...DEFAULT_CONFIG });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      applyVisualAll();
      refreshOutputs();
      sliderApi.resetValue();
      if (rangeApi) rangeApi.resetValue();
    });
  }

  refreshOutputs();
}
