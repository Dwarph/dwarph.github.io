import { MIN_PRESS_HALO_MS } from "./circle-slider-config.js";
import {
  angleAt,
  perceptualOvershootRad,
  rectCenter,
  shortestAngleDiff,
  slipVisualOvershoot,
  smoothstep01,
  thumbArcPath,
  thumbArcPathDirectedStretch,
  velocityMultiplier,
} from "./circle-slider-math.js";

/**
 * @typedef {object} RadialSliderValueState
 * @property {number} value
 * @property {number} valueAcc
 */

/**
 * @typedef {import("./circle-slider-view.js").RadialSliderView} RadialSliderView
 */

/**
 * @typedef {object} RadialSliderBehaviorContext
 * @property {import("./circle-slider-config.js").CircleSliderConfig} cfg
 * @property {HTMLElement} root
 * @property {HTMLElement} card
 * @property {HTMLElement} radialLayer
 * @property {HTMLElement | null} pressHalo
 * @property {RadialSliderView} view
 * @property {() => void} syncDisplay
 * @property {{ min: number; max: number } | null | undefined} valueBounds
 * @property {number | undefined} radPerStepMultiplier — optional; positive multiplier on cfg.radPerStep for value integration only
 * @property {((value: number) => void) | undefined} onRadialRelease — pointer-up ended an active encoder session (radial will hide)
 * @property {((active: boolean) => void) | undefined} onEncoderActiveChange — radial encoder engaged (true) or disengaged (false); used e.g. for time-scale effects
 */

/**
 * @typedef {object} RadialSliderBehaviorHandle
 * @property {() => void} detach
 */

/**
 * Velocity-scaled cumulative rotation → unbounded integer (original experiment behaviour).
 *
 * @param {RadialSliderBehaviorContext} ctx
 * @param {RadialSliderValueState} state
 * @returns {RadialSliderBehaviorHandle}
 */
