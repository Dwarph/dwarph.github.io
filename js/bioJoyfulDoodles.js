/**
 * Bio "joyful and inevitable" click → sun/flower trail in the CV–Work whitespace.
 */
(function () {
    var SHOW_CONTROLS_PANEL = false;
    var STORAGE_KEY = 'bioJoyfulDoodlesControls.v7';

    var DEFAULTS = {
        doodlesMin: 6,
        doodlesMax: 74,
        maxConcurrent: 64,
        revealDurationMs: 1475,
        revealStaggerMs: 60,
        holdDurationMs: 150,
        fadeDurationMs: 200,
        viewportMarginPx: 12,
        baseSizePx: 42,
        scaleMin: 0.88,
        scaleMax: 1.08,
        scaleJitter: 0.06,
        rotationMaxDeg: 180,
        whitespaceGapPx: 8,
        minDoodleSeparationPx: 10,
        reducedHoldMs: 200,
        reducedFadeMs: 400,
    };

    var SLIDER_DEFS = [
        { key: 'doodlesMin', label: 'Count min', min: 1, max: 80, step: 1, group: 'Spawn' },
        { key: 'doodlesMax', label: 'Count max', min: 1, max: 100, step: 1, group: 'Spawn' },
        { key: 'baseSizePx', label: 'Size', min: 20, max: 80, step: 1, group: 'Look' },
        { key: 'scaleMin', label: 'Scale min', min: 0.5, max: 1.5, step: 0.01, group: 'Look' },
        { key: 'scaleMax', label: 'Scale max', min: 0.5, max: 1.5, step: 0.01, group: 'Look' },
        { key: 'scaleJitter', label: 'Scale jitter', min: 0, max: 0.2, step: 0.01, group: 'Look' },
        { key: 'rotationMaxDeg', label: 'Rotation ±°', min: 0, max: 180, step: 1, group: 'Look' },
        { key: 'minDoodleSeparationPx', label: 'Spacing', min: 0, max: 80, step: 1, group: 'Trail' },
        { key: 'whitespaceGapPx', label: 'Strip gap', min: 0, max: 32, step: 1, group: 'Trail' },
        { key: 'viewportMarginPx', label: 'Page margin', min: 0, max: 48, step: 1, group: 'Trail' },
        { key: 'revealDurationMs', label: 'Reveal', min: 300, max: 4000, step: 25, group: 'Timing' },
        { key: 'revealStaggerMs', label: 'Stagger', min: 0, max: 600, step: 10, group: 'Timing' },
        { key: 'holdDurationMs', label: 'Hold', min: 0, max: 3000, step: 50, group: 'Timing' },
        { key: 'fadeDurationMs', label: 'Fade', min: 150, max: 3000, step: 50, group: 'Timing' },
    ];

    var CONFIG = mergeConfig(readStored());
    window.bioJoyfulDoodlesConfig = CONFIG;

    var SVG_URLS = [
        { id: 'sun', url: './images/svgs/sun.svg' },
        { id: 'flower1', url: './images/svgs/flower%201.svg' },
        { id: 'flower2', url: './images/svgs/flower%202.svg' },
        { id: 'flower3', url: './images/svgs/flower%203.svg' },
    ];

    var layerEl = null;
    var svgCache = null;
    var loadPromise = null;
    var previewTrigger = null;
    var spawnSession = 0;

    function readStored() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function writeStored(config) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            /* ignore */
        }
    }

    function mergeConfig(stored) {
        var merged = Object.assign({}, DEFAULTS);
        if (!stored || typeof stored !== 'object') return merged;

        function num(key, min, max, round) {
            if (typeof stored[key] !== 'number' || !Number.isFinite(stored[key])) return;
            var v = clamp(stored[key], min, max);
            merged[key] = round ? Math.round(v) : v;
        }

        num('doodlesMin', 1, 80, true);
        num('doodlesMax', 1, 100, true);
        num('maxConcurrent', 4, 120, true);
        num('revealDurationMs', 300, 4000, true);
        num('revealStaggerMs', 0, 600, true);
        num('holdDurationMs', 0, 3000, true);
        num('fadeDurationMs', 150, 3000, true);
        num('viewportMarginPx', 0, 48, true);
        num('baseSizePx', 20, 80, true);
        num('scaleMin', 0.5, 1.5, false);
        num('scaleMax', 0.5, 1.5, false);
        num('scaleJitter', 0, 0.2, false);
        num('rotationMaxDeg', 0, 180, true);
        num('whitespaceGapPx', 0, 32, true);
        num('minDoodleSeparationPx', 0, 80, true);
        num('reducedHoldMs', 0, 1000, true);
        num('reducedFadeMs', 100, 1500, true);

        if (merged.doodlesMin > merged.doodlesMax) {
            merged.doodlesMax = merged.doodlesMin;
        }
        if (merged.scaleMin > merged.scaleMax) {
            merged.scaleMax = merged.scaleMin;
        }

        return merged;
    }

    function applyConfig(patch) {
        Object.assign(CONFIG, mergeConfig(Object.assign({}, CONFIG, patch)));
        writeStored(CONFIG);
    }

    function formatControlValue(key, v) {
        if (key.indexOf('Ms') !== -1 || key.indexOf('Px') !== -1 || key.indexOf('Deg') !== -1) {
            return String(Math.round(v));
        }
        if (key.indexOf('scale') === 0) {
            return v.toFixed(2);
        }
        return String(v);
    }

    function valuesEqual(key, a, b) {
        if (key.indexOf('Ms') !== -1 || key.indexOf('Px') !== -1 || key.indexOf('Deg') !== -1) {
            return Math.round(a) === Math.round(b);
        }
        if (key.indexOf('scale') === 0) {
            return Math.abs(a - b) < 0.0001;
        }
        return Math.abs(a - b) < 0.0001;
    }

    function isNonDefault(key, value) {
        return !valuesEqual(key, value, DEFAULTS[key]);
    }

    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(ta);
                resolve();
            } catch (err) {
                document.body.removeChild(ta);
                reject(err);
            }
        });
    }

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function randomInt(min, max) {
        return Math.floor(randomBetween(min, max + 1));
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeSvgMarkup(text) {
        return text
            .replace(/<\?xml[\s\S]*?\?>/gi, '')
            .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
            .replace(/fill\s*=\s*["']#FFC405["']/gi, 'fill="currentColor"')
            .replace(/fill\s*=\s*["']#ffc405["']/gi, 'fill="currentColor"');
    }

    function getScrollX() {
        return window.pageXOffset || document.documentElement.scrollLeft || 0;
    }

    function getScrollY() {
        return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function clientToPageX(x) {
        return x + getScrollX();
    }

    function clientToPageY(y) {
        return y + getScrollY();
    }

    function syncLayerSize() {
        if (!layerEl) return;
        var docHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.clientHeight
        );
        layerEl.style.height = docHeight + 'px';
    }

    function ensureLayer() {
        if (layerEl && layerEl.parentNode) {
            syncLayerSize();
            return layerEl;
        }
        layerEl = document.getElementById('bio-joyful-doodle-layer');
        if (layerEl) {
            syncLayerSize();
            return layerEl;
        }
        layerEl = document.createElement('div');
        layerEl.id = 'bio-joyful-doodle-layer';
        layerEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layerEl);
        syncLayerSize();
        return layerEl;
    }

    function loadSvgs() {
        if (svgCache) return Promise.resolve(svgCache);
        if (loadPromise) return loadPromise;

        loadPromise = Promise.all(
            SVG_URLS.map(function (entry) {
                return fetch(entry.url)
                    .then(function (res) {
                        if (!res.ok) throw new Error('Failed to load ' + entry.url);
                        return res.text();
                    })
                    .then(function (text) {
                        return { id: entry.id, markup: normalizeSvgMarkup(text) };
                    });
            })
        )
            .then(function (entries) {
                svgCache = {};
                for (var i = 0; i < entries.length; i++) {
                    svgCache[entries[i].id] = entries[i].markup;
                }
                return svgCache;
            })
            .catch(function () {
                loadPromise = null;
                return null;
            });

        return loadPromise;
    }

    function pickDoodleIds(count) {
        var pool = ['sun', 'flower1', 'flower2', 'flower3'];
        var picked = [];
        for (var n = 0; n < count; n++) {
            picked.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        return picked;
    }

    function getDoodleRadius(scale) {
        return CONFIG.baseSizePx * scale * 0.55;
    }

    function isWithinPage(x, y, radius) {
        var margin = CONFIG.viewportMarginPx;
        var maxW = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
            document.documentElement.clientWidth
        );
        var maxH = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.clientHeight
        );
        return (
            x >= margin + radius &&
            x <= maxW - margin - radius &&
            y >= margin + radius &&
            y <= maxH - margin - radius
        );
    }

    function getPageWidth() {
        return Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
            document.documentElement.clientWidth
        );
    }

    function getTrailStrip(contentEl) {
        if (!contentEl) return null;

        var cvLink = contentEl.querySelector('.cv-download-link');
        var workSection = document.getElementById('work');
        if (!cvLink || !workSection) return null;

        var cvRect = cvLink.getBoundingClientRect();
        var workTitle = workSection.querySelector('.section-title, h2');
        var workTop = workTitle
            ? workTitle.getBoundingClientRect().top
            : workSection.getBoundingClientRect().top;
        var gap = CONFIG.whitespaceGapPx;
        var top = cvRect.bottom + gap * 0.5;
        var bottom = workTop - gap * 0.5;

        if (bottom <= top) {
            top = cvRect.bottom;
            bottom = workTop;
        }

        if (bottom <= top) return null;

        var height = bottom - top;
        var margin = CONFIG.viewportMarginPx;
        var pageW = getPageWidth();

        return {
            left: margin,
            right: pageW - margin,
            top: clientToPageY(top),
            bottom: clientToPageY(bottom),
            midY: clientToPageY(top + height * 0.5),
            height: height,
        };
    }

    function trailMinGap(radiusA, radiusB) {
        return Math.max(
            CONFIG.minDoodleSeparationPx,
            (radiusA + radiusB) * 0.42
        );
    }

    function isTrailPointClear(x, y, radius, placed) {
        for (var i = 0; i < placed.length; i++) {
            var other = placed[i];
            var otherRadius = getDoodleRadius(other.scale);
            var dx = x - other.x;
            var dy = y - other.y;
            var minDist = trailMinGap(radius, otherRadius);
            if (dx * dx + dy * dy < minDist * minDist) return false;
        }
        return true;
    }

    function pickDoodleScale() {
        var scale = randomBetween(CONFIG.scaleMin, CONFIG.scaleMax);
        scale += randomBetween(-CONFIG.scaleJitter, CONFIG.scaleJitter);
        var floor = Math.max(0.4, CONFIG.scaleMin - CONFIG.scaleJitter);
        var ceil = Math.min(1.6, CONFIG.scaleMax + CONFIG.scaleJitter);
        return clamp(scale, floor, ceil);
    }

    function tryPlaceTrailPoint(x, y, scale, placed, strip, ySpread, force) {
        var radius = getDoodleRadius(scale);
        var xMin = strip.left + 2;
        var xMax = strip.right - 2;

        for (var attempt = 0; attempt < (force ? 1 : 12); attempt++) {
            var tryX = x;
            var tryY = y;

            if (!force) {
                tryX += randomBetween(-10, 10) * (attempt > 0 ? 1 : 0.35);
                tryY +=
                    randomBetween(-ySpread, ySpread) +
                    (attempt > 2 ? randomBetween(-8, 8) : 0);
            }

            tryX = clamp(tryX, xMin, xMax);

            if (!isWithinPage(tryX, tryY, radius)) {
                if (force) return { x: tryX, y: tryY, scale: scale };
                continue;
            }
            if (!force && !isTrailPointClear(tryX, tryY, radius, placed)) continue;

            return { x: tryX, y: tryY, scale: scale };
        }

        return null;
    }

    function pickTrailPositions(contentEl, count) {
        var strip = getTrailStrip(contentEl);
        if (!strip || count < 1) return [];

        var positions = [];
        var travelMin = strip.left;
        var travelMax = strip.right;
        var travelWidth = travelMax - travelMin;

        if (travelWidth < 24) return [];

        var xMin = travelMin + 2;
        var xMax = travelMax - 2;
        var span = xMax - xMin;
        var ySpread = Math.max(strip.height * 0.55, CONFIG.baseSizePx * CONFIG.scaleMax * 0.35);
        var step = span / Math.max(count - 1, 1);

        for (var i = 0; i < count; i++) {
            var scale = pickDoodleScale();
            var isFirst = i === 0;
            var isLast = i === count - 1;
            var t = count === 1 ? 0.5 : i / (count - 1);
            var x = xMin + t * span;

            if (isFirst) {
                x = xMin + randomBetween(0, Math.min(8, step * 0.2));
            } else if (isLast) {
                x = xMax - randomBetween(0, Math.min(8, step * 0.2));
            } else {
                x += randomBetween(-step * 0.4, step * 0.4);
                x = clamp(x, xMin, xMax);
            }

            var point = tryPlaceTrailPoint(
                x,
                strip.midY,
                scale,
                positions,
                strip,
                ySpread,
                false
            );

            if (!point && (isFirst || isLast)) {
                point = tryPlaceTrailPoint(
                    isFirst ? xMin : xMax,
                    strip.midY,
                    scale,
                    positions,
                    strip,
                    ySpread,
                    true
                );
            }

            if (point) positions.push(point);
        }

        positions.sort(function (a, b) {
            return a.x - b.x;
        });

        return positions;
    }

    function removeDoodle(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    function cancelDoodleAnimations(el) {
        el.__joyfulGen = (el.__joyfulGen || 0) + 1;
        var clip = el.__clipEl;
        if (clip) {
            clip.style.transition = 'none';
        }
        if (typeof el.getAnimations === 'function') {
            el.getAnimations().forEach(function (anim) {
                anim.cancel();
            });
        }
        if (clip && typeof clip.getAnimations === 'function') {
            clip.getAnimations().forEach(function (anim) {
                anim.cancel();
            });
        }
    }

    function fadeOutDoodle(el, fadeMs, done) {
        cancelDoodleAnimations(el);
        var opacity = parseFloat(window.getComputedStyle(el).opacity);
        if (!Number.isFinite(opacity)) opacity = 1;

        if (fadeMs <= 0 || opacity <= 0.01) {
            removeDoodle(el);
            if (done) done();
            return;
        }

        var finished = false;
        function finish() {
            if (finished) return;
            finished = true;
            removeDoodle(el);
            if (done) done();
        }

        var fade = el.animate([{ opacity: opacity }, { opacity: 0 }], {
            duration: fadeMs,
            easing: 'ease-out',
            fill: 'forwards',
        });
        fade.onfinish = finish;
        fade.oncancel = finish;
    }

    function fadeOutPreviousSessions(layer, currentSession) {
        var list = Array.prototype.slice
            .call(layer.querySelectorAll('.bio-joyful-doodle'))
            .filter(function (el) {
                return el.__spawnSession !== currentSession;
            });

        if (!list.length) return;

        var fadeMs = prefersReducedMotion() ? CONFIG.reducedFadeMs : CONFIG.fadeDurationMs;
        var i;

        for (i = 0; i < list.length; i++) {
            fadeOutDoodle(list[i], fadeMs);
        }
    }

    function countSessionDoodles(layer, session) {
        var list = layer.querySelectorAll('.bio-joyful-doodle');
        var n = 0;
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].__spawnSession === session) n += 1;
        }
        return n;
    }

    function trimOldestSessionDoodles(layer, session, incomingCount) {
        var limit = CONFIG.maxConcurrent;
        var toRemove = countSessionDoodles(layer, session) + incomingCount - limit;
        if (toRemove <= 0) return;

        var list = Array.prototype.slice
            .call(layer.querySelectorAll('.bio-joyful-doodle'))
            .filter(function (el) {
                return el.__spawnSession === session;
            });

        for (var i = 0; i < toRemove && list.length; i++) {
            removeDoodle(list[i]);
        }
    }

    function setClipClosed(clipEl) {
        clipEl.style.clipPath = 'circle(0% at 50% 50%)';
        clipEl.style.webkitClipPath = 'circle(0% at 50% 50%)';
    }

    function setClipOpen(clipEl) {
        clipEl.style.clipPath = 'circle(120% at 50% 50%)';
        clipEl.style.webkitClipPath = 'circle(120% at 50% 50%)';
    }

    function clipBoxHeightFromSvg(svg) {
        var heightPx = CONFIG.baseSizePx;
        if (!svg) return heightPx;
        var vb = svg.getAttribute('viewBox');
        if (vb) {
            var parts = vb.trim().split(/[\s,]+/);
            if (parts.length >= 4) {
                var vw = parseFloat(parts[2]);
                var vh = parseFloat(parts[3]);
                if (vw > 0 && vh > 0) {
                    heightPx = Math.round(CONFIG.baseSizePx * (vh / vw));
                }
            }
        }
        return heightPx;
    }

    function pickDoodleRotation() {
        var max = CONFIG.rotationMaxDeg;
        return randomBetween(-max, max);
    }

    function createDoodleElement(markup, scale, rotationDeg) {
        var el = document.createElement('div');
        el.className = 'bio-joyful-doodle';
        el.setAttribute('aria-hidden', 'true');

        var clip = document.createElement('div');
        clip.className = 'bio-joyful-doodle__clip';
        clip.innerHTML = markup;

        var svg = clip.querySelector('svg');
        var clipHeight = clipBoxHeightFromSvg(svg);
        if (svg) {
            svg.setAttribute('width', String(CONFIG.baseSizePx));
            svg.removeAttribute('height');
            svg.style.display = 'block';
            svg.style.width = CONFIG.baseSizePx + 'px';
            svg.style.height = 'auto';
        }
        clip.style.width = CONFIG.baseSizePx + 'px';
        clip.style.height = clipHeight + 'px';
        setClipClosed(clip);

        el.appendChild(clip);
        el.__clipEl = clip;
        el.style.transform =
            'translate(-50%, -50%) scale(' + scale + ') rotate(' + rotationDeg + 'deg)';
        return el;
    }

    function animateDoodle(el, x, y, staggerIndex, reducedMotion) {
        var revealMs = reducedMotion ? 0 : CONFIG.revealDurationMs;
        var holdMs = reducedMotion ? CONFIG.reducedHoldMs : CONFIG.holdDurationMs;
        var fadeMs = reducedMotion ? CONFIG.reducedFadeMs : CONFIG.fadeDurationMs;
        var delayMs = reducedMotion ? 0 : staggerIndex * CONFIG.revealStaggerMs;
        var gen = (el.__joyfulGen = (el.__joyfulGen || 0) + 1);

        el.style.position = 'absolute';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.opacity = '1';

        function runFade() {
            if (el.__joyfulGen !== gen) return;
            var fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: fadeMs,
                easing: 'ease-out',
                fill: 'forwards',
            });
            fade.onfinish = function () {
                if (el.__joyfulGen !== gen) return;
                removeDoodle(el);
            };
            fade.oncancel = function () {
                if (el.__joyfulGen !== gen) return;
                removeDoodle(el);
            };
        }

        function startReveal() {
            if (el.__joyfulGen !== gen) return;

            var clip = el.__clipEl;
            if (!clip) return;

            if (reducedMotion) {
                setClipOpen(clip);
                window.setTimeout(function () {
                    if (el.__joyfulGen !== gen) return;
                    runFade();
                }, holdMs);
                return;
            }

            var revealEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';

            setClipClosed(clip);
            clip.style.transition = 'none';
            void clip.offsetWidth;

            requestAnimationFrame(function () {
                if (el.__joyfulGen !== gen) return;

                clip.style.transition =
                    'clip-path ' +
                    revealMs +
                    'ms ' +
                    revealEasing +
                    ', -webkit-clip-path ' +
                    revealMs +
                    'ms ' +
                    revealEasing;

                requestAnimationFrame(function () {
                    if (el.__joyfulGen !== gen) return;

                    var finished = false;
                    function afterReveal() {
                        if (finished || el.__joyfulGen !== gen) return;
                        finished = true;
                        clip.removeEventListener('transitionend', onTransitionEnd);
                        setClipOpen(clip);
                        clip.style.transition = 'none';
                        window.setTimeout(function () {
                            if (el.__joyfulGen !== gen) return;
                            runFade();
                        }, holdMs);
                    }
                    function onTransitionEnd(ev) {
                        if (ev.target !== clip) return;
                        if (ev.propertyName !== 'clip-path' && ev.propertyName !== '-webkit-clip-path') {
                            return;
                        }
                        afterReveal();
                    }

                    clip.addEventListener('transitionend', onTransitionEnd);
                    setClipOpen(clip);
                    window.setTimeout(afterReveal, revealMs + 80);
                });
            });
        }

        if (delayMs > 0) {
            window.setTimeout(function () {
                if (el.__joyfulGen !== gen) return;
                startReveal();
            }, delayMs);
        } else {
            startReveal();
        }
    }

    function getSpawnCountBounds() {
        var minCount = Math.min(CONFIG.doodlesMin, CONFIG.doodlesMax);
        var maxCount = Math.max(CONFIG.doodlesMin, CONFIG.doodlesMax);
        var isMobile =
            typeof window.mobileCheck === 'function' && window.mobileCheck();

        if (isMobile) {
            maxCount = Math.max(minCount, Math.round(maxCount * (2 / 3)));
        }

        return { min: minCount, max: maxCount };
    }

    function spawnDoodlesNow(originEl, cache, layer, session) {
        if (session !== spawnSession) return;

        var contentEl = originEl.closest('.about-content') || originEl.closest('#about');
        if (!contentEl) return;

        var reducedMotion = prefersReducedMotion();
        var countBounds = getSpawnCountBounds();
        var count = randomInt(countBounds.min, countBounds.max);
        count = Math.min(count, CONFIG.maxConcurrent);
        var ids = pickDoodleIds(count);
        var positions = pickTrailPositions(contentEl, count);

        if (!positions.length || session !== spawnSession) return;

        trimOldestSessionDoodles(layer, session, count);

        for (var i = 0; i < positions.length && i < ids.length; i++) {
            if (session !== spawnSession) return;

            var pos = positions[i];
            var doodleId = ids[i];
            var scale = pos.scale;
            var rotation = pickDoodleRotation();
            var markup = cache[doodleId];
            if (!markup) continue;

            var el = createDoodleElement(markup, scale, rotation);
            el.__spawnSession = session;
            el.__spawnScale = scale;
            layer.appendChild(el);
            animateDoodle(el, pos.x, pos.y, i, reducedMotion);
        }
    }

    function spawnDoodles(originEl) {
        if (!originEl) return;

        spawnSession += 1;
        var session = spawnSession;

        loadSvgs().then(function (cache) {
            if (!cache || session !== spawnSession) return;

            var rect = originEl.getBoundingClientRect();
            if (rect.width < 1 && rect.height < 1) return;

            var layer = ensureLayer();
            fadeOutPreviousSessions(layer, session);
            spawnDoodlesNow(originEl, cache, layer, session);
        });
    }

    function onTriggerActivate(e, trigger) {
        if (e.type === 'keydown') {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
        }
        if (e.type === 'click' && e.detail === 0) return;
        spawnDoodles(trigger);
    }

    function buildControlsPanel(triggerEl) {
        previewTrigger = triggerEl;

        var root = document.createElement('div');
        root.className = 'bio-joyful-controls';
        root.id = 'bio-joyful-controls';

        var panel = document.createElement('div');
        panel.className = 'bio-joyful-controls__panel';
        panel.id = 'bio-joyful-controls-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'bio-joyful-controls-legend');
        panel.setAttribute('aria-hidden', 'true');

        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'bio-joyful-controls__trigger';
        trigger.setAttribute('aria-label', 'Joyful doodle settings');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'bio-joyful-controls-panel');

        var triggerIconSettings = document.createElement('img');
        triggerIconSettings.className =
            'bio-joyful-controls__trigger-icon bio-joyful-controls__trigger-icon--settings';
        triggerIconSettings.src = new URL('images/settings.svg', window.location.href).href;
        triggerIconSettings.alt = '';
        triggerIconSettings.setAttribute('decoding', 'async');
        triggerIconSettings.setAttribute('aria-hidden', 'true');
        trigger.appendChild(triggerIconSettings);

        var triggerIconClose = document.createElement('img');
        triggerIconClose.className =
            'bio-joyful-controls__trigger-icon bio-joyful-controls__trigger-icon--close';
        triggerIconClose.src = new URL('images/x.svg', window.location.href).href;
        triggerIconClose.alt = '';
        triggerIconClose.setAttribute('decoding', 'async');
        triggerIconClose.setAttribute('aria-hidden', 'true');
        trigger.appendChild(triggerIconClose);

        var legend = document.createElement('div');
        legend.className = 'bio-joyful-controls__legend';
        legend.id = 'bio-joyful-controls-legend';
        legend.textContent = 'Joyful doodles';

        var inputs = {};
        var currentGroup = null;
        var fieldset = null;

        function ensureFieldset(groupName) {
            if (currentGroup === groupName && fieldset) return;
            currentGroup = groupName;
            fieldset = document.createElement('fieldset');
            fieldset.className = 'bio-joyful-controls__fieldset';
            var groupLegend = document.createElement('legend');
            groupLegend.className = 'bio-joyful-controls__group-legend';
            groupLegend.textContent = groupName;
            fieldset.appendChild(groupLegend);
            panel.appendChild(fieldset);
        }

        function syncRowState(key) {
            var pair = inputs[key];
            if (!pair) return;
            var v = parseFloat(pair.input.value);
            var dirty = isNonDefault(key, v);
            pair.row.classList.toggle('bio-joyful-controls__row--modified', dirty);
            pair.val.classList.toggle('bio-joyful-controls__value--modified', dirty);
            pair.input.classList.toggle('bio-joyful-controls__range--modified', dirty);
        }

        function syncPanelDirtyState() {
            var k;
            for (k in inputs) {
                syncRowState(k);
            }
            var count = 0;
            for (k in inputs) {
                if (isNonDefault(k, parseFloat(inputs[k].input.value))) count += 1;
            }
            root.classList.toggle('bio-joyful-controls--dirty', count > 0);
            trigger.setAttribute('data-modified-count', count > 0 ? String(count) : '');
            legend.textContent =
                count > 0 ? 'Joyful doodles · ' + count + ' changed' : 'Joyful doodles';
        }

        for (var d = 0; d < SLIDER_DEFS.length; d++) {
            var def = SLIDER_DEFS[d];
            ensureFieldset(def.group);

            var row = document.createElement('div');
            row.className = 'bio-joyful-controls__row';

            var lab = document.createElement('label');
            lab.className = 'bio-joyful-controls__label';
            lab.setAttribute('for', 'bio-joyful-' + def.key);
            lab.textContent = def.label;

            var input = document.createElement('input');
            input.type = 'range';
            input.id = 'bio-joyful-' + def.key;
            input.className = 'bio-joyful-controls__range';
            input.min = String(def.min);
            input.max = String(def.max);
            input.step = String(def.step);
            input.value = String(CONFIG[def.key]);

            var val = document.createElement('span');
            val.className = 'bio-joyful-controls__value';
            val.setAttribute('aria-live', 'polite');
            val.textContent = formatControlValue(def.key, parseFloat(input.value));

            input.addEventListener(
                'input',
                (function (key, inputEl, valEl) {
                    return function () {
                        var v = parseFloat(inputEl.value);
                        valEl.textContent = formatControlValue(key, v);
                        var patch = {};
                        patch[key] = v;
                        applyConfig(patch);
                        syncPanelDirtyState();
                    };
                })(def.key, input, val)
            );

            inputs[def.key] = { input: input, val: val, row: row };
            row.appendChild(lab);
            row.appendChild(input);
            row.appendChild(val);
            fieldset.appendChild(row);
        }

        var actions = document.createElement('div');
        actions.className = 'bio-joyful-controls__actions';

        var previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'bio-joyful-controls__btn';
        previewBtn.textContent = 'Preview';

        var copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'bio-joyful-controls__btn';
        copyBtn.textContent = 'Copy values';

        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'bio-joyful-controls__btn bio-joyful-controls__btn--reset';
        resetBtn.textContent = 'Reset to defaults';

        previewBtn.addEventListener('click', function () {
            if (previewTrigger) spawnDoodles(previewTrigger);
        });

        copyBtn.addEventListener('click', function () {
            var out = {};
            var k;
            for (k in DEFAULTS) {
                if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) {
                    out[k] = CONFIG[k];
                }
            }
            copyTextToClipboard(JSON.stringify(out, null, 2))
                .then(function () {
                    copyBtn.textContent = 'Copied!';
                    window.setTimeout(function () {
                        copyBtn.textContent = 'Copy values';
                    }, 1400);
                })
                .catch(function () {
                    copyBtn.textContent = 'Copy failed';
                    window.setTimeout(function () {
                        copyBtn.textContent = 'Copy values';
                    }, 1400);
                });
        });

        resetBtn.addEventListener('click', function () {
            applyConfig(Object.assign({}, DEFAULTS));
            var k;
            for (k in inputs) {
                if (Object.prototype.hasOwnProperty.call(inputs, k)) {
                    var pair = inputs[k];
                    pair.input.value = String(CONFIG[k]);
                    pair.val.textContent = formatControlValue(k, CONFIG[k]);
                }
            }
            syncPanelDirtyState();
        });

        actions.appendChild(previewBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(resetBtn);
        panel.insertBefore(legend, panel.firstChild);
        panel.appendChild(actions);

        function setPanelOpen(open) {
            root.classList.toggle('bio-joyful-controls--open', open);
            panel.setAttribute('aria-hidden', open ? 'false' : 'true');
            if ('inert' in panel) {
                panel.inert = !open;
            }
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            trigger.setAttribute(
                'aria-label',
                open ? 'Close joyful doodle settings' : 'Joyful doodle settings'
            );
        }

        trigger.addEventListener('click', function () {
            setPanelOpen(!root.classList.contains('bio-joyful-controls--open'));
        });

        document.addEventListener('keydown', function onJoyfulControlsKeydown(e) {
            if (e.key !== 'Escape' || !root.classList.contains('bio-joyful-controls--open')) {
                return;
            }
            setPanelOpen(false);
            trigger.focus();
        });

        root.appendChild(panel);
        root.appendChild(trigger);
        document.body.appendChild(root);
        setPanelOpen(false);
        syncPanelDirtyState();
    }

    window.initBioJoyfulDoodles = function (container) {
        container = container || document;
        var triggers = container.querySelectorAll('.bio-joyful-trigger');
        if (!triggers.length) return;

        ensureLayer();
        loadSvgs();

        for (var i = 0; i < triggers.length; i++) {
            (function (trigger) {
                trigger.addEventListener('click', function (e) {
                    onTriggerActivate(e, trigger);
                });
                trigger.addEventListener('keydown', function (e) {
                    onTriggerActivate(e, trigger);
                });
            })(triggers[i]);
        }

        if (SHOW_CONTROLS_PANEL && !document.getElementById('bio-joyful-controls')) {
            buildControlsPanel(triggers[0]);
        }
    };
})();
