/**
 * Bio "Pip" highlight → header profile image bounce on click, with an in-header tweak panel.
 */
(function () {
    var STORAGE_KEY = 'pipProfileAnimControls';

    var DEFAULTS = {
        bounceDurationMs: 500,
        bounceDepth: 0.18,
        bounceBounciness: 1,
        pulseStrength: 0.15,
        pulseRadius: 1,
        pulseDurationMs: 2475,
        pulseAt: 0.6,
        pulseHoldMs: 90,
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
        if (typeof stored.bounceDepth === 'number') merged.bounceDepth = clamp(stored.bounceDepth, 0, 0.6);
        if (typeof stored.bounceBounciness === 'number') {
            merged.bounceBounciness = clamp(stored.bounceBounciness, 0, 1);
        }
        if (typeof stored.pulseStrength === 'number') {
            merged.pulseStrength = clamp(stored.pulseStrength, 0.1, 2.5);
        }
        if (typeof stored.pulseRadius === 'number') {
            merged.pulseRadius = clamp(stored.pulseRadius, 0.15, 1);
        }
        if (typeof stored.pulseDurationMs === 'number') {
            merged.pulseDurationMs = clamp(stored.pulseDurationMs, 100, 4000);
        }
        if (typeof stored.pulseAt === 'number' && Number.isFinite(stored.pulseAt)) {
            merged.pulseAt = clamp(stored.pulseAt, 0, 1);
        } else if (typeof stored.pulseAtCompress === 'number') {
            var compressPoint = clamp(stored.pulseAtCompress, 0.92, 1);
            merged.pulseAt = clamp(0.2 + ((compressPoint - 0.92) / 0.08) * 0.16, 0, 1);
        }
        if (typeof stored.pulseHoldMs === 'number') {
            merged.pulseHoldMs = clamp(stored.pulseHoldMs, 0, 250);
        }

        return merged;
    }

    function formatConfigValue(key, value) {
        if (key === 'bounceDurationMs' || key === 'pulseDurationMs' || key === 'pulseHoldMs') {
            return String(Math.round(value));
        }
        if (key === 'pulseAt') {
            return Math.round(value * 100) + '%';
        }
        return Number(value).toFixed(2);
    }

    function configToClipboardText() {
        var keys = Object.keys(DEFAULTS);
        var out = {};
        var i;
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            out[key] = window.pipProfileAnimConfig[key];
        }
        return JSON.stringify(out, null, 2);
    }

    function copyTextToClipboard(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                if (document.execCommand('copy')) {
                    resolve();
                } else {
                    reject(new Error('copy failed'));
                }
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(textarea);
            }
        });
    }

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
        var halfW = profileRect.width * 0.5;
        var halfH = profileRect.height * 0.5;
        return {
            x: clamp((profileRect.left + halfW - mountRect.left) / mountRect.width, 0, 1),
            y: clamp((profileRect.top + halfH - mountRect.top) / mountRect.height, 0, 1),
            /* Grid-x units (0–1 × size): profile occludes the sim until the ring clears this radius. */
            radius: clamp(halfW / mountRect.width, 0, 1),
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
            startRadius: center.radius,
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
        addRow(fieldset, 'bounceDepth', 'Compress depth', 0, 0.6, 0.01);
        addRow(fieldset, 'bounceBounciness', 'Settle bounce', 0, 1, 0.01);

        addRow(pulseFieldset, 'pulseStrength', 'Strength', 0.1, 2.5, 0.05);
        addRow(pulseFieldset, 'pulseRadius', 'Reach', 0.15, 1, 0.01);
        addRow(pulseFieldset, 'pulseDurationMs', 'Duration (ms)', 100, 4000, 25);
        addRow(pulseFieldset, 'pulseAt', 'At bounce time', 0, 1, 0.01);
        addRow(pulseFieldset, 'pulseHoldMs', 'Hold at min (ms)', 0, 250, 5);

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

        var copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'pip-profile-controls__btn pip-profile-controls__btn--reset';
        copy.textContent = 'Copy values';
        copy.addEventListener('click', function () {
            var label = copy.textContent;
            copyTextToClipboard(configToClipboardText())
                .then(function () {
                    copy.textContent = 'Copied!';
                    window.setTimeout(function () {
                        copy.textContent = label;
                    }, 1500);
                })
                .catch(function () {
                    copy.textContent = 'Copy failed';
                    window.setTimeout(function () {
                        copy.textContent = label;
                    }, 1500);
                });
        });

        actions.appendChild(preview);
        actions.appendChild(copy);
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
        var pulseTimer = null;
        var bounceStartedAt = 0;
        var holdTimer = null;
        var bounceActive = false;
        var pulseFired = false;
        var bounceGeneration = 0;

        var config = mergeConfig(readStored());
        Object.assign(window.pipProfileAnimConfig, config);

        profileImage.classList.add('profile-image--pip-linked');
        header.classList.add('pip-profile-tweaks-enabled');

        function clearPulseTimer() {
            if (pulseTimer != null) {
                clearTimeout(pulseTimer);
                pulseTimer = null;
            }
        }

        function getPulseAtMs() {
            var cfg = window.pipProfileAnimConfig;
            var ms = cfg.pulseAt * cfg.bounceDurationMs;
            return Number.isFinite(ms) ? Math.max(0, ms) : DEFAULTS.pulseAt * DEFAULTS.bounceDurationMs;
        }

        function firePulseIfNeeded() {
            if (pulseFired || !bounceActive) return;

            var sketch = header && header.__distortionSketch;
            if (!sketch || typeof sketch.pulseAtNormalized !== 'function') return;
            if (!getProfilePulseCenter(header, profileImage)) return;

            pulseFired = true;
            clearPulseTimer();
            triggerDistortionPulse(header, profileImage, window.pipProfileAnimConfig);
        }

        function schedulePulseOnTimeline(gen) {
            clearPulseTimer();
            if (!bounceActive || pulseFired) return;

            var pulseAtMs = getPulseAtMs();
            var delay = pulseAtMs - (performance.now() - bounceStartedAt);

            if (delay <= 0) {
                firePulseIfNeeded();
                return;
            }

            pulseTimer = setTimeout(function () {
                if (gen !== bounceGeneration) return;
                firePulseIfNeeded();
            }, delay);
        }

        function finishBounce(gen) {
            if (gen !== bounceGeneration) return;

            if (!pulseFired && bounceActive) {
                if (performance.now() - bounceStartedAt >= getPulseAtMs()) {
                    firePulseIfNeeded();
                }
            }
            clearPulseTimer();
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            bounceActive = false;
            bounceStartedAt = 0;
            header.classList.remove('is-pip-bouncing');
            profileImage.style.removeProperty('transform');
        }

        function applyConfigPatch(patch) {
            Object.assign(
                window.pipProfileAnimConfig,
                mergeConfig(Object.assign({}, window.pipProfileAnimConfig, patch))
            );
            writeStored(window.pipProfileAnimConfig);
            if (!bounceActive) return;

            var timingChanged =
                patch.pulseAt !== undefined || patch.bounceDurationMs !== undefined;
            if (!timingChanged) return;

            if (pulseFired) {
                var elapsed = performance.now() - bounceStartedAt;
                if (elapsed < getPulseAtMs()) {
                    pulseFired = false;
                }
            }

            if (!pulseFired) {
                schedulePulseOnTimeline(bounceGeneration);
            }
        }

        function triggerPipBounce() {
            bounceGeneration += 1;
            var gen = bounceGeneration;

            var cfg = window.pipProfileAnimConfig;
            var dipScale = Math.max(0.32, 1 - cfg.bounceDepth);
            var compressMs = Math.round(cfg.bounceDurationMs * 0.28);
            var holdMs = Math.round(cfg.pulseHoldMs);
            var settleMs = Math.max(1, cfg.bounceDurationMs - compressMs - holdMs);
            var settleStarted = false;

            if (bounceAnim) {
                bounceAnim.cancel();
                bounceAnim = null;
            }
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            clearPulseTimer();
            pulseFired = false;
            bounceStartedAt = performance.now();
            bounceActive = true;
            header.classList.add('is-pip-bouncing');
            schedulePulseOnTimeline(gen);

            function startSettle() {
                if (settleStarted || gen !== bounceGeneration) return;
                settleStarted = true;

                var settle = profileImage.animate(
                    [{ transform: 'scale(' + dipScale + ')' }, { transform: 'scale(1)' }],
                    {
                        duration: settleMs,
                        easing: bounceSettleCurve(cfg.bounceBounciness),
                        fill: 'forwards',
                    }
                );

                settle.onfinish = function () {
                    finishBounce(gen);
                };
                settle.oncancel = function () {
                    finishBounce(gen);
                };
                bounceAnim = settle;
            }

            function beginSettleAfterHold() {
                if (gen !== bounceGeneration) return;
                if (holdMs > 0) {
                    holdTimer = setTimeout(function () {
                        if (gen !== bounceGeneration) return;
                        holdTimer = null;
                        startSettle();
                    }, holdMs);
                } else {
                    startSettle();
                }
            }

            var compress = profileImage.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(' + dipScale + ')' }],
                {
                    duration: compressMs,
                    easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
                    fill: 'forwards',
                }
            );

            compress.onfinish = function () {
                if (gen !== bounceGeneration) return;
                beginSettleAfterHold();
            };

            compress.oncancel = function () {
                finishBounce(gen);
            };

            bounceAnim = compress;
        }

        buildPipProfilePanel(header, triggerPipBounce, applyConfigPatch);

        for (var i = 0; i < pipSpans.length; i++) {
            pipSpans[i].addEventListener('click', triggerPipBounce);
        }
    };
})();
