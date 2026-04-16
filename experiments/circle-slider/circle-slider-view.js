import { TRACK_ARC_BISECTOR_RAD, thumbArcPath, trackArcPath } from "./circle-slider-math.js";

/**
 * @typedef {object} RadialSliderView
 * @property {(thumbAngleRad: number, arcCenterAngleRad: number) => void} applyRotations
 * @property {(on: boolean) => void} setRadialVisible
 * @property {(on: boolean, options?: { arcHandoff?: boolean }) => void} setPressHaloVisible
 * @property {() => void} lockPageScroll
 * @property {() => void} unlockPageScroll
 */

/**
 * @param {HTMLElement} root
 * @param {import("./circle-slider-config.js").CircleSliderConfig} cfg
 */
export function applyVisualConfig(root, cfg) {
  const radialLayer = root.querySelector("[data-cs-radial-layer]");
  const trackPath = root.querySelector("[data-track-path]");
  const thumbPath = root.querySelector("[data-thumb-path]");
  const trackFadeGradient = root.querySelector("[data-track-fade-gradient]");
  if (!radialLayer || !trackPath || !thumbPath) return;

  const r = cfg.trackRadius;
  trackPath.setAttribute("d", trackArcPath(r));
  if (trackFadeGradient) {
    trackFadeGradient.setAttribute("x1", String(-r));
    trackFadeGradient.setAttribute("x2", String(r));
  }
  thumbPath.setAttribute("d", thumbArcPath(r, (cfg.thumbArcDeg / 2) * (Math.PI / 180)));
  trackPath.setAttribute("stroke-width", String(cfg.trackStrokeWidth));
  thumbPath.setAttribute("stroke-width", String(cfg.thumbStrokeWidth));

  radialLayer.style.setProperty("--cs-radial-appear-ms", `${cfg.appearDurationMs}ms`);
  radialLayer.style.setProperty("--cs-radial-hide-ms", `${cfg.hideDurationMs}ms`);
  radialLayer.style.setProperty(
    "--cs-blur-rest",
    `${Math.max(cfg.blurAppearPx, cfg.blurHidePx)}px`
  );

  const dialStack = root.querySelector("[data-cs-dial-stack]");
  if (dialStack instanceof HTMLElement) {
    dialStack.style.setProperty("--cs-radial-appear-ms", `${cfg.appearDurationMs}ms`);
    dialStack.style.setProperty("--cs-radial-hide-ms", `${cfg.hideDurationMs}ms`);
  }

  const pressHalo = root.querySelector("[data-cs-press-halo]");
  if (pressHalo) {
    const blurPx = `${Math.max(cfg.blurAppearPx, cfg.blurHidePx)}px`;
    pressHalo.style.setProperty("--cs-halo-appear-ms", `${cfg.appearDurationMs}ms`);
    pressHalo.style.setProperty("--cs-halo-hide-ms", `${cfg.hideDurationMs}ms`);
    pressHalo.style.setProperty("--cs-halo-blur-rest", blurPx);
    pressHalo.style.setProperty("--cs-halo-diameter-fr", String((2 * cfg.trackRadius) / 200));
  }
}

/**
 * @param {{ radialLayer: HTMLElement; pressHalo: HTMLElement | null; thumbRot: SVGGElement; trackRot: SVGGElement }} deps
 * @returns {RadialSliderView}
 */
export function createRadialSliderView(deps) {
  const { radialLayer, pressHalo, thumbRot, trackRot } = deps;
  let scrollLocked = false;
  let lockedScrollY = 0;

  const dialStack = radialLayer.closest("[data-cs-dial-stack]");

  return {
    applyRotations: function (thumbAngle, arcCenterAngle) {
      const thumbDeg = (thumbAngle * 180) / Math.PI;
      const trackDeg = ((arcCenterAngle - TRACK_ARC_BISECTOR_RAD) * 180) / Math.PI;
      thumbRot.setAttribute("transform", `translate(100 100) rotate(${thumbDeg})`);
      trackRot.setAttribute("transform", `rotate(${trackDeg})`);
    },
    setRadialVisible: function (on) {
      radialLayer.classList.toggle("cs-radial-layer--visible", on);
      radialLayer.setAttribute("aria-hidden", on ? "false" : "true");
      if (dialStack instanceof HTMLElement) {
        dialStack.classList.toggle("cs-dial-stack--radial-visible", on);
      }
    },
    setPressHaloVisible: function (on, options) {
      if (!pressHalo) return;
      const arcHandoff = options && options.arcHandoff;
      if (on) {
        pressHalo.classList.remove("cs-press-halo--arc-handoff");
        pressHalo.classList.add("cs-press-halo--visible");
        return;
      }
      if (arcHandoff) {
        pressHalo.classList.add("cs-press-halo--arc-handoff");
      }
      pressHalo.classList.remove("cs-press-halo--visible");
    },
    lockPageScroll: function () {
      if (scrollLocked) return;
      scrollLocked = true;
      lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add("cs-scroll-lock");
      document.body.classList.add("cs-scroll-lock");
    },
    unlockPageScroll: function () {
      if (!scrollLocked) return;
      scrollLocked = false;
      document.documentElement.classList.remove("cs-scroll-lock");
      document.body.classList.remove("cs-scroll-lock");
      window.scrollTo(0, lockedScrollY);
    },
  };
}
