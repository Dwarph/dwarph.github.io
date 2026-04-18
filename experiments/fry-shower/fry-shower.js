/**
 * Fry shower — reuses circle slider core + falling fries on radial release.
 */
import {
  DEFAULT_CONFIG,
  loadStoredConfig,
  normalizeRuntimeConfig,
} from "../circle-slider/circle-slider-config.js";
import { initCircleSlider } from "../circle-slider/circle-slider.js";
import { createDefaultFrySimParams, createFryShower } from "./fry-shower-fries.js";

const root = document.getElementById("fry-shower");
const layer = document.getElementById("fp-fry-layer");

if (root instanceof HTMLElement && layer instanceof HTMLElement) {
  const stored = loadStoredConfig();
  /** @type {import("../circle-slider/circle-slider-config.js").CircleSliderConfig} */
  const cfg = Object.assign({}, DEFAULT_CONFIG, stored || {}, {
    rangeMin: 0,
    rangeMax: 1000,
    initialValueRange: 100,
  });
  normalizeRuntimeConfig(cfg);

  const simParams = createDefaultFrySimParams();

  /** @type {{ release: (value: number) => void; clearPile: () => void; getRemainingToSpawn: () => number } | undefined} */
  let fryShower;

  let encoderActive = false;
  /** Captured when the encoder becomes active; used to merge stale dial vs remaining queue. */
  let sliderValueWhenEncoderOpened = 0;

  const sliderApi = initCircleSlider(root, cfg, {
    behavior: "velocityBoundedRange",
    onEncoderActiveChange: function (active) {
      encoderActive = active;
      if (active) {
        sliderValueWhenEncoderOpened = sliderApi.getValue();
      }
    },
    onRadialRelease: function (value) {
      if (!fryShower) return;
      const remaining = fryShower.getRemainingToSpawn();
      const roundedOpen = Math.round(sliderValueWhenEncoderOpened);
      const rounded = Math.round(Number(value));
      /*
       * Only reuse `remaining` when the dial didn’t move *and* a batch is still spawning (remaining > 0).
       * Before any release, remaining is 0 — using it here would replace the initial dial (e.g. 100) with 0.
       */
      const intent =
        rounded === roundedOpen && rounded !== 0 && remaining > 0
          ? remaining
          : rounded;
      fryShower.release(intent);
      sliderApi.setValue(intent);
    },
  });

  fryShower = createFryShower({
    layer,
    params: simParams,
    getTimeScale: function () {
      if (!encoderActive) return 1;
      const s = Number(simParams.encoderTimeScale);
      if (!Number.isFinite(s) || s <= 0) return 1;
      return Math.min(Math.max(s, 0.01), 1);
    },
    isSpawnAllowed: function () {
      return !encoderActive;
    },
    onFrySpawned: function () {
      if (encoderActive) return;
      sliderApi.setValue(fryShower.getRemainingToSpawn());
    },
  });
}
