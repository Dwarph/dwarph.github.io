/**
 * Bio "Pip" highlight → header profile image bounce on click, with an in-header tweak panel.
 */
(function () {
    var STORAGE_KEY = 'pipProfileAnimControls';

    var DEFAULTS = {
        bounceDurationMs: 500,
        bounceDepth: 0.1,
        bounceBounciness: 0.65,
        pulseStrength: 0.85,
        pulseRadius: 0.22,
        pulseDurationMs: 420,
        pulseAtCompress: 1,
        pulseHoldMs: 40,
    };

    /** @type {typeof DEFAULTS} Mutable — tweak in panel or browser console. */
    window.pipProfileAnimConfig = Object.assign({}, DEFAULTS);

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function readStored() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeStored(config) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {}
    }

    function mergeConfig(stored) {
        var merged = Object.assign({}, DEFAULTS);
        if (!stored || typeof stored !== 'object') return merged;

        if (typeof stored.bounceDurationMs === 'number') {
            merged.bounceDurationMs = clamp(stored.bounceDurationMs, 150, 1200);
        }
        if (typeof stored.bounceDepth === 'number') merged.bounceDepth = clamp(stored.bounceDepth, 0.02, 0.35);
        if (typeof stored.bounceBounciness === 'number') {
            merged.bounceBounciness = clamp(stored.bounceBounciness, 0, 1);
        }
        if (typeof stored.pulseStrength === 'number') {
            merged.pulseStrength = clamp(stored.pulseStrength, 0.1, 2.5);
        }
        if (typeof stored.pulseRadius === 'number') {
            merged.pulseRadius = clamp(stored.pulseRadius, 0.08, 0.45);
        }
        if (typeof stored.pulseDurationMs === 'number') {
            merged.pulseDurationMs = clamp(stored.pulseDurationMs, 100, 1200);
        }
        if (typeof stored.pulseAtCompress === 'number') {
            merged.pulseAtCompress = clamp(stored.pulseAtCompress, 0.92, 1);
        }
        if (typeof stored.pulseHoldMs === 'number') {
            merged.pulseHoldMs = clamp(stored.pulseHoldMs, 0, 80);
        }

        return merged;
    }

    function formatConfigValue(key, value) {
        if (key === 'bounceDurationMs' || key === 'pulseDurationMs' || key === 'pulseHoldMs') {
            return String(Math.round(value));
        }
        return Number(value).toFixed(2);
    }

    function readProfileScale(profileImage) {
        var transform = getComputedStyle(profileImage).transform;
        if (!transform || transform === 'none') return 1;

        var parts;
        if (transform.indexOf('matrix3d(') === 0) {
            parts = transform.slice(9, -1).split(',').map(Number);
            return Math.hypot(parts[0], parts[1]) || 1;
        }
        if (transform.indexOf('matrix(') === 0) {
            parts = transform.slice(7, -1).split(',').map(Number);
            return Math.hypot(parts[0], parts[1]) || 1;
        }
        return 1;
    }

    function getCompressProgress(scale, dipScale) {
        var range = 1 - dipScale;
        if (range <= 0.001) return 1;
        return clamp((1 - scale) / range, 0, 1);
    }

    /** 0 = gentle settle, 1 = strong overshoot on the settle curve. */
    function bounceSettleCurve(bounciness) {
        var y1 = 1 + bounciness * 0.95;
        return 'cubic-bezier(0.34, ' + y1.toFixed(3) + ', 0.64, 1)';
    }

    function getProfilePulseCenter(header, profileImage) {
        var mount = header.querySelector('.header-distortion-mount');
        if (!mount || !profileImage) return null;

        var mountRect = mount.getBoundingClientRect();
        if (mountRect.width < 1 || mountRect.height < 1) return null;

        var profileRect = profileImage.getBoundingClientRect();
        return {
            x: clamp((profileRect.left + profileRect.width * 0.5 - mountRect.left) / mountRect.width, 0, 1),
            y: clamp((profileRect.top + profileRect.height * 0.5 - mountRect.top) / mountRect.height, 0, 1),
        };
    }

    function triggerDistortionPulse(header, profileImage, cfg) {
        var sketch = header && header.__distortionSketch;
        if (!sketch || typeof sketch.pulseAtNormalized !== 'function') return;

        var center = getProfilePulseCenter(header, profileImage);
        if (!center) return;

        sketch.pulseAtNormalized(center.x, center.y, {
            duration: cfg.pulseDurationMs,
            strength: cfg.pulseStrength,
            radius: cfg.pulseRadius,
        });
    }

    /**
     * @param {HTMLElement} header
     * @param {() => void} onPreview
     * @param {(patch: Partial<typeof DEFAULTS>) => void} onChange
     */
    function buildPipProfilePanel(header, onPreview, onChange) {
        var root = document.createElement('div');
        root.className = 'pip-profile-controls';
        root.id = 'pip-profile-controls';

        var panel = document.createElement('div');
        panel.className = 'pip-profile-controls__panel';
        panel.id = 'pip-profile-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'pip-profile-legend');
        panel.setAttribute('aria-hidden', 'true');

        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'pip-profile-controls__trigger';
        trigger.setAttribute('aria-label', 'Pip profile animation settings');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'pip-profile-panel');

        var triggerIconOpen = document.createElement('span');
        triggerIconOpen.className =
            'material-icons pip-profile-controls__trigger-icon pip-profile-controls__trigger-icon--open';
        triggerIconOpen.textContent = 'tune';
        triggerIconOpen.setAttribute('aria-hidden', 'true');
        trigger.appendChild(triggerIconOpen);

        var triggerIconClose = document.createElement('span');
        triggerIconClose.className =
            'material-icons pip-profile-controls__trigger-icon pip-profile-controls__trigger-icon--close';
        triggerIconClose.textContent = 'close';
        triggerIconClose.setAttribute('aria-hidden', 'true');
        trigger.appendChild(triggerIconClose);

        var fieldset = document.createElement('fieldset');
        fieldset.className = 'pip-profile-controls__fieldset';

        var legend = document.createElement('legend');
        legend.className = 'pip-profile-controls__legend';
        legend.id = 'pip-profile-legend';
        legend.textContent = 'Icon bounce';
        fieldset.appendChild(legend);

        var pulseFieldset = document.createElement('fieldset');
        pulseFieldset.className = 'pip-profile-controls__fieldset';

        var pulseLegend = document.createElement('legend');
        pulseLegend.className = 'pip-profile-controls__legend';
        pulseLegend.textContent = 'Particle pulse';
        pulseFieldset.appendChild(pulseLegend);

        var inputs = {};

        function addRow(parent, key, label, min, max, step) {
            var row = document.createElement('div');
            row.className = 'pip-profile-controls__row';

            var lab = document.createElement('label');
            lab.className = 'pip-profile-controls__label';
            lab.setAttribute('for', 'pip-profile-' + key);
            lab.textContent = label;

            var input = document.createElement('input');
            input.type = 'range';
            input.id = 'pip-profile-' + key;
            input.className = 'pip-profile-controls__range';
            input.min = String(min);
            input.max = String(max);
            input.step = String(step);
            input.dataset.key = key;

            var val = document.createElement('span');
            val.className = 'pip-profile-controls__value';
            val.setAttribute('aria-live', 'polite');

            input.addEventListener('input', function () {
                var v = parseFloat(input.value);
                val.textContent = formatConfigValue(key, v);
                var patch = {};
                patch[key] = v;
                onChange(patch);
            });

            input.value = String(window.pipProfileAnimConfig[key]);
            val.textContent = formatConfigValue(key, parseFloat(input.value));

            inputs[key] = { input: input, val: val };

            lab.appendChild(input);
            row.appendChild(lab);
            row.appendChild(val);
            parent.appendChild(row);
        }

        addRow(fieldset, 'bounceDurationMs', 'Duration (ms)', 150, 1200, 10);
        addRow(fieldset, 'bounceDepth', 'Compress depth', 0.02, 0.35, 0.01);
        addRow(fieldset, 'bounceBounciness', 'Settle bounce', 0, 1, 0.01);

        addRow(pulseFieldset, 'pulseStrength', 'Strength', 0.1, 2.5, 0.05);
        addRow(pulseFieldset, 'pulseRadius', 'Radius', 0.08, 0.45, 0.01);
        addRow(pulseFieldset, 'pulseDurationMs', 'Duration (ms)', 100, 1200, 10);
        addRow(pulseFieldset, 'pulseAtCompress', 'At compress', 0.92, 1, 0.01);
        addRow(pulseFieldset, 'pulseHoldMs', 'Hold at min (ms)', 0, 80, 1);

        var actions = document.createElement('div');
        actions.className = 'pip-profile-controls__actions';

        var preview = document.createElement('button');
        preview.type = 'button';
        preview.className = 'pip-profile-controls__btn';
        preview.textContent = 'Preview bounce';
        preview.addEventListener('click', onPreview);

        var reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'pip-profile-controls__btn pip-profile-controls__btn--reset';
        reset.textContent = 'Reset to defaults';
        reset.addEventListener('click', function () {
            onChange(Object.assign({}, DEFAULTS));
            var k;
            for (k in inputs) {
                if (Object.prototype.hasOwnProperty.call(inputs, k)) {
                    var pair = inputs[k];
                    pair.input.value = String(window.pipProfileAnimConfig[k]);
                    pair.val.textContent = formatConfigValue(k, window.pipProfileAnimConfig[k]);
                }
            }
        });

        actions.appendChild(preview);
        actions.appendChild(reset);

        panel.appendChild(fieldset);
        panel.appendChild(pulseFieldset);
        panel.appendChild(actions);

        function setPanelOpen(open) {
            root.classList.toggle('pip-profile-controls--open', open);
            panel.setAttribute('aria-hidden', open ? 'false' : 'true');
            if ('inert' in panel) {
                panel.inert = !open;
            }
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            trigger.setAttribute(
                'aria-label',
                open ? 'Close Pip profile animation settings' : 'Pip profile animation settings'
            );
        }

        trigger.addEventListener('click', function () {
            setPanelOpen(!root.classList.contains('pip-profile-controls--open'));
        });

        document.addEventListener('keydown', function onPipProfileKeydown(e) {
            if (e.key !== 'Escape' || !root.classList.contains('pip-profile-controls--open')) {
                return;
            }
            setPanelOpen(false);
            trigger.focus();
        });

        root.appendChild(panel);
        root.appendChild(trigger);
        header.appendChild(root);
        setPanelOpen(false);
    }

    window.initBioPipProfileInteraction = function (container) {
        container = container || document;
        var header = container.querySelector('.homepage-header');
        var profileImage = header && header.querySelector('.profile-image');
        var pipSpans = container.querySelectorAll('.bio-highlight-pip');
        if (!header || !profileImage || !pipSpans.length) return;

        var bounceAnim = null;

        var config = mergeConfig(readStored());
        Object.assign(window.pipProfileAnimConfig, config);

        profileImage.classList.add('profile-image--pip-linked');
        header.classList.add('pip-profile-tweaks-enabled');

        function finishBounce() {
            header.classList.remove('is-pip-bouncing');
            profileImage.style.removeProperty('transform');
        }

        function triggerPipBounce() {
            var cfg = window.pipProfileAnimConfig;
            var dipScale = Math.max(0.5, 1 - cfg.bounceDepth);
            var compressMs = Math.round(cfg.bounceDurationMs * 0.28);
            var holdMs = Math.round(cfg.pulseHoldMs);
            var settleMs = Math.max(1, cfg.bounceDurationMs - compressMs - holdMs);
            var pulsed = false;
            var settleStarted = false;
            var pulseWatchId = 0;

            if (bounceAnim) {
                bounceAnim.cancel();
                bounceAnim = null;
            }

            function firePulseIfNeeded() {
                if (pulsed) return;
                pulsed = true;
                triggerDistortionPulse(header, profileImage, cfg);
            }

            function startSettle() {
                if (settleStarted) return;
                settleStarted = true;

                var settle = profileImage.animate(
                    [{ transform: 'scale(' + dipScale + ')' }, { transform: 'scale(1)' }],
                    {
                        duration: settleMs,
                        easing: bounceSettleCurve(cfg.bounceBounciness),
                        fill: 'forwards',
                    }
                );

                settle.onfinish = finishBounce;
                settle.oncancel = finishBounce;
                bounceAnim = settle;
            }

            function beginSettleAfterHold() {
                if (holdMs > 0) {
                    setTimeout(startSettle, holdMs);
                } else {
                    startSettle();
                }
            }

            function watchCompressForPulse(compressAnim) {
                function frame() {
                    if (pulsed || compressAnim.playState === 'cancelled') return;

                    var progress = getCompressProgress(readProfileScale(profileImage), dipScale);
                    if (progress >= cfg.pulseAtCompress) {
                        firePulseIfNeeded();
                        return;
                    }

                    if (compressAnim.playState === 'running') {
                        pulseWatchId = requestAnimationFrame(frame);
                    }
                }

                pulseWatchId = requestAnimationFrame(frame);
            }

            header.classList.add('is-pip-bouncing');

            var compress = profileImage.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(' + dipScale + ')' }],
                {
                    duration: compressMs,
                    easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
                    fill: 'forwards',
                }
            );

            watchCompressForPulse(compress);

            compress.onfinish = function () {
                if (pulseWatchId) {
                    cancelAnimationFrame(pulseWatchId);
                    pulseWatchId = 0;
                }
                firePulseIfNeeded();
                beginSettleAfterHold();
            };

            compress.oncancel = function () {
                if (pulseWatchId) {
                    cancelAnimationFrame(pulseWatchId);
                    pulseWatchId = 0;
                }
                finishBounce();
            };

            bounceAnim = compress;
        }

        function applyConfigPatch(patch) {
            Object.assign(window.pipProfileAnimConfig, mergeConfig(Object.assign({}, window.pipProfileAnimConfig, patch)));
            writeStored(window.pipProfileAnimConfig);
        }

        buildPipProfilePanel(header, triggerPipBounce, applyConfigPatch);

        for (var i = 0; i < pipSpans.length; i++) {
            pipSpans[i].addEventListener('click', triggerPipBounce);
        }
    };
})();
