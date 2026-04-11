/**
 * Circle slider — radial value control (see README.md in this folder).
 *
 * Architecture:
 * - **View** (`createRadialSliderView`) — SVG thumb/track transforms, radial + halo visibility, scroll lock.
 * - **Value state** — integer + fractional carry; lives in `initCircleSlider` and is passed into behaviors.
 * - **Behavior** — pointer/gesture strategy. Default: **`velocityUnbounded`** (encoder: cumulative angle
 *   delta × velocity, unbounded integer). Swap via `initCircleSlider(root, cfg, { behavior: "…" })`;
 *   register new ids on `window.__CIRCLE_SLIDER_BEHAVIORS__` (e.g. absolute angle → bounded value later).
 *
 * Mutable config + optional localStorage; tweak panel at bottom of page.
 */

(function () {
  "use strict";

  /** @type {const} */
  const TAU = Math.PI * 2;

  /** Touch often arms the encoder on the first move; keep the press halo visible at least this long so it reads on mobile. */
  const MIN_PRESS_HALO_MS = 220;

  const STORAGE_KEY = "dwarph.io.experiments.circleSlider.config.v1";

  /**
   * @typedef {'cardCenter' | 'initialPress'} RotationOrigin
   */

  /**
   * @typedef {object} CircleSliderConfig
   * @property {number} initialValue
   * @property {number} activationRadiusPx
   * @property {RotationOrigin} rotationOrigin — card centre: centre→pointer angle; initial press: pivot at down position
   * @property {boolean} requireOutsideCardToActivate — card-centre mode only; if true, encoder arms only after the pointer leaves the card bounds (avoids atan2 flip when dragging across the middle on-card)
   * @property {number} maskDeadzoneDeg
   * @property {number} radPerStep — higher = less sensitive (more rad per integer step)
   * @property {number} sensitivityRampMin — 0–1, step scale right at activation (lower = gentler pull-out)
   * @property {number} sensitivityRampSpanPx — 0 = off; else distance from press (beyond activation) to ease rampMin → 1
   * @property {number} velocityOmegaRefRadPerMs
   * @property {number} velocityGainK
   * @property {number} velocityGainMaxExtra
   * @property {number} velocityBoostMinOmegaRadPerMs — 0 = always use velocity curve; else below this ω use mult=1
   * @property {number} minOmegaRadPerMs — 0 = off; below this angular speed, no value change
   * @property {number} minAngleDeltaDeg — 0 = off; ignore smaller per-frame |Δθ| (jitter)
   * @property {number} appearDurationMs
   * @property {number} hideDurationMs
   * @property {number} blurAppearPx
   * @property {number} blurHidePx
   * @property {number} thumbArcDeg
   * @property {number} trackRadius
   * @property {number} trackStrokeWidth — SVG grey arc stroke
   * @property {number} thumbStrokeWidth — SVG black thumb stroke
   * @property {number} releaseInwardCosMin — min cos(angle) between frame velocity and inward radial when releasing to pressed halo (0–1); tangential orbit ≈0
   * @property {number} releaseDirectionMinSpeedPx — below this pointer speed (px/frame), skip direction gate when releasing to halo
   */

  /** @type {CircleSliderConfig} */
  const DEFAULT_CONFIG = {
    initialValue: 114,
    activationRadiusPx: 10,
    rotationOrigin: "cardCenter",
    requireOutsideCardToActivate: true,
    maskDeadzoneDeg: 15,
    radPerStep: 0.14,
    sensitivityRampMin: 0.22,
    sensitivityRampSpanPx: 52,
    velocityOmegaRefRadPerMs: 0.0035,
    velocityGainK: 2.25,
    velocityGainMaxExtra: 5,
    velocityBoostMinOmegaRadPerMs: 0,
    minOmegaRadPerMs: 0,
    minAngleDeltaDeg: 0,
    appearDurationMs: 300,
    hideDurationMs: 300,
    blurAppearPx: 14,
    blurHidePx: 14,
    thumbArcDeg: 16,
    trackRadius: 78,
    trackStrokeWidth: 3,
    thumbStrokeWidth: 7,
    releaseInwardCosMin: 0.94,
    releaseDirectionMinSpeedPx: 2.2,
  };

  /** @type {string[]} */
  const VISUAL_CONFIG_KEYS = [
    "trackRadius",
    "thumbArcDeg",
    "trackStrokeWidth",
    "thumbStrokeWidth",
    "appearDurationMs",
    "hideDurationMs",
    "blurAppearPx",
    "blurHidePx",
  ];

  /**
   * @returns {Partial<CircleSliderConfig> | null}
   */
  function loadStoredConfig() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (!s) return null;
      const o = JSON.parse(s);
      return o && typeof o === "object" ? o : null;
    } catch {
      return null;
    }
  }

  /**
   * @param {CircleSliderConfig} cfg
   */
  function saveStoredConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
      /* quota / private mode */
    }
  }

  let saveTimer = null;
  /**
   * @param {CircleSliderConfig} cfg
   */
  function scheduleSaveConfig(cfg) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      saveStoredConfig(cfg);
    }, 400);
  }

  /**
   * @param {number} t
   */
  function smoothstep01(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  }

  function shortestAngleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  /**
   * @param {number} omegaAbs
   * @param {CircleSliderConfig} cfg
   */
  function velocityMultiplier(omegaAbs, cfg) {
    const ref = cfg.velocityOmegaRefRadPerMs;
    const x = ref > 0 ? omegaAbs / ref : 0;
    const extra = Math.min(x * cfg.velocityGainK, cfg.velocityGainMaxExtra);
    return 1 + extra;
  }

  /**
   * @param {DOMRect} rect
   */
  function rectCenter(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  /**
   * @param {number} cx
   * @param {number} cy
   * @param {number} x
   * @param {number} y
   */
  function angleAt(cx, cy, x, y) {
    return Math.atan2(y - cy, x - cx);
  }

  const TRACK_ARC_BISECTOR_RAD = Math.PI / 2 + Math.PI;

  /**
   * @param {number} r
   */
  function trackArcPath(r) {
    const x0 = r * Math.cos(Math.PI);
    const y0 = r * Math.sin(Math.PI);
    const x1 = r;
    const y1 = 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`;
  }

  /**
   * @param {number} r
   * @param {number} halfSpanRad
   */
  function thumbArcPath(r, halfSpanRad) {
    const a0 = -halfSpanRad;
    const a1 = halfSpanRad;
    const x0 = r * Math.cos(a0);
    const y0 = r * Math.sin(a0);
    const x1 = r * Math.cos(a1);
    const y1 = r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  }

  /**
   * Same arc topology as thumbArcPath, but extends only on one end by stretchRad (+ = longer toward +θ).
   */
  function thumbArcPathDirectedStretch(r, baseHalfRad, stretchRad) {
    let a0 = -baseHalfRad;
    let a1 = baseHalfRad;
    if (stretchRad > 0) {
      a1 += stretchRad;
    } else if (stretchRad < 0) {
      a0 += stretchRad;
    }
    const x0 = r * Math.cos(a0);
    const y0 = r * Math.sin(a0);
    const x1 = r * Math.cos(a1);
    const y1 = r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  }

  /**
   * @param {HTMLElement} root
   * @param {CircleSliderConfig} cfg
   */
  function applyVisualConfig(root, cfg) {
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

    const pressHalo = root.querySelector("[data-cs-press-halo]");
    if (pressHalo) {
      const blurPx = `${Math.max(cfg.blurAppearPx, cfg.blurHidePx)}px`;
      pressHalo.style.setProperty("--cs-halo-appear-ms", `${cfg.appearDurationMs}ms`);
      pressHalo.style.setProperty("--cs-halo-hide-ms", `${cfg.hideDurationMs}ms`);
      pressHalo.style.setProperty("--cs-halo-blur-rest", blurPx);
      /* SVG viewBox 200×200; track circle radius r → diameter fraction 2r/200 */
      pressHalo.style.setProperty("--cs-halo-diameter-fr", String((2 * cfg.trackRadius) / 200));
    }
  }

  /**
   * @typedef {object} RadialSliderValueState
   * @property {number} value
   * @property {number} valueAcc
   */

  /**
   * @typedef {object} RadialSliderView
   * @property {(thumbAngleRad: number, arcCenterAngleRad: number) => void} applyRotations
   * @property {(on: boolean) => void} setRadialVisible
   * @property {(on: boolean, options?: { arcHandoff?: boolean }) => void} setPressHaloVisible
   * @property {() => void} lockPageScroll
   * @property {() => void} unlockPageScroll
   */

  /**
   * @typedef {object} RadialSliderBehaviorContext
   * @property {CircleSliderConfig} cfg
   * @property {HTMLElement} root
   * @property {HTMLElement} card
   * @property {HTMLElement} radialLayer
   * @property {HTMLElement | null} pressHalo
   * @property {RadialSliderView} view
   * @property {() => void} syncDisplay
   * @property {{ min: number; max: number } | null | undefined} valueBounds
   */

  /**
   * @typedef {object} RadialSliderBehaviorHandle
   * @property {() => void} detach
   */

  /**
   * @typedef {{ behavior?: string }} CircleSliderInitOptions
   */

  /**
   * @param {{ radialLayer: HTMLElement; pressHalo: HTMLElement | null; thumbRot: SVGGElement; trackRot: SVGGElement }} deps
   * @returns {RadialSliderView}
   */
  function createRadialSliderView(deps) {
    const { radialLayer, pressHalo, thumbRot, trackRot } = deps;
    let scrollLocked = false;
    let lockedScrollY = 0;

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

  /**
   * Velocity-scaled cumulative rotation → unbounded integer (original experiment behaviour).
   *
   * @param {RadialSliderBehaviorContext} ctx
   * @param {RadialSliderValueState} state
   * @returns {RadialSliderBehaviorHandle}
   */
  function attachVelocityUnboundedRadialBehavior(ctx, state) {
    const { cfg, card, radialLayer, pressHalo, view, syncDisplay } = ctx;
    const vb = ctx.valueBounds;
    const bounded = !!(vb && Number.isFinite(vb.min) && Number.isFinite(vb.max));
    /** ~px along finger arc → rad at current radius; tight feel, clamped when r is tiny or huge. */
    const SLIP_HOME_ARC_PX = 4;
    const SLIP_HOME_R_MIN_PX = 14;
    const SLIP_HOME_RAD_MAX = (14 * Math.PI) / 180;
    /** Treat per-frame angular delta this small as “still” for unlock (rad). */
    const SLIP_HOME_STILL_RAD = (0.45 * Math.PI) / 180;
    let slipActive = false;
    let slipThumbAngle = 0;
    /** Overscroll: integrated finger delta (rad) since slip arm—unbounded so multi-turn scrub stays pegged. */
    let slipOverscrollAccum = 0;
    /** Smoothed display offset toward the peg-clamped target (avoids negative spring at max / positive at min → reversed stretch). */
    let slipSpringPos = 0;

    function resetSlipSpring() {
      slipOverscrollAccum = 0;
      slipSpringPos = 0;
    }

    function armSlipAnchor(angle) {
      slipThumbAngle = angle;
      resetSlipSpring();
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
     * ~linear when |raw| ≪ scale, then marginal gain falls like 1/(scale+|raw|) — no hard cap on output.
     */
    function perceptualOvershootRad(raw, scale) {
      if (!(scale > 0)) return 0;
      const ax = Math.abs(raw);
      return Math.sign(raw) * scale * Math.log(1 + ax / scale);
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
      if (theta > SLIP_HOME_RAD_MAX) theta = SLIP_HOME_RAD_MAX;
      return theta;
    }

    /**
     * Bounded slip: unlock when finger is on the armed ray (B1) and motion is opposite “past peg” or ~still (C).
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
      if (Math.abs(shortestAngleDiff(slipThumbAngle, a)) >= join) return false;
      const still = Math.abs(d) <= SLIP_HOME_STILL_RAD;
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
     * Single place for “release to pressed halo” logic + numbers for optional debug HUD.
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

    /** @param {object} diag — from releaseGestureDiagnosis */
    function formatReleaseDebugText(diag) {
      const pos =
        diag.posFail == null
          ? "ok"
          : diag.posFail === "tooFar"
            ? "block: too far from card"
            : "block: on ring band";
      const dir = diag.dir;
      let dirLine = "";
      if (dir.skip === "slow") {
        dirLine =
          "direction: skip (speed < min)  sp=" +
          dir.speed.toFixed(2) +
          "  min=" +
          diag.speedGate.toFixed(2);
      } else if (dir.skip === "centre") {
        dirLine = "direction: skip (on centre)  sp=" + dir.speed.toFixed(2);
      } else {
        dirLine =
          "direction: cos=" +
          (dir.cosInward != null ? dir.cosInward.toFixed(3) : "?") +
          "  need ≥ " +
          diag.cosMin.toFixed(2) +
          "  " +
          (dir.pass ? "OK" : "no") +
          "  sp=" +
          dir.speed.toFixed(2);
      }
      return [
        "d=" + diag.d.toFixed(0) + "  card+r≤" + diag.nearCardMax.toFixed(0) + "  rTrack=" + diag.rTrack.toFixed(0),
        "position: " + pos,
        dirLine,
        "→ release=" + (diag.release ? "yes" : "no"),
      ].join("\n");
    }

    /**
     * Pointer is over the value card again after activation — show press halo and wait for a new pull-out.
     */
    function releaseEncoderNearCard() {
      clearActivationDelayTimer();
      activated = false;
      slipActive = false;
      resetSlipSpring();
      restoreThumbPathDefault();
      lastAngle = 0;
      lastT = performance.now();
      arcCenterAngle = 0;
      pointerDownAt = performance.now();
      view.setRadialVisible(false);
      view.setPressHaloVisible(true);
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

    function teardownPointer() {
      if (!gestureActive) return;
      gestureActive = false;
      clearActivationDelayTimer();
      removeDocumentGestureListeners();
      const pid = pointerId;
      pointerId = null;
      activated = false;
      slipActive = false;
      resetSlipSpring();
      restoreThumbPathDefault();
      card.classList.remove("cs-value-card--active");
      view.unlockPageScroll();
      view.setPressHaloVisible(false);
      view.setRadialVisible(false);
      const releaseDebugPre = document.getElementById("cs-release-debug");
      if (releaseDebugPre) releaseDebugPre.textContent = "";
      if (pid != null) {
        try {
          card.releasePointerCapture(pid);
        } catch (_) {
          /* ignore */
        }
      }
    }

    function onPointerDown(ev) {
      if (ev.pointerType !== "touch" && ev.button != null && ev.button !== 0) return;
      if (gestureActive) return;
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
      const debugPre = document.getElementById("cs-release-debug");
      const debugToggle = document.getElementById("cs-release-debug-toggle");
      if (debugPre && debugToggle && debugToggle.checked) {
        debugPre.textContent = formatReleaseDebugText(releaseDiag);
      }
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
        state.valueAcc += (dValue * mult * ramp) / cfg.radPerStep;
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
                slipActive = false;
                resetSlipSpring();
              } else if (prev >= hi && applied < 0) {
                slipActive = false;
                resetSlipSpring();
              } else if (prev <= lo && applied > 0) {
                slipActive = false;
                resetSlipSpring();
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
       * Integer steps can lag behind the finger at the bound (fractional acc), and min-ω / deadzone can skip
       * the whole value block—still treat "past min/max" as slip so the thumb freezes while value stays pegged.
       * Slip / unlock (bounded): arm while past peg; unlock on home ray + opposite-or-still (see slipHomeUnlock).
       * If home already allows unlock, do not arm—avoids same-frame unlock↔re-arm when motion is tiny.
       */
      if (bounded && vb && activated) {
        if (pastMin || pastMax) {
          if (slipActive && slipHomeUnlock(a, d, ev.clientX, ev.clientY)) {
            slipActive = false;
            resetSlipSpring();
            restoreThumbPathDefault();
          } else if (!slipHomeUnlock(a, d, ev.clientX, ev.clientY)) {
            if (!slipActive) armSlipAnchor(a);
            slipActive = true;
          }
        } else if (slipActive && slipHomeUnlock(a, d, ev.clientX, ev.clientY)) {
          /* Peg intent gone but still slipped (e.g. value pegged, finger retracing): release on home + dir. */
          slipActive = false;
          resetSlipSpring();
          restoreThumbPathDefault();
        }
      }

      /*
       * Past the peg: slipOverscrollAccum is unbounded (multi-turn scrub stays pegged). The spring
       * follows a peg-clamped target so stretch does not flip sign while the finger is still away from
       * the armed angle. Rotation + stretch use perceptualOvershootRad (marginal gain falls at large |x|).
       */
      let thumbRender;
      if (bounded && slipActive) {
        slipOverscrollAccum += d;
        const springTarget = slipSpringTargetRad(slipOverscrollAccum);
        const dtSec = Math.min(Math.max(dt / 1000, 0), 0.05);
        const tauSec = 0.055;
        const alpha = Math.max(1 - Math.exp(-dtSec / tauSec), 0.09);
        slipSpringPos += (springTarget - slipSpringPos) * alpha;

        const moveScale = 0.24;
        const stretchScale = 0.2;
        const moveRad = perceptualOvershootRad(slipSpringPos, moveScale);
        const stretchRad = perceptualOvershootRad(slipSpringPos, stretchScale) * 1.12;

        thumbRender = Math.atan2(
          Math.sin(slipThumbAngle + moveRad),
          Math.cos(slipThumbAngle + moveRad)
        );
        const pathEl = radialLayer.querySelector("[data-thumb-path]");
        if (pathEl) {
          const r = cfg.trackRadius;
          const baseHalf = (cfg.thumbArcDeg / 2) * (Math.PI / 180);
          pathEl.setAttribute("d", thumbArcPathDirectedStretch(r, baseHalf, stretchRad));
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
        teardownPointer();
        card.removeEventListener("pointerdown", onPointerDown, peCaptureOpts);
        card.removeEventListener("lostpointercapture", onLostCapture);
        card.removeEventListener("touchstart", onCardTouchStart, touchHaloOpts);
        card.removeEventListener("touchend", onCardTouchEnd, touchHaloOpts);
        card.removeEventListener("touchcancel", onCardTouchCancel, touchHaloOpts);
      },
    };
  }

  /**
   * @param {HTMLElement} root
   * @param {CircleSliderConfig} cfg
   * @param {CircleSliderInitOptions | undefined} options
   * @returns {{ resetValue: () => void; syncDisplay: () => void; getValue: () => number; setValue: (n: number) => void; detachBehavior?: () => void }}
   */
  function initCircleSlider(root, cfg, options) {
    const card = root.querySelector("[data-cs-card]");
    const valueEl = root.querySelector("[data-cs-value-display]");
    const radialLayer = root.querySelector("[data-cs-radial-layer]");
    const pressHalo = root.querySelector("[data-cs-press-halo]");
    const trackRot = root.querySelector("[data-track-rot]");
    const thumbRot = root.querySelector("[data-thumb-rot]");
    const trackPath = root.querySelector("[data-track-path]");
    const thumbPath = root.querySelector("[data-thumb-path]");

    if (!card || !valueEl || !radialLayer || !trackRot || !thumbRot || !trackPath || !thumbPath) {
      return {
        resetValue: function () {},
        syncDisplay: function () {},
        getValue: function () {
          return 0;
        },
        setValue: function () {},
      };
    }

    applyVisualConfig(root, cfg);

    const behaviorId =
      options && options.behavior && typeof options.behavior === "string"
        ? options.behavior
        : "velocityUnbounded";

    /** @type {RadialSliderBehaviorContext} */
    const behaviorCtx = {
      cfg,
      root,
      card: /** @type {HTMLElement} */ (card),
      radialLayer: /** @type {HTMLElement} */ (radialLayer),
      pressHalo: pressHalo instanceof HTMLElement ? pressHalo : null,
      view: /** @type {RadialSliderView} */ (/** @type {unknown} */ (null)),
      syncDisplay: /** @type {() => void} */ (/** @type {unknown} */ (null)),
    };
    if (behaviorId === "velocityBounded100") {
      behaviorCtx.valueBounds = { min: 0, max: 100 };
    }

    /** @type {RadialSliderValueState} */
    const state = {
      value: (function () {
        const iv = Math.round(cfg.initialValue);
        const b = behaviorCtx.valueBounds;
        if (b && Number.isFinite(b.min) && Number.isFinite(b.max)) {
          return Math.max(b.min, Math.min(b.max, iv));
        }
        return iv;
      })(),
      valueAcc: 0,
    };

    function syncDisplay() {
      valueEl.textContent = String(state.value);
      card.setAttribute("aria-valuenow", String(state.value));
      if (behaviorCtx.valueBounds) {
        card.setAttribute("aria-valuemin", String(behaviorCtx.valueBounds.min));
        card.setAttribute("aria-valuemax", String(behaviorCtx.valueBounds.max));
      } else {
        card.removeAttribute("aria-valuemin");
        card.removeAttribute("aria-valuemax");
      }
    }

    const view = createRadialSliderView({
      radialLayer: /** @type {HTMLElement} */ (radialLayer),
      pressHalo: pressHalo instanceof HTMLElement ? pressHalo : null,
      thumbRot,
      trackRot,
    });

    behaviorCtx.view = view;
    behaviorCtx.syncDisplay = syncDisplay;

    syncDisplay();

    const w = typeof window !== "undefined" ? window : undefined;
    const registry =
      w && w.__CIRCLE_SLIDER_BEHAVIORS__
        ? w.__CIRCLE_SLIDER_BEHAVIORS__
        : { velocityUnbounded: attachVelocityUnboundedRadialBehavior };
    const attachBehavior =
      typeof registry[behaviorId] === "function" ? registry[behaviorId] : attachVelocityUnboundedRadialBehavior;
    const behaviorHandle = attachBehavior(behaviorCtx, state);

    return {
      resetValue: function () {
        let iv = Math.round(cfg.initialValue);
        const b = behaviorCtx.valueBounds;
        if (b && Number.isFinite(b.min) && Number.isFinite(b.max)) {
          iv = Math.max(b.min, Math.min(b.max, iv));
        }
        state.value = iv;
        state.valueAcc = 0;
        syncDisplay();
      },
      syncDisplay: syncDisplay,
      getValue: function () {
        return state.value;
      },
      /**
       * @param {number} n
       */
      setValue: function (n) {
        const v = Math.round(Number(n));
        if (!Number.isFinite(v)) return;
        const b = behaviorCtx.valueBounds;
        state.value =
          b && Number.isFinite(b.min) && Number.isFinite(b.max) ? Math.max(b.min, Math.min(b.max, v)) : v;
        state.valueAcc = 0;
        syncDisplay();
      },
      detachBehavior: function () {
        if (behaviorHandle && typeof behaviorHandle.detach === "function") {
          behaviorHandle.detach();
        }
      },
    };
  }

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
   * @param {CircleSliderConfig} cfg
   * @param {HTMLElement} sliderRoot
   * @param {{ resetValue: () => void; getValue: () => number; setValue: (n: number) => void }} sliderApi
   * @param {HTMLElement | null | undefined} rangeRoot
   * @param {{ resetValue: () => void; getValue: () => number; setValue: (n: number) => void } | null | undefined} rangeApi
   */
  function initTweakPanel(panel, cfg, sliderRoot, sliderApi, rangeRoot, rangeApi) {
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

    const RELEASE_DEBUG_KEY = "dwarph.io.experiments.circleSlider.releaseDebug.v1";
    const releaseDebugToggle = panel.querySelector("#cs-release-debug-toggle");
    const releaseDebugPre = panel.querySelector("#cs-release-debug");
    if (releaseDebugToggle && releaseDebugPre) {
      function syncReleaseDebug() {
        const on = releaseDebugToggle.checked;
        releaseDebugPre.hidden = !on;
        if (!on) releaseDebugPre.textContent = "";
        try {
          localStorage.setItem(RELEASE_DEBUG_KEY, on ? "1" : "0");
        } catch {
          /* ignore */
        }
      }
      try {
        releaseDebugToggle.checked = localStorage.getItem(RELEASE_DEBUG_KEY) === "1";
      } catch {
        /* ignore */
      }
      syncReleaseDebug();
      releaseDebugToggle.addEventListener("change", syncReleaseDebug);
    }

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
      cfg[/** @type {keyof CircleSliderConfig} */ (key)] = num;
    }

    function refreshOutputs() {
      panel.querySelectorAll("[data-cs-tweak-out]").forEach(function (span) {
        const key = span.getAttribute("data-cs-tweak-out");
        if (!key) return;
        const v = cfg[/** @type {keyof CircleSliderConfig} */ (key)];
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
        const v = cfg[/** @type {keyof CircleSliderConfig} */ (key)];
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
          const cur = cfg[/** @type {keyof CircleSliderConfig} */ (key)];
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

  const MODE_STORAGE_KEY = "dwarph.io.experiments.circleSlider.uiMode.v1";

  /**
   * @param {{ getValue: () => number; setValue: (n: number) => void }} standardApi
   * @param {{ getValue: () => number; setValue: (n: number) => void } | null | undefined} rangeApi
   */
  function initModePicker(standardApi, rangeApi) {
    const demo = document.getElementById("cs-demo");
    const buttons = document.querySelectorAll("[data-cs-pick]");
    const panels = document.querySelectorAll("[data-cs-mode-panel]");

    if (!buttons.length || !panels.length) return;

    /**
     * @param {"standard" | "range"} mode
     */
    function setMode(mode) {
      const m = mode === "range" ? "range" : "standard";
      buttons.forEach(function (btn) {
        const on = btn.getAttribute("data-cs-pick") === m;
        btn.classList.toggle("cs-picker-row--active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        const id = p.getAttribute("data-cs-mode-panel");
        if (!id) return;
        p.hidden = id !== m;
      });
      if (m === "range" && rangeApi) {
        rangeApi.setValue(Math.max(0, Math.min(100, standardApi.getValue())));
      }
      if (m === "standard" && rangeApi) {
        standardApi.setValue(rangeApi.getValue());
      }
      try {
        localStorage.setItem(MODE_STORAGE_KEY, m);
      } catch (_) {
        /* ignore */
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const pick = btn.getAttribute("data-cs-pick");
        if (pick !== "standard" && pick !== "range") return;
        setMode(pick);
        if (demo) {
          demo.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    /** @type {"standard" | "range"} */
    let initial = "standard";
    try {
      const s = localStorage.getItem(MODE_STORAGE_KEY);
      if (s === "range" || s === "standard") initial = s;
    } catch (_) {
      /* ignore */
    }
    setMode(initial);
  }

  if (typeof window !== "undefined") {
    window.__CIRCLE_SLIDER_BEHAVIORS__ = Object.assign(
      {
        velocityUnbounded: attachVelocityUnboundedRadialBehavior,
        velocityBounded100: attachVelocityUnboundedRadialBehavior,
      },
      window.__CIRCLE_SLIDER_BEHAVIORS__ || {}
    );
  }

  const stored = loadStoredConfig();
  /** @type {CircleSliderConfig} */
  const cfg = Object.assign({}, DEFAULT_CONFIG, stored || {});
  if (cfg.rotationOrigin !== "initialPress") cfg.rotationOrigin = "cardCenter";
  if (typeof cfg.requireOutsideCardToActivate !== "boolean") {
    cfg.requireOutsideCardToActivate = DEFAULT_CONFIG.requireOutsideCardToActivate;
  }
  cfg.initialValue = Math.round(Number(cfg.initialValue)) || DEFAULT_CONFIG.initialValue;
  {
    const c = Number(cfg.releaseInwardCosMin);
    cfg.releaseInwardCosMin = Number.isFinite(c)
      ? Math.min(1, Math.max(0, c))
      : DEFAULT_CONFIG.releaseInwardCosMin;
  }
  {
    const s = Number(cfg.releaseDirectionMinSpeedPx);
    cfg.releaseDirectionMinSpeedPx =
      Number.isFinite(s) && s >= 0 ? Math.min(8, s) : DEFAULT_CONFIG.releaseDirectionMinSpeedPx;
  }
  cfg.blurHidePx = cfg.blurAppearPx;
  cfg.hideDurationMs = cfg.appearDurationMs;

  const root = document.getElementById("circle-slider");
  const rangeRoot = document.getElementById("circle-slider-range");
  const panel = document.getElementById("cs-tweak-panel");

  if (root) {
    const api = initCircleSlider(root, cfg);
    /** @type {{ resetValue: () => void; syncDisplay: () => void; getValue: () => number; setValue: (n: number) => void; detachBehavior?: () => void } | null} */
    let rangeApi = null;
    if (rangeRoot instanceof HTMLElement) {
      rangeApi = initCircleSlider(rangeRoot, cfg, { behavior: "velocityBounded100" });
    }
    window.__CIRCLE_SLIDER_CONFIG__ = cfg;
    window.__CIRCLE_SLIDER__ = {
      config: cfg,
      resetValue: api.resetValue,
      getValue: api.getValue,
      setValue: api.setValue,
      rangeResetValue: rangeApi ? rangeApi.resetValue : undefined,
      rangeGetValue: rangeApi ? rangeApi.getValue : undefined,
      rangeSetValue: rangeApi ? rangeApi.setValue : undefined,
    };

    initModePicker(api, rangeApi);

    if (panel) {
      initTweakPanel(panel, cfg, root, api, rangeRoot instanceof HTMLElement ? rangeRoot : null, rangeApi);
    }
  }
})();
