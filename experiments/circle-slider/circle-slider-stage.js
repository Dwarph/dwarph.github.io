/**
 * Single source of truth for the circle-slider stage markup (SVG radial + value card).
 *
 * Keeps Standard / Range / any future instance from duplicating ~90 lines of HTML and makes it
 * easier to evolve the visual structure in one place. The tweak panel and mode picker remain
 * separate — this module builds only the interactive control itself.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @typedef {object} CircleSliderStageOptions
 * @property {string} gradientId — must be unique per stage in the document (referenced by `url(#…)`).
 * @property {string} stageId — set on the outer `.cs-stage` wrapper (e.g. `circle-slider`).
 * @property {string} stageAriaLabel
 * @property {string} cardAriaLabel
 * @property {number} initialDisplayValue — textual placeholder; `syncDisplay()` overwrites on init.
 * @property {number | null} [cardAriaValueMin]
 * @property {number | null} [cardAriaValueMax]
 * @property {string} [promptText]
 */

/**
 * Build a stage `.cs-stage` wrapper and append it to `container`.
 *
 * @param {HTMLElement} container
 * @param {CircleSliderStageOptions} opts
 * @returns {HTMLElement} the stage wrapper element
 */
export function renderCircleSliderStage(container, opts) {
  const {
    gradientId,
    stageId,
    stageAriaLabel,
    cardAriaLabel,
    initialDisplayValue,
    cardAriaValueMin,
    cardAriaValueMax,
    promptText = "How many?",
  } = opts;

  const displayText = String(initialDisplayValue);

  const stage = document.createElement("div");
  if (stageId) stage.id = stageId;
  stage.className = "cs-stage";
  stage.setAttribute("aria-label", stageAriaLabel);

  stage.appendChild(stageFill());

  const controlRoot = document.createElement("div");
  controlRoot.className = "cs-control-root";

  const row = document.createElement("div");
  row.className = "cs-row";

  const slot = document.createElement("div");
  slot.className = "cs-control-slot";
  slot.setAttribute("aria-hidden", "true");
  row.appendChild(slot);

  const valueColumn = document.createElement("div");
  valueColumn.className = "cs-value-column";

  const prompt = document.createElement("p");
  prompt.className = "cs-prompt";
  prompt.textContent = promptText;
  valueColumn.appendChild(prompt);

  const cardStack = document.createElement("div");
  cardStack.className = "cs-card-stack";

  const dialStack = document.createElement("div");
  dialStack.className = "cs-dial-stack";
  dialStack.setAttribute("data-cs-dial-stack", "");

  dialStack.appendChild(buildRadialLayer({ gradientId, displayText }));
  dialStack.appendChild(buildPressHalo());
  dialStack.appendChild(
    buildValueCard({ cardAriaLabel, displayText, cardAriaValueMin, cardAriaValueMax })
  );

  cardStack.appendChild(dialStack);
  valueColumn.appendChild(cardStack);
  row.appendChild(valueColumn);
  controlRoot.appendChild(row);
  stage.appendChild(controlRoot);
  stage.appendChild(stageFill());

  container.appendChild(stage);
  return stage;
}

function stageFill() {
  const el = document.createElement("div");
  el.className = "cs-stage__fill";
  el.setAttribute("aria-hidden", "true");
  return el;
}

/**
 * @param {{ gradientId: string; displayText: string }} opts
 */
