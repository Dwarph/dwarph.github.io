/**
 * Scroll-linked fade-in and timeline bar growth.
 * Config is adjustable via the LEVA-style control panel (createScrollAnimPanel).
 */
(function () {
    var config = {
        playOnce: false,
        threshold: 0.95,
        fadeZone: 0.8,
        fadeEasing: 'smooth',
        enabled: true,
        barEnabled: true,
        barSensitivity: 1.25,
        barEasing: 'ease-in',
        barSmooth: 0.12,
        completed: null
    };

    /**
     * Apply easing to raw progress (0–1).
     * linear, ease-in, ease-out, smooth (smoothstep).
     */
    function easeProgress(p, easing) {
        var e = easing || 'linear';
        if (e === 'linear') return p;
        if (e === 'ease-in') return p * p;
        if (e === 'ease-out') return 1 - (1 - p) * (1 - p);
        if (e === 'smooth') return p * p * (3 - 2 * p);
        return p;
    }

    function easeFade(p) {
        return easeProgress(p, config.fadeEasing);
    }

    function easeBar(p) {
        return easeProgress(p, config.barEasing);
    }

    /**
     * Progress 0..1 as element enters viewport from bottom.
     * fadeZone = fraction of viewport height over which fade completes (e.g. 0.8 = 80%).
     */
    function getProgressInViewport(el, scrollY, maxScrollY) {
        var rect = el.getBoundingClientRect();
        var vh = window.innerHeight;
        var threshold = vh * config.fadeZone;
        if (rect.top >= vh) return 0;
        if (rect.top <= vh - threshold) return 1;
        // If we can't scroll far enough for `rect.top` to cross the full fade threshold
        // (common for the last section), scale progress so it still reaches 1 at max scroll.
        //
        // We compute the scrollY range over which the element would fade:
        // startY: when rect.top == vh   (progress = 0)
        // endY:   when rect.top == vh-threshold (progress = 1)
        // rangeY: endY - startY == threshold, but may be truncated by max scroll.
        var elementTopAbs = rect.top + scrollY;
        var startY = elementTopAbs - vh;
        var availableRange = maxScrollY - startY;
        if (availableRange <= 0) return 0;

        var effectiveRange = Math.min(threshold, availableRange);
        var raw = (scrollY - startY) / effectiveRange;
        return clamp01(raw);
    }

    /**
     * Progress 0..1 as we scroll through the container.
     */
    function getProgressScrollThrough(el) {
        var rect = el.getBoundingClientRect();
        var vh = window.innerHeight;
        var scrollY = window.scrollY || window.pageYOffset;
        var top = rect.top + scrollY;
        var height = rect.height;
        var start = top - vh;
        var range = height + vh;
        if (range <= 0) return 0;
        var p = (scrollY - start) / range;
        return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    function clamp01(value) {
        return value < 0 ? 0 : value > 1 ? 1 : value;
    }

    function parsePx(value) {
        if (!value) return 0;
        var s = String(value).trim();
        if (s.endsWith('px')) return parseInt(s.slice(0, -2), 10) || 0;
        return parseInt(s, 10) || 0;
    }

    window.initScrollAnim = function (container) {
        if (!container) return;
        var isMobile = (typeof window.mobileCheck === 'function') ? window.mobileCheck() : false;
        // On mobile we animate the timeline bar, but avoid opacity-driven fade.
        // Mobile CSS doesn’t set the same initial opacity state, so fading can cause content to disappear until scroll.
        var enableFade = !isMobile;

        var workSection = container.querySelector('#work');
        var workJobs = container.querySelectorAll('.work-job');
        var fadeCards = container.querySelectorAll(
            '.job-case-studies > .case-study-card-link, .job-case-studies > .case-study-card, ' +
            '.job-other-work > .case-study-card-link, .job-other-work > .case-study-card'
        );
        var projectsSection = container.querySelector('#projects');
        var projectCards = container.querySelectorAll('.projects-list > .project-card-link, .projects-list > .project-card');
        var talksSection = container.querySelector('#talks');
        var contactSection = container.querySelector('#contact');

        config.completed = new Set();
        var barHeights = [];

        if (!enableFade) {
            // Ensure mobile content stays visible (CSS is responsible for initial visibility on mobile).
            if (workSection) workSection.style.opacity = '1';
            for (var m = 0; m < fadeCards.length; m++) fadeCards[m].style.opacity = '1';
            if (projectsSection) projectsSection.style.opacity = '1';
            for (var n = 0; n < projectCards.length; n++) projectCards[n].style.opacity = '1';
            if (talksSection) talksSection.style.opacity = '1';
            if (contactSection) contactSection.style.opacity = '1';
        }

        function applyProgress(el, progress, key) {
            var th = config.threshold;
            if (config.playOnce && progress >= th && config.completed) config.completed.add(key);
            var use = (config.completed && config.completed.has(key)) ? 1 : clamp01(progress);
            return use;
        }

        function fadeProgress(raw) {
            return easeFade(clamp01(raw));
        }

        function update(dtMs) {
            if (!config.enabled) return;

            var scrollY = window.scrollY || window.pageYOffset || 0;
            var maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

            // Used to make the bar interpolation consistent even when frame timing varies.
            // Defaults to ~60fps if dt isn't provided.
            var frameMs = 1000 / 60;
            var dt = (typeof dtMs === 'number' && dtMs > 0) ? dtMs : frameMs;

            if (enableFade) {
                if (workSection) {
                    var p = fadeProgress(getProgressInViewport(workSection, scrollY, maxScrollY));
                    var use = applyProgress(workSection, p, 'work');
                    workSection.style.opacity = String(use);
                }
            }

            for (var i = 0; i < workJobs.length; i++) {
                var job = workJobs[i];
                var col = job.querySelector('.job-right-column.has-case-studies');
                var barEl = col ? col.querySelector('.job-timeline-scroll-bar') : null;
                if (config.barEnabled && col && barEl) {
                    var barP = getProgressScrollThrough(job);
                    var barPEased;
                    if (i > 0) {
                        var prevJob = workJobs[i - 1];
                        var prevBarP = getProgressScrollThrough(prevJob);
                        var prevBarPAdj = clamp01(prevBarP * config.barSensitivity);
                        var prevBarPEased = easeBar(prevBarPAdj);
                        if (prevBarPEased < 1) {
                            barPEased = 0;
                        } else {
                            var barPAdj = clamp01(barP * config.barSensitivity);
                            barPEased = easeBar(barPAdj);
                        }
                    } else {
                        var barPAdj = clamp01(barP * config.barSensitivity);
                        barPEased = easeBar(barPAdj);
                    }
                    var barUse = applyProgress(col, barPEased, 'bar-' + i);
                    var topPx = parsePx(getComputedStyle(col).getPropertyValue('--timeline-top'));
                    var fullHeight = col.offsetHeight - topPx;
                    if (fullHeight > 0) {
                        var barWidth = barEl.offsetWidth || 16;
                        var targetH = Math.max(barWidth, fullHeight * barUse);
                        if (typeof barHeights[i] !== 'number') barHeights[i] = targetH;
                        else {
                            // Convert the existing "per-frame" lerp factor into a time-based one,
                            // so the bar feels smooth regardless of scroll event cadence.
                            var frames = dt / frameMs;
                            var remaining = Math.pow(1 - config.barSmooth, frames);
                            var lerp = 1 - remaining; // 0..1
                            if (lerp < 0) lerp = 0;
                            if (lerp > 1) lerp = 1;
                            barHeights[i] += (targetH - barHeights[i]) * lerp;
                        }
                        barEl.style.height = barHeights[i] + 'px';
                    }
                } else if (barEl) {
                    barHeights[i] = 0;
                    barEl.style.height = '0px';
                }
            }

            if (enableFade) {
                for (var j = 0; j < fadeCards.length; j++) {
                    var card = fadeCards[j];
                    var cardP = fadeProgress(getProgressInViewport(card, scrollY, maxScrollY));
                    var cardUse = applyProgress(card, cardP, 'card-' + j);
                    card.style.opacity = String(cardUse);
                }

                if (projectsSection) {
                    var projP = fadeProgress(getProgressInViewport(projectsSection, scrollY, maxScrollY));
                    var projUse = applyProgress(projectsSection, projP, 'projects');
                    projectsSection.style.opacity = String(projUse);
                }
                for (var k = 0; k < projectCards.length; k++) {
                    var projCard = projectCards[k];
                    var projCardP = fadeProgress(getProgressInViewport(projCard, scrollY, maxScrollY));
                    var projCardUse = applyProgress(projCard, projCardP, 'project-' + k);
                    projCard.style.opacity = String(projCardUse);
                }
                if (talksSection) {
                    var talksP = fadeProgress(getProgressInViewport(talksSection, scrollY, maxScrollY));
                    var talksUse = applyProgress(talksSection, talksP, 'talks');
                    talksSection.style.opacity = String(talksUse);
                }
                if (contactSection) {
                    var contactP = fadeProgress(getProgressInViewport(contactSection, scrollY, maxScrollY));
                    var contactUse = applyProgress(contactSection, contactP, 'contact');
                    contactSection.style.opacity = String(contactUse);
                }
            }
        }

        update();

        // Run animation continuously while scrolling to avoid "notch" judder.
        var rafId = null;
        var isLooping = false;
        var stopTimer = null;
        var lastFrameTime = 0;

        function stopLoop() {
            isLooping = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
            if (stopTimer) clearTimeout(stopTimer);
            stopTimer = null;
        }

        function startLoop() {
            if (isLooping) return;
            if (!config.enabled) return;
            isLooping = true;
            lastFrameTime = performance.now();
            var frame = function (now) {
                if (!isLooping) return;
                if (!config.enabled) {
                    stopLoop();
                    return;
                }
                var dt = now - lastFrameTime;
                lastFrameTime = now;
                update(dt);
                rafId = requestAnimationFrame(frame);
            };
            rafId = requestAnimationFrame(frame);
        }

        function scheduleStop() {
            if (stopTimer) clearTimeout(stopTimer);
            // Keep looping briefly after wheel scrolling stops, so the bar eases into place.
            stopTimer = setTimeout(function () {
                stopLoop();
                update(1000 / 60);
            }, 120);
        }

        window.addEventListener('scroll', function () {
            startLoop();
            scheduleStop();
        }, { passive: true });

        window.addEventListener('resize', function () {
            // Resize can change rect geometry; update immediately (no need for a long loop).
            requestAnimationFrame(function () { update(1000 / 60); });
        });
    };

    /**
     * LEVA-style control panel. Call after initScrollAnim (e.g. from homepageGenerator).
     */
    window.createScrollAnimPanel = function () {
        if (typeof window.mobileCheck === 'function' && window.mobileCheck()) return;
        var panel = document.createElement('div');
        panel.className = 'scroll-anim-panel';
        panel.innerHTML =
            '<div class="scroll-anim-panel__title">Scroll anim</div>' +
            '<label class="scroll-anim-panel__row"><input type="checkbox" id="scroll-anim-enabled" checked> Enabled</label>' +
            '<div class="scroll-anim-panel__group">' +
            '<div class="scroll-anim-panel__group-title">Fade</div>' +
            '<label class="scroll-anim-panel__row"><input type="checkbox" id="scroll-anim-playOnce"> Play once</label>' +
            '<div class="scroll-anim-panel__row" title="When Play once is on: progress must reach this (0–1) before the element is marked done and no longer reverses. Higher = scroll further before it sticks."><span>Threshold</span><span id="scroll-anim-threshold-val">0.95</span></div>' +
            '<label class="scroll-anim-panel__row"><input type="range" id="scroll-anim-threshold" min="0" max="1" step="0.05" value="0.95"></label>' +
            '<div class="scroll-anim-panel__row"><span>Fade zone</span><span id="scroll-anim-fadeZone-val">0.8</span></div>' +
            '<label class="scroll-anim-panel__row"><input type="range" id="scroll-anim-fadeZone" min="0.1" max="1" step="0.05" value="0.8"></label>' +
            '<label class="scroll-anim-panel__row"><span>Easing</span><select id="scroll-anim-fadeEasing"><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="smooth" selected>Smooth</option></select></label>' +
            '</div>' +
            '<div class="scroll-anim-panel__group">' +
            '<div class="scroll-anim-panel__group-title">Line (timeline bar)</div>' +
            '<label class="scroll-anim-panel__row"><input type="checkbox" id="scroll-anim-barEnabled" checked> Animate bar</label>' +
            '<div class="scroll-anim-panel__row" title="How quickly the bar fills with scroll. &gt;1 = fills with less scrolling, &lt;1 = needs more scroll to fill."><span>Sensitivity</span><span id="scroll-anim-barSensitivity-val">1.25</span></div>' +
            '<label class="scroll-anim-panel__row"><input type="range" id="scroll-anim-barSensitivity" min="0.25" max="3" step="0.25" value="1.25"></label>' +
            '<label class="scroll-anim-panel__row"><span>Easing</span><select id="scroll-anim-barEasing"><option value="linear">Linear</option><option value="ease-in" selected>Ease in</option><option value="ease-out">Ease out</option><option value="smooth">Smooth</option></select></label>' +
            '<div class="scroll-anim-panel__row" title="Lerp factor per frame. Higher = snappier, lower = smoother/slower."><span>Smooth</span><span id="scroll-anim-barSmooth-val">0.12</span></div>' +
            '<label class="scroll-anim-panel__row"><input type="range" id="scroll-anim-barSmooth" min="0.02" max="0.5" step="0.02" value="0.12"></label>' +
            '</div>';
        document.body.appendChild(panel);

        var enabledEl = document.getElementById('scroll-anim-enabled');
        var playOnceEl = document.getElementById('scroll-anim-playOnce');
        var thresholdEl = document.getElementById('scroll-anim-threshold');
        var fadeZoneEl = document.getElementById('scroll-anim-fadeZone');
        var fadeEasingEl = document.getElementById('scroll-anim-fadeEasing');
        var barEnabledEl = document.getElementById('scroll-anim-barEnabled');
        var barSensitivityEl = document.getElementById('scroll-anim-barSensitivity');
        var barEasingEl = document.getElementById('scroll-anim-barEasing');
        var barSmoothEl = document.getElementById('scroll-anim-barSmooth');

        if (enabledEl) enabledEl.checked = config.enabled;
        if (playOnceEl) playOnceEl.checked = config.playOnce;
        if (thresholdEl) thresholdEl.value = config.threshold;
        if (fadeZoneEl) fadeZoneEl.value = config.fadeZone;
        if (fadeEasingEl) fadeEasingEl.value = config.fadeEasing;
        if (barEnabledEl) barEnabledEl.checked = config.barEnabled;
        if (barSensitivityEl) barSensitivityEl.value = config.barSensitivity;
        if (barEasingEl) barEasingEl.value = config.barEasing;
        if (barSmoothEl) barSmoothEl.value = config.barSmooth;

        function syncFromPanel() {
            config.enabled = enabledEl ? enabledEl.checked : true;
            var wasPlayOnce = config.playOnce;
            config.playOnce = playOnceEl ? playOnceEl.checked : false;
            if (wasPlayOnce && !config.playOnce && config.completed) config.completed.clear();
            config.threshold = thresholdEl ? parseFloat(thresholdEl.value, 10) : 0.95;
            config.fadeZone = fadeZoneEl ? parseFloat(fadeZoneEl.value, 10) : 0.8;
            config.fadeEasing = fadeEasingEl ? fadeEasingEl.value : 'smooth';
            config.barEnabled = barEnabledEl ? barEnabledEl.checked : true;
            config.barSensitivity = barSensitivityEl ? parseFloat(barSensitivityEl.value, 10) : 1.25;
            config.barEasing = barEasingEl ? barEasingEl.value : 'ease-in';
            config.barSmooth = barSmoothEl ? parseFloat(barSmoothEl.value, 10) : 0.12;
            var thVal = document.getElementById('scroll-anim-threshold-val');
            var fzVal = document.getElementById('scroll-anim-fadeZone-val');
            var barSensVal = document.getElementById('scroll-anim-barSensitivity-val');
            var barSmoothVal = document.getElementById('scroll-anim-barSmooth-val');
            if (thVal) thVal.textContent = config.threshold.toFixed(2);
            if (fzVal) fzVal.textContent = config.fadeZone.toFixed(2);
            if (barSensVal) barSensVal.textContent = config.barSensitivity.toFixed(2);
            if (barSmoothVal) barSmoothVal.textContent = config.barSmooth.toFixed(2);
        }

        panel.addEventListener('change', syncFromPanel);
        panel.addEventListener('input', syncFromPanel);
        syncFromPanel();
    };
})();
