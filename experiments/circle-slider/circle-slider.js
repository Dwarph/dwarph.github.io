/**
 * Circle slider — encoder-style control (see README.md in this folder).
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
   * @param {HTMLElement} root
   * @param {CircleSliderConfig} cfg
   */
  function applyVisualConfig(root, cfg) {
    const radialLayer = root.querySelector("#cs-radial-layer");
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

    const pressHalo = root.querySelector("#cs-press-halo");
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
   * @param {HTMLElement} root
   * @param {CircleSliderConfig} cfg
   * @returns {{ resetValue: () => void; syncDisplay: () => void }}
   */
  function initCircleSlider(root, cfg) {
    const card = root.querySelector("[data-cs-card]");
    const valueEl = root.querySelector("#cs-value-display");
    const radialLayer = root.querySelector("#cs-radial-layer");
    const pressHalo = root.querySelector("#cs-press-halo");
    const trackRot = root.querySelector("[data-track-rot]");
    const thumbRot = root.querySelector("[data-thumb-rot]");
    const trackPath = root.querySelector("[data-track-path]");
    const thumbPath = root.querySelector("[data-thumb-path]");

    if (!card || !valueEl || !radialLayer || !trackRot || !thumbRot || !trackPath || !thumbPath) {
      return {
        resetValue: function () {},
        syncDisplay: function () {},
      };
    }

    applyVisualConfig(root, cfg);

    let value = Math.round(cfg.initialValue);
    let valueAcc = 0;

    function syncDisplay() {
      valueEl.textContent = String(value);
      card.setAttribute("aria-valuenow", String(value));
    }

    syncDisplay();

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

    let scrollLocked = false;
    let lockedScrollY = 0;

    function lockPageScroll() {
      if (scrollLocked) return;
      scrollLocked = true;
      lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      /*
       * Overflow-only lock: do not use position:fixed on body (that pattern removes the scrollbar
       * and changes the viewport width, which shifts layout sideways). We only freeze further scroll.
       */
      document.documentElement.classList.add("cs-scroll-lock");
      document.body.classList.add("cs-scroll-lock");
    }

    function unlockPageScroll() {
      if (!scrollLocked) return;
      scrollLocked = false;
      document.documentElement.classList.remove("cs-scroll-lock");
      document.body.classList.remove("cs-scroll-lock");
      window.scrollTo(0, lockedScrollY);
    }

    function setRadialVisible(on) {
      radialLayer.classList.toggle("cs-radial-layer--visible", on);
      radialLayer.setAttribute("aria-hidden", on ? "false" : "true");
    }

    /**
     * @param {boolean} on
     * @param {{ arcHandoff?: boolean } | undefined} options — `arcHandoff`: hide halo in sync with radial (no opacity delay)
     */
    function setPressHaloVisible(on, options) {
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
    }

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
      const a = angleForPointer(clientX, clientY);
      lastAngle = a;
      arcCenterAngle = a;
      lastT = performance.now();
      setPressHaloVisible(false, { arcHandoff: true });
      setRadialVisible(true);
      applyRotations(a);
    }

    function isPointerOverCard(clientX, clientY) {
      const r = card.getBoundingClientRect();
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
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

    function applyRotations(thumbAngle) {
      const thumbDeg = (thumbAngle * 180) / Math.PI;
      const trackDeg = ((arcCenterAngle - TRACK_ARC_BISECTOR_RAD) * 180) / Math.PI;
      thumbRot.setAttribute("transform", `translate(100 100) rotate(${thumbDeg})`);
      trackRot.setAttribute("transform", `rotate(${trackDeg})`);
    }

    /** Same options object required for add/removeEventListener on window. */
    const peOpts = { passive: false };

    let gestureActive = false;

    function removeWindowGestureListeners() {
      window.removeEventListener("pointermove", onWindowPointerMove, peOpts);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
    }

    function teardownPointer() {
      if (!gestureActive) return;
      gestureActive = false;
      clearActivationDelayTimer();
      removeWindowGestureListeners();
      const pid = pointerId;
      pointerId = null;
      activated = false;
      card.classList.remove("cs-value-card--active");
      unlockPageScroll();
      setPressHaloVisible(false);
      setRadialVisible(false);
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
      lastAngle = 0;
      lastT = performance.now();
      arcCenterAngle = 0;
      card.classList.add("cs-value-card--active");
      setPressHaloVisible(true);
      window.addEventListener("pointermove", onWindowPointerMove, peOpts);
      window.addEventListener("pointerup", onWindowPointerEnd);
      window.addEventListener("pointercancel", onWindowPointerEnd);
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
          lockPageScroll();
        }
      });
    }

    function onWindowPointerMove(ev) {
      if (!gestureActive || ev.pointerId !== pointerId) return;
      ev.preventDefault();

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

      if (allowValue && dValue !== 0) {
        const ramp = sensitivityRampFactor(ev.clientX, ev.clientY);
        valueAcc += (dValue * mult * ramp) / cfg.radPerStep;
        const steps = Math.trunc(valueAcc);
        if (steps !== 0) {
          valueAcc -= steps;
          value += steps;
          syncDisplay();
        }
      }

      updateArcCenterTowardThumb(a);
      applyRotations(a);
    }

    function onWindowPointerEnd(ev) {
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
    card.addEventListener(
      "touchstart",
      function (ev) {
        if (!pressHalo || ev.touches.length !== 1) return;
        setPressHaloVisible(true);
      },
      touchHaloOpts
    );
    card.addEventListener(
      "touchend",
      function () {
        if (!gestureActive) setPressHaloVisible(false);
      },
      touchHaloOpts
    );
    card.addEventListener(
      "touchcancel",
      function () {
        if (!gestureActive) setPressHaloVisible(false);
      },
      touchHaloOpts
    );

    const peCaptureOpts = { passive: false, capture: true };
    card.addEventListener("pointerdown", onPointerDown, peCaptureOpts);
    card.addEventListener("lostpointercapture", onLostCapture);

    return {
      resetValue: function () {
        value = Math.round(cfg.initialValue);
        valueAcc = 0;
        syncDisplay();
      },
      syncDisplay: syncDisplay,
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
   * @param {{ resetValue: () => void }} sliderApi
   */
  function initTweakPanel(panel, cfg, sliderRoot, sliderApi) {
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
      }

      refreshOutputs();
    }

    panel.addEventListener("input", onControlInput);
    panel.addEventListener("change", onControlInput);

    const resetValBtn = panel.querySelector("[data-cs-reset-value]");
    if (resetValBtn) {
      resetValBtn.addEventListener("click", function () {
        sliderApi.resetValue();
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
        applyVisualConfig(sliderRoot, cfg);
        refreshOutputs();
        sliderApi.resetValue();
      });
    }

    refreshOutputs();
  }

  const stored = loadStoredConfig();
  /** @type {CircleSliderConfig} */
  const cfg = Object.assign({}, DEFAULT_CONFIG, stored || {});
  if (cfg.rotationOrigin !== "initialPress") cfg.rotationOrigin = "cardCenter";
  if (typeof cfg.requireOutsideCardToActivate !== "boolean") {
    cfg.requireOutsideCardToActivate = DEFAULT_CONFIG.requireOutsideCardToActivate;
  }
  cfg.initialValue = Math.round(Number(cfg.initialValue)) || DEFAULT_CONFIG.initialValue;
  cfg.blurHidePx = cfg.blurAppearPx;
  cfg.hideDurationMs = cfg.appearDurationMs;

  const root = document.getElementById("circle-slider");
  const panel = document.getElementById("cs-tweak-panel");

  if (root) {
    const api = initCircleSlider(root, cfg);
    window.__CIRCLE_SLIDER_CONFIG__ = cfg;
    window.__CIRCLE_SLIDER__ = { config: cfg, resetValue: api.resetValue };

    if (panel) {
      initTweakPanel(panel, cfg, root, api);
    }
  }
})();