function buildRadialLayer(opts) {
  const { gradientId, displayText } = opts;

  const layer = document.createElement("div");
  layer.className = "cs-radial-layer";
  layer.setAttribute("data-cs-radial-layer", "");
  layer.setAttribute("aria-hidden", "true");

  const readout = document.createElement("div");
  readout.className = "cs-active-readout";
  readout.setAttribute("data-cs-active-readout", "");
  readout.setAttribute("aria-hidden", "true");

  const chip = document.createElement("div");
  chip.className = "cs-active-readout__chip";
  const chipValue = document.createElement("span");
  chipValue.className = "cs-active-readout__value";
  chipValue.setAttribute("data-cs-active-readout-display", "");
  chipValue.textContent = displayText;
  chip.appendChild(chipValue);

  const tail = document.createElement("div");
  tail.className = "cs-active-readout__tail";
  tail.setAttribute("aria-hidden", "true");

  readout.appendChild(chip);
  readout.appendChild(tail);
  layer.appendChild(readout);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "cs-radial-svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("width", "280");
  svg.setAttribute("height", "280");
  svg.setAttribute("focusable", "false");

  const maskGroup = document.createElementNS(SVG_NS, "g");
  maskGroup.setAttribute("class", "cs-radial-rotate-mask");
  maskGroup.setAttribute("transform", "translate(100 100)");

  const trackRot = document.createElementNS(SVG_NS, "g");
  trackRot.setAttribute("class", "cs-track-rot");
  trackRot.setAttribute("data-track-rot", "");

  const defs = document.createElementNS(SVG_NS, "defs");
  const grad = document.createElementNS(SVG_NS, "linearGradient");
  grad.setAttribute("id", gradientId);
  grad.setAttribute("data-track-fade-gradient", "");
  grad.setAttribute("gradientUnits", "userSpaceOnUse");
  grad.setAttribute("x1", "-78");
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", "78");
  grad.setAttribute("y2", "0");
  for (const [offset, cls] of [
    ["0%", "cs-track-fade-stop cs-track-fade-stop--edge"],
    ["22%", "cs-track-fade-stop cs-track-fade-stop--solid"],
    ["78%", "cs-track-fade-stop cs-track-fade-stop--solid"],
    ["100%", "cs-track-fade-stop cs-track-fade-stop--edge"],
  ]) {
    const stop = document.createElementNS(SVG_NS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("class", cls);
    grad.appendChild(stop);
  }
  defs.appendChild(grad);
  trackRot.appendChild(defs);

  const trackPath = document.createElementNS(SVG_NS, "path");
  trackPath.setAttribute("class", "cs-track-path");
  trackPath.setAttribute("fill", "none");
  trackPath.setAttribute("stroke", `url(#${gradientId})`);
  trackPath.setAttribute("stroke-width", "3");
  trackPath.setAttribute("stroke-linecap", "butt");
  trackPath.setAttribute("d", "");
  trackPath.setAttribute("data-track-path", "");
  trackRot.appendChild(trackPath);

  maskGroup.appendChild(trackRot);
  svg.appendChild(maskGroup);

  const thumbRot = document.createElementNS(SVG_NS, "g");
  thumbRot.setAttribute("class", "cs-thumb-rot");
  thumbRot.setAttribute("transform", "translate(100 100)");
  thumbRot.setAttribute("data-thumb-rot", "");

  const thumbPath = document.createElementNS(SVG_NS, "path");
  thumbPath.setAttribute("class", "cs-thumb-path");
  thumbPath.setAttribute("fill", "none");
  thumbPath.setAttribute("stroke", "currentColor");
  thumbPath.setAttribute("stroke-width", "7");
  thumbPath.setAttribute("stroke-linecap", "round");
  thumbPath.setAttribute("d", "");
  thumbPath.setAttribute("data-thumb-path", "");
  thumbRot.appendChild(thumbPath);

  svg.appendChild(thumbRot);
  layer.appendChild(svg);
  return layer;
}

function buildPressHalo() {
  const halo = document.createElement("div");
  halo.className = "cs-press-halo";
  halo.setAttribute("data-cs-press-halo", "");
  halo.setAttribute("aria-hidden", "true");
  return halo;
}

/**
 * @param {{ cardAriaLabel: string; displayText: string; cardAriaValueMin?: number | null; cardAriaValueMax?: number | null }} opts
 */
function buildValueCard(opts) {
  const { cardAriaLabel, displayText, cardAriaValueMin, cardAriaValueMax } = opts;
  const card = document.createElement("div");
  card.className = "cs-value-card";
  card.setAttribute("role", "spinbutton");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", cardAriaLabel);
  card.setAttribute("aria-valuenow", displayText);
  if (cardAriaValueMin != null) card.setAttribute("aria-valuemin", String(cardAriaValueMin));
  if (cardAriaValueMax != null) card.setAttribute("aria-valuemax", String(cardAriaValueMax));
  card.setAttribute("data-cs-card", "");

  const value = document.createElement("span");
  value.className = "cs-value";
  value.setAttribute("data-cs-value-display", "");
  value.textContent = displayText;
  card.appendChild(value);
  return card;
}
