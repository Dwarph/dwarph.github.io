import {
  TWEAK_GROUPS,
  createDefaultParams,
  saveParams,
} from "./no-straight-line-config.js";

const EXPANDED_KEY = "dwarph.io.experiments.noStraightLine.panelOpen";

/**
 * @param {HTMLElement} panel
 * @param {import("./no-straight-line-config.js").NslParams} params
 * @param {{ resetLayout: () => void, onParamChange?: (key: string) => void }} api
 */
export function initTweakPanel(panel, params, api) {
  const toggle = panel.querySelector("[data-nsl-tweak-toggle]");
  const body = panel.querySelector("[data-nsl-tweak-body]");
  const fieldsRoot = panel.querySelector("[data-nsl-tweak-fields]");
  if (!toggle || !body || !fieldsRoot) return;

  /** @type {Map<string, HTMLInputElement>} */
  const inputs = new Map();

  function setExpanded(on) {
    body.hidden = !on;
    panel.classList.toggle("nsl-tweak-panel--open", on);
    toggle.setAttribute("aria-expanded", on ? "true" : "false");
    try {
      localStorage.setItem(EXPANDED_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  try {
    setExpanded(localStorage.getItem(EXPANDED_KEY) === "1");
  } catch {
    setExpanded(false);
  }

  toggle.addEventListener("click", () => setExpanded(body.hidden));

  for (const group of TWEAK_GROUPS) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "nsl-tweak-fieldset";
    const legend = document.createElement("legend");
    legend.textContent = group.legend;
    fieldset.appendChild(legend);

    for (const field of group.fields) {
      const wrap = document.createElement("div");
      wrap.className = "nsl-tweak-field";

      const label = document.createElement("label");
      label.className = "nsl-tweak-row";

      const name = document.createElement("span");
      name.className = "nsl-tweak-label";
      name.textContent = field.label;

      const input = document.createElement("input");
      input.type = "range";
      input.min = String(field.min);
      input.max = String(field.max);
      input.step = String(field.step);
      input.value = String(params[field.key]);
      input.dataset.nslParam = field.key;
      input.setAttribute("aria-describedby", `nsl-help-${field.key}`);

      const output = document.createElement("output");
      output.className = "nsl-tweak-out";
      output.dataset.nslOut = field.key;
      output.dataset.decimals = String(field.decimals);

      label.append(name, input, output);

      const help = document.createElement("p");
      help.className = "nsl-tweak-help";
      help.id = `nsl-help-${field.key}`;
      help.textContent = field.explain;

      wrap.append(label, help);
      fieldset.appendChild(wrap);
      inputs.set(field.key, input);
    }

    fieldsRoot.appendChild(fieldset);
  }

  function formatOut(key, value) {
    const out = panel.querySelector(`[data-nsl-out="${key}"]`);
    if (!out) return;
    const decimals = Number(out.getAttribute("data-decimals") ?? "2");
    out.textContent = Number(value).toFixed(decimals);
  }

  function syncInputsFromParams() {
    for (const [key, input] of inputs) {
      input.value = String(params[/** @type {keyof typeof params} */ (key)]);
      formatOut(key, params[/** @type {keyof typeof params} */ (key)]);
    }
  }

  function onInput(e) {
    const target = /** @type {HTMLInputElement | null} */ (e.target);
    if (!target?.dataset.nslParam) return;
    const key = target.dataset.nslParam;
    let v = Number(target.value);
    if (!Number.isFinite(v)) return;
    if (
      key === "constraintIterations" ||
      key === "substeps" ||
      key === "ropeLineWidth" ||
      key === "ropeParticleCount"
    ) {
      v = Math.round(v);
    }
    if (key === "ropeParticleCount") {
      v = Math.max(4, Math.min(32, v));
    }
    params[/** @type {keyof typeof params} */ (key)] = v;
    formatOut(key, v);
    saveParams(params);
    api.onParamChange?.(key);
  }

  panel.addEventListener("input", onInput);

  const resetBtn = panel.querySelector("[data-nsl-reset-params]");
  resetBtn?.addEventListener("click", () => {
    const prevCount = params.ropeParticleCount;
    Object.assign(params, createDefaultParams());
    syncInputsFromParams();
    saveParams(params);
    if (params.ropeParticleCount !== prevCount) {
      api.onParamChange?.("ropeParticleCount");
    }
  });

  const layoutBtn = panel.querySelector("[data-nsl-reset-layout]");
  layoutBtn?.addEventListener("click", () => {
    api.resetLayout();
  });

  syncInputsFromParams();
}
