/**
 * Bio "Pip" highlight + profile image press → header bounce + distortion pulse.
 */
(function () {
    var CONFIG = {
        bounceDurationMs: 500,
        bounceDepth: 0.18,
        bounceBounciness: 1,
        pulseStrength: 0.15,
        pulseRadius: 1,
        pulseDurationMs: 2475,
        pulseDurationMsMobile: 1400,
        pulseAt: 0.6,
        pulseHoldMs: 90,
    };

    var mobileLayoutQuery =
        typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(max-width: 768px)')
            : null;

    function isMobileLayout() {
        return mobileLayoutQuery ? mobileLayoutQuery.matches : false;
    }

    function getPulseDurationMs() {
        return isMobileLayout() ? CONFIG.pulseDurationMsMobile : CONFIG.pulseDurationMs;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function bounceSettleCurve(bounciness) {
        var y1 = 1 + bounciness * 0.95;
        return 'cubic-bezier(0.34, ' + y1.toFixed(3) + ', 0.64, 1)';
    }

    function getProfilePulseCenter(header, visualTarget) {
        var mount = header.querySelector('.header-distortion-mount');
        if (!mount || !visualTarget) return null;

        var mountRect = mount.getBoundingClientRect();
        if (mountRect.width < 1 || mountRect.height < 1) return null;

        var profileRect = visualTarget.getBoundingClientRect();
        var halfW = profileRect.width * 0.5;
        var halfH = profileRect.height * 0.5;
        return {
            x: clamp((profileRect.left + halfW - mountRect.left) / mountRect.width, 0, 1),
            y: clamp((profileRect.top + halfH - mountRect.top) / mountRect.height, 0, 1),
            radius: clamp(halfW / mountRect.width, 0, 1),
        };
    }

    function triggerDistortionPulse(header, visualTarget) {
        var sketch = header && header.__distortionSketch;
        if (!sketch || typeof sketch.pulseAtNormalized !== 'function') return;

        var center = getProfilePulseCenter(header, visualTarget);
        if (!center) return;

        sketch.pulseAtNormalized(center.x, center.y, {
            duration: getPulseDurationMs(),
            strength: CONFIG.pulseStrength,
            radius: CONFIG.pulseRadius,
            startRadius: center.radius,
        });
    }

    function getBounceTiming() {
        var dipScale = Math.max(0.32, 1 - CONFIG.bounceDepth);
        var compressMs = Math.round(CONFIG.bounceDurationMs * 0.28);
        var holdMs = Math.round(CONFIG.pulseHoldMs);
        var settleMs = Math.max(1, CONFIG.bounceDurationMs - compressMs - holdMs);
        return { dipScale: dipScale, compressMs: compressMs, holdMs: holdMs, settleMs: settleMs };
    }

    window.initBioPipProfileInteraction = function (container) {
        container = container || document;
        var header = container.querySelector('.homepage-header');
        var pressTarget = header && header.querySelector('.profile-image-press-target');
        var profileImage = header && header.querySelector('.profile-image');
        var pipSpans = container.querySelectorAll('.bio-highlight-pip');
        if (!header || (!profileImage && !pressTarget)) return;

        var bounceAnim = null;
        var pulseTimer = null;
        var bounceStartedAt = 0;
        var holdTimer = null;
        var bounceActive = false;
        var pulseFired = false;
        var bounceGeneration = 0;
        var imagePressActive = false;

        var visualTarget = pressTarget;

        if (!pressTarget && profileImage) {
            pressTarget = document.createElement('div');
            pressTarget.className = 'profile-image-press-target';
            pressTarget.setAttribute('role', 'img');
            pressTarget.setAttribute(
                'aria-label',
                profileImage.getAttribute('alt') || 'Profile picture'
            );
            profileImage.parentNode.insertBefore(pressTarget, profileImage);
            pressTarget.appendChild(profileImage);
            visualTarget = pressTarget;
        }

        if (profileImage) {
            profileImage.classList.add('profile-image--decorative');
            profileImage.setAttribute('aria-hidden', 'true');
            profileImage.setAttribute('tabindex', '-1');
            profileImage.draggable = false;

            function syncPressTargetBackground() {
                var imageUrl = profileImage.currentSrc || profileImage.getAttribute('src');
                if (imageUrl) {
                    pressTarget.style.backgroundImage = 'url("' + imageUrl.replace(/"/g, '%22') + '")';
                }
            }

            function revealPressTarget() {
                syncPressTargetBackground();
                pressTarget.classList.add('header-image-ready');
                if (profileImage.parentNode) {
                    profileImage.remove();
                }
            }

            if (profileImage.classList.contains('header-image-ready')) {
                revealPressTarget();
            } else if (profileImage.complete && profileImage.naturalWidth > 0) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(revealPressTarget);
                });
            } else {
                profileImage.addEventListener('load', revealPressTarget);
                profileImage.addEventListener('error', revealPressTarget);
            }
        }

        pressTarget.classList.add('profile-image-press-target--pip-linked');
        visualTarget = pressTarget;

        function bumpGeneration() {
            bounceGeneration += 1;
            return bounceGeneration;
        }

        function cancelActiveAnimation() {
            if (bounceAnim) {
                bounceAnim.cancel();
                bounceAnim = null;
            }
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            clearPulseTimer();
        }

        function clearPulseTimer() {
            if (pulseTimer != null) {
                clearTimeout(pulseTimer);
                pulseTimer = null;
            }
        }

        function getPulseAtMs() {
            return CONFIG.pulseAt * CONFIG.bounceDurationMs;
        }

        function firePulseIfNeeded() {
            if (pulseFired || !bounceActive) return;

            var sketch = header && header.__distortionSketch;
            if (!sketch || typeof sketch.pulseAtNormalized !== 'function') return;
            if (!getProfilePulseCenter(header, visualTarget)) return;

            pulseFired = true;
            clearPulseTimer();
            triggerDistortionPulse(header, visualTarget);
        }

        function firePulseNow() {
            pulseFired = true;
            clearPulseTimer();
            triggerDistortionPulse(header, visualTarget);
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
            imagePressActive = false;
            bounceActive = false;
            bounceStartedAt = 0;
            header.classList.remove('is-pip-bouncing');
            visualTarget.style.removeProperty('transform');
        }

        function runSettle(gen, dipScale, settleMs) {
            visualTarget.style.transform = 'scale(' + dipScale + ')';

            var settle = visualTarget.animate(
                [{ transform: 'scale(' + dipScale + ')' }, { transform: 'scale(1)' }],
                {
                    duration: settleMs,
                    easing: bounceSettleCurve(CONFIG.bounceBounciness),
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

        function runCompress(gen, timing, onComplete) {
            var compress = visualTarget.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(' + timing.dipScale + ')' }],
                {
                    duration: timing.compressMs,
                    easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
                    fill: 'forwards',
                }
            );

            compress.onfinish = function () {
                if (gen !== bounceGeneration) return;
                bounceAnim = null;
                if (onComplete) onComplete();
            };

            compress.oncancel = function () {
                if (gen !== bounceGeneration) return;
                bounceAnim = null;
            };

            bounceAnim = compress;
        }

        function triggerPipBounce() {
            var gen = bumpGeneration();
            var timing = getBounceTiming();
            var settleStarted = false;

            cancelActiveAnimation();
            imagePressActive = false;
            pulseFired = false;
            bounceStartedAt = performance.now();
            bounceActive = true;
            header.classList.add('is-pip-bouncing');
            schedulePulseOnTimeline(gen);

            function startSettle() {
                if (settleStarted || gen !== bounceGeneration) return;
                settleStarted = true;
                runSettle(gen, timing.dipScale, timing.settleMs);
            }

            function beginSettleAfterHold() {
                if (gen !== bounceGeneration) return;
                if (timing.holdMs > 0) {
                    holdTimer = setTimeout(function () {
                        if (gen !== bounceGeneration) return;
                        holdTimer = null;
                        startSettle();
                    }, timing.holdMs);
                } else {
                    startSettle();
                }
            }

            runCompress(gen, timing, beginSettleAfterHold);
        }

        function blockImageDefaultMenu(e) {
            e.preventDefault();
        }

        function onProfileImagePointerDown(e) {
            if (imagePressActive) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (e.pointerType === 'touch') {
                e.preventDefault();
            }

            var gen = bumpGeneration();
            var timing = getBounceTiming();

            cancelActiveAnimation();
            imagePressActive = true;
            pulseFired = false;
            bounceStartedAt = performance.now();
            bounceActive = true;
            header.classList.add('is-pip-bouncing');
            visualTarget.style.removeProperty('transform');

            try {
                pressTarget.setPointerCapture(e.pointerId);
            } catch (err) {
                /* ignore */
            }

            runCompress(gen, timing, null);
        }

        function onProfileImagePointerUp(e) {
            if (!imagePressActive) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            var gen = bounceGeneration;
            var timing = getBounceTiming();

            imagePressActive = false;
            cancelActiveAnimation();
            firePulseNow();
            runSettle(gen, timing.dipScale, timing.settleMs);

            try {
                if (pressTarget.hasPointerCapture && pressTarget.hasPointerCapture(e.pointerId)) {
                    pressTarget.releasePointerCapture(e.pointerId);
                }
            } catch (err) {
                /* ignore */
            }
        }

        for (var i = 0; i < pipSpans.length; i++) {
            pipSpans[i].addEventListener('click', triggerPipBounce);
        }

        pressTarget.addEventListener('pointerdown', onProfileImagePointerDown);
        pressTarget.addEventListener('pointerup', onProfileImagePointerUp);
        pressTarget.addEventListener('pointercancel', onProfileImagePointerUp);
        pressTarget.addEventListener('contextmenu', blockImageDefaultMenu);
        pressTarget.addEventListener('dragstart', blockImageDefaultMenu);
        pressTarget.addEventListener('selectstart', blockImageDefaultMenu);
        pressTarget.addEventListener('touchstart', blockImageDefaultMenu, { passive: false });
    };
})();
