/**
 * Scroll-linked fade-in and timeline bar growth.
 * Config: adjust defaults below, or in devtools `scrollAnimConfig.fadeZone = 0.5`, or
 * `createScrollAnimPanel()` for a floating slider (call from console on desktop).
 */
(function () {
    var config = {
        playOnce: false,
        threshold: 0.95,
        /**
         * Fade completes as the section crosses a band of height (viewport height × fadeZone).
         * Lower = full opacity/unblur after less scrolling (snappier). Higher = longer roll-in.
         * Typical range: 0.35–0.55 (fast) … 0.8 (slow).
         */
        fadeZone: 0.55,
        /** Shapes how progress maps inside that band: linear | ease-in | ease-out | smooth */
        fadeEasing: 'smooth',
        enabled: true,
        barEnabled: true,
        barSensitivity: 1.25,
        barEasing: 'ease-in',
        barSmooth: 0.12,
        completed: null
    };

    /** @type {typeof config} Mutable — tweak in browser console while testing. */
    window.scrollAnimConfig = config;

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

    /**
     * Scroll stagger between title and body (~100ms equivalent in fade-zone progress).
     * Matches split-and-stagger enter guidance from make-interfaces-feel-better.
     */
    var STAGGER_RAW = 0.1;

    /**
     * Body chunk lags title by STAGGER_RAW in raw progress, but still reaches raw=1 when the section does.
     * (Subtract-only stagger never reaches eased 1 → stuck blur/opacity on Talks etc.)
     */
    function staggeredBodyRaw(raw) {
        if (raw <= 0) return 0;
        if (raw >= 1) return 1;
        if (raw <= STAGGER_RAW) return 0;
        return (raw - STAGGER_RAW) / (1 - STAGGER_RAW);
    }

    /**
     * Enter: opacity + translateY(12px→0); optional blur (4px→0).
     * The projects *list* wrapper stays opacity-only so we don’t blur the whole column as one layer; each card blurs like case studies.
     */
    function applyScrollReveal(el, progress, useBlur) {
        if (!el) return;
        var p = clamp01(progress);
        el.style.opacity = String(p);
        el.style.transform = 'translateY(' + 12 * (1 - p) + 'px)';
        if (useBlur) {
            el.style.filter = 'blur(' + 4 * (1 - p) + 'px)';
        } else {
            el.style.filter = 'none';
        }
    }

    /** Staggered fade for wrappers that contain nested scroll-reveal cards (opacity only; no stacked transforms). */
    function applyScrollRevealOpacity(el, progress) {
        if (!el) return;
        var p = clamp01(progress);
        el.style.opacity = String(p);
        el.style.transform = 'none';
        el.style.filter = 'none';
    }

    function resetAllScrollRevealChunks(container) {
        if (!container) return;
        var chunks = container.querySelectorAll('.scroll-reveal-chunk');
        for (var i = 0; i < chunks.length; i++) {
            var ch = chunks[i];
            ch.style.opacity = '1';
            ch.style.transform = '';
            ch.style.filter = '';
        }
    }

    window.initScrollAnim = function (container) {
        if (!container) return;
        var isMobile = (typeof window.mobileCheck === 'function') ? window.mobileCheck() : false;
        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            config.barSmooth = 1;
        }
        // On mobile we animate the timeline bar, but avoid opacity-driven fade.
        // Mobile CSS doesn’t set the same initial opacity state, so fading can cause content to disappear until scroll.
        // Respect reduced motion: no scroll-linked fade; timeline bar snaps without lerp.
        var enableFade = !isMobile && !prefersReducedMotion;

        var aboutSection = container.querySelector('#about');
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
            // Ensure mobile / reduced-motion content stays visible (CSS also resets .scroll-reveal-chunk).
            resetAllScrollRevealChunks(container);
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
                if (aboutSection) {
                    var aboutRaw = getProgressInViewport(aboutSection, scrollY, maxScrollY);
                    var aboutTitleP = fadeProgress(aboutRaw);
                    var aboutBodyRaw = staggeredBodyRaw(aboutRaw);
                    var aboutBodyP = fadeProgress(aboutBodyRaw);
                    var aboutTitleUse = applyProgress(aboutSection, aboutTitleP, 'about');
                    var aboutBodyUse = applyProgress(aboutSection, aboutBodyP, 'about');
                    // At scroll top, About is often still in the “fade zone” (below the upper band
                    // of the viewport) but should read at full opacity.
                    if (scrollY <= 1) {
                        aboutTitleUse = 1;
                        aboutBodyUse = 1;
                    }
                    applyScrollReveal(aboutSection.querySelector('.section-title'), aboutTitleUse, true);
                    applyScrollReveal(aboutSection.querySelector('.about-content'), aboutBodyUse, true);
                }
                if (workSection) {
                    var workRaw = getProgressInViewport(workSection, scrollY, maxScrollY);
                    var workTitleP = fadeProgress(workRaw);
                    var workBodyRaw = staggeredBodyRaw(workRaw);
                    var workBodyP = fadeProgress(workBodyRaw);
                    var workTitleUse = applyProgress(workSection, workTitleP, 'work');
                    var workBodyUse = applyProgress(workSection, workBodyP, 'work');
                    applyScrollReveal(workSection.querySelector('.section-title'), workTitleUse, true);
                    applyScrollRevealOpacity(workSection.querySelector('.work-jobs'), workBodyUse);
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
                    applyScrollReveal(card, cardUse, true);
                }

                if (projectsSection) {
                    var projRaw = getProgressInViewport(projectsSection, scrollY, maxScrollY);
                    var projTitleP = fadeProgress(projRaw);
                    var projBodyRaw = staggeredBodyRaw(projRaw);
                    var projBodyP = fadeProgress(projBodyRaw);
                    var projTitleUse = applyProgress(projectsSection, projTitleP, 'projects');
                    var projBodyUse = applyProgress(projectsSection, projBodyP, 'projects');
                    applyScrollReveal(projectsSection.querySelector('.section-title'), projTitleUse, true);
                    applyScrollRevealOpacity(projectsSection.querySelector('.projects-list'), projBodyUse);
                }
                for (var k = 0; k < projectCards.length; k++) {
                    var projCard = projectCards[k];
                    var projCardP = fadeProgress(getProgressInViewport(projCard, scrollY, maxScrollY));
                    var projCardUse = applyProgress(projCard, projCardP, 'project-' + k);
                    applyScrollReveal(projCard, projCardUse, true);
                }
                if (talksSection) {
                    var talksRaw = getProgressInViewport(talksSection, scrollY, maxScrollY);
                    var talksTitleP = fadeProgress(talksRaw);
                    var talksBodyRaw = staggeredBodyRaw(talksRaw);
                    var talksBodyP = fadeProgress(talksBodyRaw);
                    var talksTitleUse = applyProgress(talksSection, talksTitleP, 'talks');
                    var talksBodyUse = applyProgress(talksSection, talksBodyP, 'talks');
                    applyScrollReveal(talksSection.querySelector('.section-title'), talksTitleUse, true);
                    applyScrollReveal(talksSection.querySelector('.talks-list'), talksBodyUse, true);
                }
                if (contactSection) {
                    var contactRaw = getProgressInViewport(contactSection, scrollY, maxScrollY);
                    var contactTitleP = fadeProgress(contactRaw);
                    var contactBodyRaw = staggeredBodyRaw(contactRaw);
                    var contactBodyP = fadeProgress(contactBodyRaw);
                    var contactTitleUse = applyProgress(contactSection, contactTitleP, 'contact');
                    var contactBodyUse = applyProgress(contactSection, contactBodyP, 'contact');
                    applyScrollReveal(contactSection.querySelector('.section-title'), contactTitleUse, true);
                    applyScrollRevealOpacity(contactSection.querySelector('.contact-content'), contactBodyUse);
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

        var resizeDebounceTimer = null;
        window.addEventListener('resize', function () {
            if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
            resizeDebounceTimer = setTimeout(function () {
                resizeDebounceTimer = null;
                requestAnimationFrame(function () { update(1000 / 60); });
            }, 120);
        });
    };

    /**
     * If scroll animation fails or leaves sections invisible, force full opacity (recovery).
     */
    window.forceVisibleScrollSections = function (container) {
        if (!container) return;
        resetAllScrollRevealChunks(container);
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
            '<div class="scroll-anim-panel__row" title="Lower = full fade/unblur in less scroll distance. Higher = longer roll-in."><span>Fade zone</span><span id="scroll-anim-fadeZone-val">0.55</span></div>' +
            '<label class="scroll-anim-panel__row"><input type="range" id="scroll-anim-fadeZone" min="0.1" max="1" step="0.05" value="0.55"></label>' +
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
            config.fadeZone = fadeZoneEl ? parseFloat(fadeZoneEl.value, 10) : 0.55;
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
