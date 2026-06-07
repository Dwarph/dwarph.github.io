/**
 * Before/after compare slider for case study pages.
 * Finds `.cs-compare` roots, enhances DOM, handles drag + intro animation.
 */
(function () {
    'use strict';

    var INTRO_KEYFRAMES = [
        { at: 0, pos: 0 },
        { at: 0.35, pos: 85 },
        { at: 0.7, pos: 15 },
        { at: 1, pos: 50 }
    ];
    var INTRO_DURATION_MS = 2400;
    var KEYBOARD_STEP = 5;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function sampleIntroPosition(progress) {
        var p = clamp(progress, 0, 1);
        for (var i = 0; i < INTRO_KEYFRAMES.length - 1; i++) {
            var a = INTRO_KEYFRAMES[i];
            var b = INTRO_KEYFRAMES[i + 1];
            if (p >= a.at && p <= b.at) {
                var local = b.at === a.at ? 1 : (p - a.at) / (b.at - a.at);
                return a.pos + (b.pos - a.pos) * easeInOut(local);
            }
        }
        return INTRO_KEYFRAMES[INTRO_KEYFRAMES.length - 1].pos;
    }

    function setPosition(root, handle, pos) {
        var value = clamp(pos, 0, 100);
        root.style.setProperty('--compare-pos', value + '%');
        root.dataset.comparePos = String(Math.round(value));
        if (handle) {
            handle.setAttribute('aria-valuenow', String(Math.round(value)));
        }
        return value;
    }

    function positionFromPointer(root, clientX) {
        var rect = root.getBoundingClientRect();
        if (!rect.width) return 50;
        return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    }

    function syncCompareWidth(root) {
        var width = root.offsetWidth;
        if (width > 0) {
            root.style.setProperty('--compare-width', width + 'px');
        }
    }

    function buildCompareSlider(root) {
        if (root.__compareInitialized) return null;
        root.__compareInitialized = true;

        var beforeImg = root.querySelector('.cs-compare__img--before');
        var afterImg = root.querySelector('.cs-compare__img--after');
        if (!beforeImg || !afterImg) return null;

        var reveal = document.createElement('div');
        reveal.className = 'cs-compare__reveal';
        afterImg.parentNode.insertBefore(reveal, afterImg);
        reveal.appendChild(afterImg);

        var beforeLabel = document.createElement('span');
        beforeLabel.className = 'cs-compare__label cs-compare__label--before';
        beforeLabel.setAttribute('aria-hidden', 'true');
        beforeLabel.textContent = 'Before';
        root.insertBefore(beforeLabel, reveal);

        var afterLabel = document.createElement('span');
        afterLabel.className = 'cs-compare__label cs-compare__label--after';
        afterLabel.setAttribute('aria-hidden', 'true');
        afterLabel.textContent = 'After';
        reveal.appendChild(afterLabel);

        var handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'cs-compare__handle';
        handle.setAttribute('role', 'slider');
        handle.setAttribute('aria-label', 'Compare before and after');
        handle.setAttribute('aria-valuemin', '0');
        handle.setAttribute('aria-valuemax', '100');
        handle.setAttribute('aria-valuenow', '50');
        handle.innerHTML =
            '<span class="cs-compare__handle-grip" aria-hidden="true">' +
            '<span class="material-icons cs-compare__handle-icon" aria-hidden="true">chevron_left</span>' +
            '<span class="material-icons cs-compare__handle-icon" aria-hidden="true">chevron_right</span>' +
            '</span>';
        root.appendChild(handle);

        syncCompareWidth(root);
        setPosition(root, handle, prefersReducedMotion() ? 50 : 0);

        function syncWhenReady() {
            syncCompareWidth(root);
        }

        if (beforeImg.complete && afterImg.complete) {
            syncWhenReady();
        } else {
            beforeImg.addEventListener('load', syncWhenReady);
            afterImg.addEventListener('load', syncWhenReady);
        }

        window.addEventListener('orientationchange', syncWhenReady);

        var state = {
            dragging: false,
            introFrame: null,
            introStarted: false,
            introDone: prefersReducedMotion(),
            onDragMove: null,
            onDragEnd: null
        };

        function onResize() {
            syncCompareWidth(root);
        }

        if (typeof ResizeObserver === 'function') {
            var ro = new ResizeObserver(onResize);
            ro.observe(root);
        } else {
            window.addEventListener('resize', onResize);
        }

        function cancelIntro() {
            if (state.introFrame !== null) {
                cancelAnimationFrame(state.introFrame);
                state.introFrame = null;
            }
            state.introDone = true;
        }

        function playIntro() {
            if (state.introDone || state.introStarted) return;
            state.introStarted = true;
            syncCompareWidth(root);

            if (prefersReducedMotion()) {
                setPosition(root, handle, 50);
                state.introDone = true;
                return;
            }

            var start = null;
            function tick(now) {
                if (state.introDone || state.dragging) {
                    state.introFrame = null;
                    return;
                }
                if (start === null) start = now;
                var progress = clamp((now - start) / INTRO_DURATION_MS, 0, 1);
                setPosition(root, handle, sampleIntroPosition(progress));
                if (progress < 1) {
                    state.introFrame = requestAnimationFrame(tick);
                } else {
                    state.introFrame = null;
                    state.introDone = true;
                }
            }
            state.introFrame = requestAnimationFrame(tick);
        }

        function detachDragListeners() {
            if (!state.onDragMove) return;
            window.removeEventListener('pointermove', state.onDragMove);
            window.removeEventListener('pointerup', state.onDragEnd);
            window.removeEventListener('pointercancel', state.onDragEnd);
            state.onDragMove = null;
            state.onDragEnd = null;
        }

        function endDrag() {
            if (!state.dragging) return;
            state.dragging = false;
            root.classList.remove('cs-compare--dragging');
            detachDragListeners();
        }

        function onPointerDown(e) {
            if (state.dragging) return;
            if (e.button !== undefined && e.button !== 0) return;
            cancelIntro();
            state.dragging = true;
            root.classList.add('cs-compare--dragging');
            setPosition(root, handle, positionFromPointer(root, e.clientX));
            e.preventDefault();

            state.onDragMove = function (moveEvent) {
                if (!state.dragging) return;
                setPosition(root, handle, positionFromPointer(root, moveEvent.clientX));
                moveEvent.preventDefault();
            };

            state.onDragEnd = function () {
                endDrag();
            };

            window.addEventListener('pointermove', state.onDragMove, { passive: false });
            window.addEventListener('pointerup', state.onDragEnd);
            window.addEventListener('pointercancel', state.onDragEnd);
        }

        function onKeyDown(e) {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') {
                return;
            }
            cancelIntro();
            var current = Number(root.dataset.comparePos || 50);
            var next = current;
            if (e.key === 'ArrowLeft') next = current - KEYBOARD_STEP;
            if (e.key === 'ArrowRight') next = current + KEYBOARD_STEP;
            if (e.key === 'Home') next = 0;
            if (e.key === 'End') next = 100;
            setPosition(root, handle, next);
            e.preventDefault();
        }

        root.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('keydown', onKeyDown);

        return { playIntro: playIntro };
    }

    window.initCaseStudyCompare = function (rootEl) {
        if (!rootEl) return;

        var scope = rootEl.querySelector('.case-study-content');
        if (!scope) return;

        var roots = scope.querySelectorAll('.cs-compare');
        if (!roots.length) return;

        var instances = [];
        for (var i = 0; i < roots.length; i++) {
            var instance = buildCompareSlider(roots[i]);
            if (instance) {
                instances.push({ root: roots[i], api: instance });
            }
        }

        if (!instances.length) return;

        if (typeof IntersectionObserver !== 'function' || prefersReducedMotion()) {
            for (var j = 0; j < instances.length; j++) {
                instances[j].api.playIntro();
            }
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                for (var e = 0; e < entries.length; e++) {
                    var entry = entries[e];
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
                        var target = entry.target;
                        if (target.__compareIntroApi) {
                            target.__compareIntroApi.playIntro();
                        }
                        observer.unobserve(target);
                    }
                }
            },
            { threshold: [0, 0.35, 0.5] }
        );

        for (var k = 0; k < instances.length; k++) {
            instances[k].root.__compareIntroApi = instances[k].api;
            observer.observe(instances[k].root);
        }
    };
})();