export function attachVelocityUnboundedRadialBehavior(ctx, state) {
  const { cfg, card, radialLayer, pressHalo, view, syncDisplay, onRadialRelease, onEncoderActiveChange } =
    ctx;
  const vb = ctx.valueBounds;
  const bounded = !!(vb && Number.isFinite(vb.min) && Number.isFinite(vb.max));
  const radPerStepMul =
    ctx.radPerStepMultiplier != null && ctx.radPerStepMultiplier > 0 ? ctx.radPerStepMultiplier : 1;
  const effectiveRadPerStep = cfg.radPerStep * radPerStepMul;
  /** ~px along finger arc → rad at current radius; tight feel, clamped when r is tiny or huge. */
  const SLIP_HOME_ARC_PX = 5;
  const SLIP_HOME_R_MIN_PX = 14;
  /** Floor so long reach (large r → tiny arc/r) doesn’t shrink the home cone below ~1 frame of motion. */
  const SLIP_HOME_RAD_MIN = (4 * Math.PI) / 180;
  const SLIP_HOME_RAD_MAX = (14 * Math.PI) / 180;
  /** Per-frame |Δθ| this small counts as “still” for unlock (rad); wider in cone centre (slipHomeUnlock). */
  const SLIP_HOME_STILL_RAD = (1 * Math.PI) / 180;
  let slipActive = false;
  let slipThumbAngle = 0;
  /** Overscroll: integrated finger delta (rad) since slip arm—unbounded so multi-turn scrub stays pegged. */
  let slipOverscrollAccum = 0;
  /** Smoothed display offset toward the peg-clamped target (avoids negative spring at max / positive at min → reversed stretch). */
  let slipSpringPos = 0;
  /** Previous-frame peg-clamped overscroll; used to detect unwind vs wind-in (windDeeper can stay true while easing). */
  let slipPrevSpringTarget = 0;
  /**
   * Wind-in only: stretch blend between spring-smoothed and truth. Unwind uses truth stretch whenever
   * springTarget moves toward zero, even if slipSpringPos is still catching up (windDeeper).
   */
  const SLIP_GATE_BLEND_RAD = 0.72;
  /** Latch “returning” on clear unwind step; clear only on clear wind-back (reduces stretch-mode jitter). */
  const SLIP_RETURN_ENTER_RAD = 1.5e-4;
  const SLIP_RETURN_EXIT_RAD = 6e-4;
  /**
   * Schmitt latch for spring easing: avoids windDeeper flipping when slipSpringPos chases springTarget
   * (blend ↔ truth stretch wobble). Enter only on a clear step past the peg; exit when target drops
   * clearly below the eased spring (max) or rises above it (min).
   */
  const SLIP_WIND_EASE_ENTER_RAD = 4e-4;
  const SLIP_WIND_EASE_EXIT_RAD = 5.5e-4;
  /** Low-pass (s) on drawn stretch after mode selection — kills residual single-frame pops. */
  const SLIP_STRETCH_DRAW_TAU_S = 0.02;
  /** Pointer-up: if stretched thumb is beyond this (rad), ease stretch to 0 before hiding the radial. */
  const SLIP_RELEASE_STRETCH_EPS = 0.012;
  /** Time constant (s) for stretch spring-back after release — lower = snappier settle. */
  const SLIP_RELEASE_SPRING_TAU_S = 0.055;
  /**
   * Thumb slip uses SVG arc with the small-arc flag (span under 180°). Very large |stretchRad| makes the
   * geometry exceed half a circle and the engine picks the wrong arc — the black stroke looks like it leaves the ring.
   * Cap |stretchRad| so total span 2·halfThumb + |stretch| stays below this (margin below π for stability).
   */
  const SLIP_STRETCH_PATH_SPAN_MAX_RAD = Math.PI - 0.06;
  /**
   * Past this |pointer−arm| (rad), slip visuals use full springTarget; on the arm, visuals use 0 overshoot.
   * Gated on “returning to threshold” so circling past the home ray while still overscrolling does not
   * shrink the thumb (shortest-angle proximity would otherwise fake a return).
   */
  const SLIP_VIS_ARM_BLEND_RAD = (32 * Math.PI) / 180;
  /** Low-pass time constant (s) for angular visual blend factor. */
  const SLIP_VIS_ARM_SMOOTH_TAU_S = 0.04;
  let slipReturnLatch = false;
  let slipWindEaseLatch = false;
  let slipVisArmFactorSmoothed = 1;
  let slipStretchDrawSmoothed = 0;
  /** Last rendered thumb angle while encoder active (used to hold rotation during release stretch spring). */
  let lastThumbAngleForReleaseSpring = 0;
  /** @type {number} */
  let releaseStretchRaf = 0;
  /** Bumped when a release spring is cancelled so stale rAF callbacks exit. */
  let releaseStretchRunId = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let tapHintHideTimer = null;
  /** @type {number} */
  let tapHintShowRaf = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let tapBlurHintCleanupTimer = null;

  function scheduleTapBlurHintClassRemoval() {
    if (tapBlurHintCleanupTimer != null) {
      clearTimeout(tapBlurHintCleanupTimer);
      tapBlurHintCleanupTimer = null;
    }
    if (!(pressHalo instanceof HTMLElement) || !pressHalo.classList.contains("cs-press-halo--blur-hint")) {
      return;
    }
    const ms = Math.max(0, cfg.hideDurationMs);
    tapBlurHintCleanupTimer = setTimeout(function () {
      tapBlurHintCleanupTimer = null;
      if (pressHalo instanceof HTMLElement) {
        pressHalo.classList.remove("cs-press-halo--blur-hint");
      }
    }, ms);
  }

  /**
   * Tap affordance uses blur-hint + a deferred class removal. If that timer fires (or blur-hint is
   * toggled) while the radial is animating out, sibling style updates can disrupt the radial layer’s
   * release-out transition — clear as soon as the encoder is in play or the gesture ends with encoder.
   */
  function clearTapAffordanceClassAndCleanupTimer() {
    if (tapBlurHintCleanupTimer != null) {
      clearTimeout(tapBlurHintCleanupTimer);
      tapBlurHintCleanupTimer = null;
    }
    if (pressHalo instanceof HTMLElement) {
      pressHalo.classList.remove("cs-press-halo--blur-hint");
    }
  }

  function clearTapRadialHint() {
    if (tapHintHideTimer != null) {
      clearTimeout(tapHintHideTimer);
      tapHintHideTimer = null;
    }
    if (tapHintShowRaf) {
      cancelAnimationFrame(tapHintShowRaf);
      tapHintShowRaf = 0;
    }
    if (tapBlurHintCleanupTimer != null) {
      clearTimeout(tapBlurHintCleanupTimer);
      tapBlurHintCleanupTimer = null;
    }
    const hadBlurHint = pressHalo instanceof HTMLElement && pressHalo.classList.contains("cs-press-halo--blur-hint");
    view.setPressHaloVisible(false, { arcHandoff: hadBlurHint });
    if (hadBlurHint) {
      scheduleTapBlurHintClassRemoval();
    }
  }

  /**
   * After a tap that never engaged the encoder, briefly show the circular press halo (not the SVG
   * track arc) so “pull out” reads without flashing the grey arc / thumb.
   */
  function scheduleTapRadialHint() {
    clearTapRadialHint();
    const prefersReduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    tapHintShowRaf = requestAnimationFrame(function () {
      tapHintShowRaf = 0;
      if (pressHalo instanceof HTMLElement) {
        pressHalo.classList.add("cs-press-halo--blur-hint");
      }
      view.setPressHaloVisible(true);
      /*
       * Start the hide timer *after* the halo is shown, not when this gesture’s teardown runs.
       * Otherwise appearMs + holdMs elapses from ~t=0 while the halo only appears on the next frame,
       * so hide can fire before the appear transition finishes and breaks the blur-out.
       */
      const appearMs = Math.max(0, cfg.appearDurationMs);
      const holdMs = prefersReduced ? 48 : 150;
      const hideAfterMs = appearMs + holdMs;
      tapHintHideTimer = setTimeout(function () {
        tapHintHideTimer = null;
        /* arcHandoff: blur + opacity leave together (default hide delays opacity vs blur). */
        view.setPressHaloVisible(false, { arcHandoff: true });
        scheduleTapBlurHintClassRemoval();
      }, hideAfterMs);
    });
  }

  function resetSlipSpring() {
    slipOverscrollAccum = 0;
    slipSpringPos = 0;
    slipPrevSpringTarget = 0;
    slipReturnLatch = false;
    slipWindEaseLatch = false;
    slipVisArmFactorSmoothed = 1;
    slipStretchDrawSmoothed = 0;
  }

  function armSlipAnchor(angle) {
    slipThumbAngle = angle;
    resetSlipSpring();
  }

  /** End slip and drop fractional encoder carry so pegged “phantom” steps cannot block value after unlock. */
  function endSlipGesture() {
    slipActive = false;
    resetSlipSpring();
    restoreThumbPathDefault();
    if (bounded) state.valueAcc = 0;
  }

  function restoreThumbPathDefault() {
    if (!bounded) return;
    const pathEl = radialLayer.querySelector("[data-thumb-path]");
    if (!pathEl) return;
    const r = cfg.trackRadius;
    const baseHalf = (cfg.thumbArcDeg / 2) * (Math.PI / 180);
    pathEl.setAttribute("d", thumbArcPath(r, baseHalf));
  }

  /**
   * Raw accum can cross zero while the finger has not yet returned to the armed angle (spring lag, jitter).
   * Clamp the spring target to the overscroll side for the active peg so stretch never flips “through” the lock.
   * @param {number} accum
   */
  function slipSpringTargetRad(accum) {
    if (!vb) return accum;
    const lo = vb.min;
    const hi = vb.max;
    if (state.value >= hi) return Math.max(0, accum);
    if (state.value <= lo) return Math.min(0, accum);
    return accum;
  }

  /**
   * Angular half-width for “on the home ray”: arc length ≈ SLIP_HOME_ARC_PX at finger radius (px).
   * @param {number} clientX
   * @param {number} clientY
   */
  function slipHomeJoinRad(clientX, clientY) {
    const p = pivotFor(clientX, clientY);
    const rPx = Math.hypot(clientX - p.x, clientY - p.y);
    const effR = Math.max(rPx, SLIP_HOME_R_MIN_PX);
    let theta = SLIP_HOME_ARC_PX / effR;
    if (theta < SLIP_HOME_RAD_MIN) theta = SLIP_HOME_RAD_MIN;
    if (theta > SLIP_HOME_RAD_MAX) theta = SLIP_HOME_RAD_MAX;
    return theta;
  }

  /**
   * Bounded slip: unlock when finger aligns with the **armed** slip ray (`slipThumbAngle` — fixed when
   * slip starts) and motion is opposite “past peg” or ~still. The drawn thumb may offset for overscroll
   * juice; unlock cone does not follow that offset so the threshold stays put on the ring.
   * @param {number} a — pointer angle (rad)
   * @param {number} d — shortest delta from last frame (rad)
   * @param {number} clientX
   * @param {number} clientY
   */
  function slipHomeUnlock(a, d, clientX, clientY) {
    if (!vb) return false;
    const lo = vb.min;
    const hi = vb.max;
    const join = slipHomeJoinRad(clientX, clientY);
    const align = slipThumbAngle;
    const ang = Math.abs(shortestAngleDiff(align, a));
    if (ang >= join) return false;
    /* Near the middle of the home cone, allow a slightly larger per-frame Δθ as “still” so one fast frame doesn’t miss unlock. */
    const stillSlop =
      ang < join * 0.5 ? Math.max(SLIP_HOME_STILL_RAD, (1.8 * Math.PI) / 180) : SLIP_HOME_STILL_RAD;
    const still = Math.abs(d) <= stillSlop;
    if (state.value >= hi) return d < 0 || still;
    if (state.value <= lo) return d > 0 || still;
    return false;
  }

  let pointerId = null;
  let startClientX = 0;
  let startClientY = 0;
  let pressPivotX = 0;
  let pressPivotY = 0;
  let pointerDownAt = 0;
  let lastPointerClientX = 0;
  let lastPointerClientY = 0;
  /** @type {number | null} */
  let activationDelayTimer = null;
  let activated = false;
  let lastAngle = 0;
  let lastT = 0;
  let arcCenterAngle = 0;

  function clearActivationDelayTimer() {
    if (activationDelayTimer != null) {
      clearTimeout(activationDelayTimer);
      activationDelayTimer = null;
    }
  }

  function completeEncoderActivation(clientX, clientY) {
    clearActivationDelayTimer();
    if (activated) return;
    clearTapAffordanceClassAndCleanupTimer();
    activated = true;
    slipActive = false;
    resetSlipSpring();
    restoreThumbPathDefault();
    const a = angleForPointer(clientX, clientY);
    lastAngle = a;
    arcCenterAngle = a;
    lastT = performance.now();
    view.setPressHaloVisible(false, { arcHandoff: true });
    view.setRadialVisible(true);
    view.applyRotations(a, arcCenterAngle);
    notifyEncoderActive(true);
  }

  function isPointerOverCard(clientX, clientY) {
    const r = card.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  /**
   * Track circle radius in CSS pixels (SVG viewBox width 200).
   */
  function trackRadiusScreenPx() {
    const svg = radialLayer.querySelector(".cs-radial-svg");
    let w = 0;
    if (svg) w = svg.getBoundingClientRect().width;
    if (!(w > 0)) w = Math.min(window.innerWidth * 0.85, 280);
    return cfg.trackRadius * (w / 200);
  }

  /**
   * @returns {{ pass: boolean; speed: number; cosInward: number | null; skip: 'slow' | 'centre' | null }}
   */
  function releaseDirectionDiagnosis(vx, vy, clientX, clientY, cr) {
    const speed = Math.hypot(vx, vy);
    if (speed < cfg.releaseDirectionMinSpeedPx) {
      return { pass: true, speed, cosInward: null, skip: "slow" };
    }
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + cr.height / 2;
    const rdx = cx - clientX;
    const rdy = cy - clientY;
    const rlen = Math.hypot(rdx, rdy);
    if (rlen < 2) {
      return { pass: true, speed, cosInward: null, skip: "centre" };
    }
    const cosInward = (vx * rdx + vy * rdy) / (speed * rlen);
    return {
      pass: cosInward >= cfg.releaseInwardCosMin,
      speed,
      cosInward,
      skip: null,
    };
  }

  /**
   * Single place for “release to pressed halo” logic (position on card + inward release direction).
   */
  function releaseGestureDiagnosis(clientX, clientY, vx, vy) {
    const cr = card.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + cr.height / 2;
    const d = Math.hypot(clientX - cx, clientY - cy);
    const rCardMax = Math.hypot(cr.width / 2, cr.height / 2);
    const rTrack = trackRadiusScreenPx();
    const cardSlopPx = 8;
    const nearCardMax = rCardMax + cardSlopPx;
    /** @type {'tooFar' | 'onRing' | null} */
    let posFail = null;
    if (d > nearCardMax) posFail = "tooFar";
    else if (rTrack > nearCardMax + 4 && d >= rTrack - 3) posFail = "onRing";
    const dir = releaseDirectionDiagnosis(vx, vy, clientX, clientY, cr);
    const release = posFail == null && dir.pass;
    return {
      release,
      d,
      rTrack,
      nearCardMax,
      posFail,
      dir,
      cosMin: cfg.releaseInwardCosMin,
      speedGate: cfg.releaseDirectionMinSpeedPx,
    };
  }

  /**
   * Pointer is over the value card again after activation — show press halo and wait for a new pull-out.
   */
  function releaseEncoderNearCard() {
    clearActivationDelayTimer();
    activated = false;
    if (bounded && slipActive) state.valueAcc = 0;
    slipActive = false;
    resetSlipSpring();
    restoreThumbPathDefault();
    lastAngle = 0;
    lastT = performance.now();
    arcCenterAngle = 0;
    pointerDownAt = performance.now();
    view.setRadialVisible(false);
    view.setPressHaloVisible(true);
    notifyEncoderActive(false);
  }

  function pivotFor(clientX, clientY) {
    if (cfg.rotationOrigin === "initialPress") {
      return { x: pressPivotX, y: pressPivotY };
    }
    const cr = card.getBoundingClientRect();
    const c = rectCenter(cr);
    return { x: c.x, y: c.y };
  }

  function angleForPointer(clientX, clientY) {
    const p = pivotFor(clientX, clientY);
    return angleAt(p.x, p.y, clientX, clientY);
  }

  /** Card-centre mode: wait until the pointer has left the card before arming, so the first angle uses a stable ray. */
  function activationSatisfied(clientX, clientY) {
    if (distanceFromStart(clientX, clientY) < cfg.activationRadiusPx) return false;
    if (cfg.rotationOrigin !== "cardCenter" || !cfg.requireOutsideCardToActivate) return true;
    return !isPointerOverCard(clientX, clientY);
  }

  function distanceFromStart(clientX, clientY) {
    const dx = clientX - startClientX;
    const dy = clientY - startClientY;
    return Math.hypot(dx, dy);
  }

  /**
   * Ease step rate from low (just past activation) to full as the finger moves farther out.
   * @param {number} clientX
   * @param {number} clientY
   */
  function sensitivityRampFactor(clientX, clientY) {
    const span = cfg.sensitivityRampSpanPx;
    if (span <= 0) return 1;
    const lo = Math.min(Math.max(cfg.sensitivityRampMin, 0), 1);
    if (lo >= 1) return 1;
    const d = distanceFromStart(clientX, clientY);
    const linearT = (d - cfg.activationRadiusPx) / span;
    const u = smoothstep01(linearT);
    return lo + (1 - lo) * u;
  }

  function deadzoneRad() {
    return (cfg.maskDeadzoneDeg * Math.PI) / 180;
  }

  function updateArcCenterTowardThumb(thumbAngle) {
    const dz = deadzoneRad();
    const sep = shortestAngleDiff(arcCenterAngle, thumbAngle);
    if (Math.abs(sep) > dz) {
      arcCenterAngle = thumbAngle - Math.sign(sep) * dz;
    }
  }

  /**
   * Capture on document so pointermove reaches us on iOS/WebKit even when capture/target quirks
   * would skip window bubble; object identity must match add/remove.
   */
  const gesturePeOpts = { passive: false, capture: true };

  let gestureActive = false;

  function removeDocumentGestureListeners() {
    document.removeEventListener("pointermove", onDocumentPointerMove, gesturePeOpts);
    document.removeEventListener("pointerup", onDocumentPointerEnd, gesturePeOpts);
    document.removeEventListener("pointercancel", onDocumentPointerEnd, gesturePeOpts);
  }

  function clearRadialReleaseOutShell() {
    radialLayer.classList.remove("cs-radial-layer--release-out");
  }

  let encoderActiveNotified = false;
  function notifyEncoderActive(next) {
    if (next === encoderActiveNotified) return;
    encoderActiveNotified = next;
    if (typeof onEncoderActiveChange === "function") onEncoderActiveChange(next);
  }

  function interruptReleaseStretchSpring() {
    clearTapRadialHint();
    if (releaseStretchRaf) {
      cancelAnimationFrame(releaseStretchRaf);
      releaseStretchRaf = 0;
      releaseStretchRunId++;
    }
    clearRadialReleaseOutShell();
    resetSlipSpring();
    if (bounded) restoreThumbPathDefault();
    view.setRadialVisible(false);
    notifyEncoderActive(false);
  }

  /**
   * @param {{ immediate?: boolean } | undefined} opt — immediate: skip post-release stretch (e.g. detach)
   */
  /**
   * @param {number} [valueAtEnd] — value at pointer-up; required when release spring defers this callback
   *   so a later gesture cannot overwrite `state.value` before `onRadialRelease` runs.
   */
  function notifyRadialRelease(valueAtEnd) {
    if (typeof onRadialRelease !== "function") return;
    const v = valueAtEnd !== undefined ? valueAtEnd : state.value;
    onRadialRelease(v);
  }

  function teardownPointer(opt) {
    if (!gestureActive) return;
    const immediate = !!(opt && opt.immediate);
    const hadEncoder = activated;
    /** Snapshot before any deferred rAF (release spring); avoids stale reads if user starts a new gesture. */
    const valueAtPointerEnd = state.value;

    const hadSlipAcc = bounded && slipActive;
    const stretchMag = Math.abs(slipStretchDrawSmoothed);
    const prefersReduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const useReleaseSpring =
      !immediate &&
      bounded &&
      activated &&
      (hadSlipAcc || stretchMag > SLIP_RELEASE_STRETCH_EPS) &&
      !prefersReduced;

    gestureActive = false;
    clearActivationDelayTimer();
    removeDocumentGestureListeners();
    const pid = pointerId;
    pointerId = null;
    activated = false;
    /* Encoder must stay “active” until onRadialRelease runs — otherwise deferred release (stretch
     * spring) lets fry sim resume and overwrite the value card before the consumer applies the final value. */
    if (hadSlipAcc) state.valueAcc = 0;
    slipActive = false;

    card.classList.remove("cs-value-card--active");
    view.unlockPageScroll();
    if (hadEncoder) {
      clearTapAffordanceClassAndCleanupTimer();
    }
    view.setPressHaloVisible(false);

    if (pid != null) {
      try {
        card.releasePointerCapture(pid);
      } catch (_) {
        /* ignore */
      }
    }

    if (useReleaseSpring) {
      const thumbAngle = lastThumbAngleForReleaseSpring;
      const runId = releaseStretchRunId;
      /* Fade opacity while keeping --visible so WebKit/Android still repaints thumb `d` (see .cs-radial-layer--release-out). */
      radialLayer.classList.add("cs-radial-layer--release-out");
      let prevTick = 0;
      function tickReleaseStretch(ts) {
        if (runId !== releaseStretchRunId) return;
        const dtSec =
          prevTick > 0
            ? Math.min(Math.max((ts - prevTick) / 1000, 0.001), 0.055)
            : 1 / 60;
        prevTick = ts;
        const k = 1 - Math.exp(-dtSec / SLIP_RELEASE_SPRING_TAU_S);
        slipStretchDrawSmoothed += (0 - slipStretchDrawSmoothed) * Math.max(k, 0.32);
        if (bounded) {
          const pathEl = radialLayer.querySelector("[data-thumb-path]");
          if (pathEl) {
            const r = cfg.trackRadius;
            const baseHalf = (cfg.thumbArcDeg / 2) * (Math.PI / 180);
            pathEl.setAttribute("d", thumbArcPathDirectedStretch(r, baseHalf, slipStretchDrawSmoothed));
          }
        }
        updateArcCenterTowardThumb(thumbAngle);
        view.applyRotations(thumbAngle, arcCenterAngle);

        if (Math.abs(slipStretchDrawSmoothed) < SLIP_RELEASE_STRETCH_EPS) {
          slipStretchDrawSmoothed = 0;
          resetSlipSpring();
          if (bounded) restoreThumbPathDefault();
          clearRadialReleaseOutShell();
          if (hadEncoder) notifyRadialRelease(valueAtPointerEnd);
          notifyEncoderActive(false);
          view.setRadialVisible(false);
          releaseStretchRaf = 0;
          return;
        }
        releaseStretchRaf = requestAnimationFrame(tickReleaseStretch);
      }
      releaseStretchRaf = requestAnimationFrame(tickReleaseStretch);
    } else {
      resetSlipSpring();
      restoreThumbPathDefault();
      if (hadEncoder) notifyRadialRelease(valueAtPointerEnd);
      notifyEncoderActive(false);
      view.setRadialVisible(false);
      if (!hadEncoder && !immediate) {
        scheduleTapRadialHint();
      }
    }
  }

  function onPointerDown(ev) {
    if (ev.pointerType !== "touch" && ev.button != null && ev.button !== 0) return;
    if (gestureActive) return;
    /* Always clear release-out / rAF even when rAF id is 0 (stuck class from interrupted spring). */
    interruptReleaseStretchSpring();
    gestureActive = true;
    pointerId = ev.pointerId;
    const pid = ev.pointerId;
    startClientX = ev.clientX;
    startClientY = ev.clientY;
    pressPivotX = ev.clientX;
    pressPivotY = ev.clientY;
    pointerDownAt = performance.now();
    lastPointerClientX = ev.clientX;
    lastPointerClientY = ev.clientY;
    clearActivationDelayTimer();
    activated = false;
    slipActive = false;
    resetSlipSpring();
    restoreThumbPathDefault();
    lastAngle = 0;
    lastT = performance.now();
    arcCenterAngle = 0;
    card.classList.add("cs-value-card--active");
    view.setPressHaloVisible(true);
    document.addEventListener("pointermove", onDocumentPointerMove, gesturePeOpts);
    document.addEventListener("pointerup", onDocumentPointerEnd, gesturePeOpts);
    document.addEventListener("pointercancel", onDocumentPointerEnd, gesturePeOpts);
    try {
      card.setPointerCapture(ev.pointerId);
    } catch (_) {
      /* iOS: capture can fail; window listeners still receive the gesture */
    }
    /*
     * Mutating html/body (overflow/touch-action) in the same turn as setPointerCapture can drop
     * capture and fire lostpointercapture → teardown before the halo paints. Defer scroll lock.
     */
    requestAnimationFrame(function () {
      if (gestureActive && pointerId === pid) {
        view.lockPageScroll();
      }
    });
  }

  function onDocumentPointerMove(ev) {
    if (!gestureActive || ev.pointerId !== pointerId) return;
    ev.preventDefault();

    const vx = ev.clientX - lastPointerClientX;
    const vy = ev.clientY - lastPointerClientY;
    lastPointerClientX = ev.clientX;
    lastPointerClientY = ev.clientY;

    if (!activated) {
      if (activationSatisfied(lastPointerClientX, lastPointerClientY)) {
        const elapsed = performance.now() - pointerDownAt;
        const wait = Math.max(0, MIN_PRESS_HALO_MS - elapsed);
        if (wait === 0) {
          completeEncoderActivation(lastPointerClientX, lastPointerClientY);
        } else if (activationDelayTimer == null) {
          activationDelayTimer = setTimeout(function () {
            activationDelayTimer = null;
            if (!gestureActive || pointerId == null) return;
            if (activated) return;
            if (!activationSatisfied(lastPointerClientX, lastPointerClientY)) return;
            completeEncoderActivation(lastPointerClientX, lastPointerClientY);
          }, wait);
        }
      } else {
        clearActivationDelayTimer();
      }
      return;
    }

    const releaseDiag = releaseGestureDiagnosis(lastPointerClientX, lastPointerClientY, vx, vy);
    if (releaseDiag.release) {
      releaseEncoderNearCard();
      return;
    }

    const now = performance.now();
    const dt = Math.max(now - lastT, 1e-4);
    const a = angleForPointer(ev.clientX, ev.clientY);
    const d = shortestAngleDiff(lastAngle, a);
    const omegaAbs = Math.abs(d) / dt;
    lastAngle = a;
    lastT = now;

    let mult = velocityMultiplier(omegaAbs, cfg);
    if (cfg.velocityBoostMinOmegaRadPerMs > 0 && omegaAbs < cfg.velocityBoostMinOmegaRadPerMs) {
      mult = 1;
    }

    const minOmega = cfg.minOmegaRadPerMs;
    const allowValue = minOmega <= 0 || omegaAbs >= minOmega;

    let dValue = d;
    const minADeg = cfg.minAngleDeltaDeg;
    if (minADeg > 0 && Math.abs(d) < (minADeg * Math.PI) / 180) {
      dValue = 0;
    }

    /** Still pushing past a pegged bound (even sub-step / sub-ω)—do not angular-rejoin yet. */
    let pastMin = false;
    let pastMax = false;
    if (bounded && vb) {
      const lo = vb.min;
      const hi = vb.max;
      pastMin = state.value <= lo && (dValue < 0 || (dValue === 0 && d < 0));
      pastMax = state.value >= hi && (dValue > 0 || (dValue === 0 && d > 0));
    }
    if (allowValue && dValue !== 0) {
      const ramp = sensitivityRampFactor(ev.clientX, ev.clientY);
      state.valueAcc += (dValue * mult * ramp) / effectiveRadPerStep;
      const steps = Math.trunc(state.valueAcc);
      if (steps !== 0) {
        state.valueAcc -= steps;
        if (bounded && vb) {
          const lo = vb.min;
          const hi = vb.max;
          const prev = state.value;
          const next = prev + steps;
          const clamped = Math.max(lo, Math.min(hi, next));
          const applied = clamped - prev;
          state.value = clamped;
          state.valueAcc += steps - applied;
          /* Slip only when already on an edge and scrubbing further past it—not when approaching the edge from inside. */
          if ((prev >= hi && steps > 0) || (prev <= lo && steps < 0)) {
            if (!slipActive) armSlipAnchor(a);
            slipActive = true;
          }
          /* Leaving the edge (e.g. 100 → 99) must release slip before thumbRender is chosen this frame. */
          if (slipActive) {
            if (state.value > lo && state.value < hi) {
              endSlipGesture();
            } else if (prev >= hi && applied < 0) {
              endSlipGesture();
            } else if (prev <= lo && applied > 0) {
              endSlipGesture();
            }
          }
          if (applied !== 0) syncDisplay();
        } else {
          state.value += steps;
          syncDisplay();
        }
      }
    }

    /*
     * Arm slip only when not already slipped (before physics) so the first peg frame still runs overscroll.
     * Unlock uses fixed `slipThumbAngle` vs finger — see slipHomeUnlock.
     */
    if (bounded && vb && activated && (pastMin || pastMax)) {
      if (!slipActive && !slipHomeUnlock(a, d, ev.clientX, ev.clientY)) {
        armSlipAnchor(a);
        slipActive = true;
      }
    }

    let slipThumbDrawRad = a;
    let slipStretchRadOut = 0;
    if (bounded && slipActive) {
      slipOverscrollAccum += d;
      const springTarget = slipSpringTargetRad(slipOverscrollAccum);
      const hudSpringPrev = slipPrevSpringTarget;
      let windDeeper = false;
      let returningToThreshold = false;
      if (vb) {
        const lo = vb.min;
        const hi = vb.max;
        if (state.value >= hi) {
          if (!slipWindEaseLatch) {
            if (springTarget > slipSpringPos + SLIP_WIND_EASE_ENTER_RAD) slipWindEaseLatch = true;
          } else if (springTarget < slipSpringPos - SLIP_WIND_EASE_EXIT_RAD) {
            slipWindEaseLatch = false;
          }
          windDeeper = slipWindEaseLatch;
          if (springTarget < hudSpringPrev - SLIP_RETURN_ENTER_RAD) slipReturnLatch = true;
          else if (springTarget > hudSpringPrev + SLIP_RETURN_EXIT_RAD) slipReturnLatch = false;
          returningToThreshold = slipReturnLatch;
        } else if (state.value <= lo) {
          if (!slipWindEaseLatch) {
            if (springTarget < slipSpringPos - SLIP_WIND_EASE_ENTER_RAD) slipWindEaseLatch = true;
          } else if (springTarget > slipSpringPos + SLIP_WIND_EASE_EXIT_RAD) {
            slipWindEaseLatch = false;
          }
          windDeeper = slipWindEaseLatch;
          if (springTarget > hudSpringPrev + SLIP_RETURN_ENTER_RAD) slipReturnLatch = true;
          else if (springTarget < hudSpringPrev - SLIP_RETURN_EXIT_RAD) slipReturnLatch = false;
          returningToThreshold = slipReturnLatch;
        }
      }
      slipPrevSpringTarget = springTarget;
      const dtSecSlip = Math.min(Math.max(dt / 1000, 0), 0.05);
      if (windDeeper) {
        const alpha = Math.max(1 - Math.exp(-dtSecSlip / 0.055), 0.12);
        slipSpringPos += (springTarget - slipSpringPos) * alpha;
      } else {
        slipSpringPos = springTarget;
      }
      const moveScale = 0.24;
      const stretchScale = 0.2;
      const visSpring = slipVisualOvershoot(slipSpringPos, moveScale, stretchScale);
      let sVis = springTarget;
      let visArmTarget = 1;
      if (vb) {
        const alphaArm = Math.max(
          1 - Math.exp(-dtSecSlip / Math.max(SLIP_VIS_ARM_SMOOTH_TAU_S, 1e-4)),
          0.07
        );
        if (returningToThreshold) {
          const angFromArm = Math.abs(shortestAngleDiff(slipThumbAngle, a));
          const denom = Math.max(SLIP_VIS_ARM_BLEND_RAD, 1e-6);
          const t = Math.min(1, angFromArm / denom);
          visArmTarget = t * t;
        } else {
          visArmTarget = 1;
        }
        slipVisArmFactorSmoothed += (visArmTarget - slipVisArmFactorSmoothed) * alphaArm;
        sVis = springTarget * slipVisArmFactorSmoothed;
      }
      const visTruth = slipVisualOvershoot(sVis, moveScale, stretchScale);
      const moveRad = visTruth.moveRad;
      /* Unwind: truth stretch only. Wind-in while easing: blend — but not while returningToThreshold. */
      if (windDeeper && !returningToThreshold) {
        const axGate = Math.abs(springTarget);
        const gateT = SLIP_GATE_BLEND_RAD > 1e-9 ? axGate / SLIP_GATE_BLEND_RAD : 1;
        const truthW = smoothstep01(Math.max(0, Math.min(1, 1 - gateT)));
        slipStretchRadOut =
          visSpring.stretchRad * (1 - truthW) + visTruth.stretchRad * truthW;
      } else {
        slipStretchRadOut = visTruth.stretchRad;
      }
      {
        const baseHalfCap = (cfg.thumbArcDeg / 2) * (Math.PI / 180);
        const stretchAbsMax = Math.max(0, SLIP_STRETCH_PATH_SPAN_MAX_RAD - 2 * baseHalfCap);
        if (stretchAbsMax > 0) {
          slipStretchRadOut = Math.max(-stretchAbsMax, Math.min(stretchAbsMax, slipStretchRadOut));
        }
      }
      const alphaStDraw = Math.max(
        1 - Math.exp(-dtSecSlip / Math.max(SLIP_STRETCH_DRAW_TAU_S, 1e-4)),
        0.14
      );
      if (Math.abs(slipStretchRadOut - slipStretchDrawSmoothed) > 0.4) {
        slipStretchDrawSmoothed = slipStretchRadOut;
      } else {
        slipStretchDrawSmoothed += (slipStretchRadOut - slipStretchDrawSmoothed) * alphaStDraw;
      }
      slipThumbDrawRad = Math.atan2(
        Math.sin(slipThumbAngle + moveRad),
        Math.cos(slipThumbAngle + moveRad)
      );
    }

    /*
     * Integer steps can lag behind the finger at the bound (fractional acc), and min-ω / deadzone can skip
     * the whole value block—still treat "past min/max" as slip so the thumb freezes while value stays pegged.
     */
    if (bounded && vb && activated) {
      if (pastMin || pastMax) {
        if (slipActive && slipHomeUnlock(a, d, ev.clientX, ev.clientY)) {
          endSlipGesture();
        }
      } else if (slipActive && slipHomeUnlock(a, d, ev.clientX, ev.clientY)) {
        endSlipGesture();
      }
    }

    let thumbRender;
    if (bounded && slipActive) {
      thumbRender = slipThumbDrawRad;
      const pathEl = radialLayer.querySelector("[data-thumb-path]");
      if (pathEl) {
        const r = cfg.trackRadius;
        const baseHalf = (cfg.thumbArcDeg / 2) * (Math.PI / 180);
        pathEl.setAttribute("d", thumbArcPathDirectedStretch(r, baseHalf, slipStretchDrawSmoothed));
      }
    } else {
      thumbRender = a;
      if (bounded) {
        resetSlipSpring();
        restoreThumbPathDefault();
      }
    }
    updateArcCenterTowardThumb(thumbRender);
    view.applyRotations(thumbRender, arcCenterAngle);
    if (activated) lastThumbAngleForReleaseSpring = thumbRender;
  }

  function onDocumentPointerEnd(ev) {
    if (!gestureActive || ev.pointerId !== pointerId) return;
    teardownPointer();
  }

  function onLostCapture(ev) {
    if (!gestureActive || ev.pointerId !== pointerId) return;
    /*
     * Touch: capture is unreliable; changing scroll lock on html can fire spurious lostpointercapture
     * while window-level pointer listeners still receive the gesture. Teardown here nukes the halo
     * and breaks the encoder on some Android / iOS builds.
     */
    if (ev.pointerType === "touch") return;
    teardownPointer();
  }

  const touchHaloOpts = { passive: true };
  function onCardTouchStart(ev) {
    if (!pressHalo || ev.touches.length !== 1) return;
    view.setPressHaloVisible(true);
  }
  function onCardTouchEnd() {
    if (!gestureActive) view.setPressHaloVisible(false);
  }
  function onCardTouchCancel() {
    if (!gestureActive) view.setPressHaloVisible(false);
  }
  card.addEventListener("touchstart", onCardTouchStart, touchHaloOpts);
  card.addEventListener("touchend", onCardTouchEnd, touchHaloOpts);
  card.addEventListener("touchcancel", onCardTouchCancel, touchHaloOpts);

  const peCaptureOpts = { passive: false, capture: true };
  card.addEventListener("pointerdown", onPointerDown, peCaptureOpts);
  card.addEventListener("lostpointercapture", onLostCapture);

  return {
    detach: function () {
      interruptReleaseStretchSpring();
      teardownPointer({ immediate: true });
      card.removeEventListener("pointerdown", onPointerDown, peCaptureOpts);
      card.removeEventListener("lostpointercapture", onLostCapture);
      card.removeEventListener("touchstart", onCardTouchStart, touchHaloOpts);
      card.removeEventListener("touchend", onCardTouchEnd, touchHaloOpts);
      card.removeEventListener("touchcancel", onCardTouchCancel, touchHaloOpts);
    },
  };
}
