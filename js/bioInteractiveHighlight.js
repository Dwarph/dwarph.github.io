/**
 * Shared press-down state for about-bio interactive highlights.
 * Shrink depth is derived from the joyful baseline line height (not each word's width).
 */
(function () {
    var PRESSED_CLASS = 'bio-interactive-highlight--pressed';
    var BASELINE_ACTION = 'joyful';
    var resizeHandler = null;

    function getPressScale() {
        var value = getComputedStyle(document.documentElement)
            .getPropertyValue('--bio-highlight-press-scale')
            .trim();
        var parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0.98;
    }

    function readLineHeightPx(el) {
        var style = getComputedStyle(el);
        var lineHeight = style.lineHeight;
        if (lineHeight === 'normal') {
            return el.getBoundingClientRect().height;
        }
        var parsed = parseFloat(lineHeight);
        if (!Number.isFinite(parsed)) {
            return el.getBoundingClientRect().height;
        }
        if (lineHeight.indexOf('px') !== -1) {
            return parsed;
        }
        var fontSize = parseFloat(style.fontSize);
        return Number.isFinite(fontSize) ? parsed * fontSize : el.getBoundingClientRect().height;
    }

    function clearPressScales(el) {
        el.style.removeProperty('--bio-highlight-press-scale-x');
        el.style.removeProperty('--bio-highlight-press-scale-y');
    }

    function updatePressScales(container) {
        container = container || document;
        var baseline = container.querySelector(
            '.bio-interactive-highlight[data-bio-action="' + BASELINE_ACTION + '"]'
        );
        if (!baseline) return;

        var lineHeightPx = readLineHeightPx(baseline);
        if (lineHeightPx < 1) return;

        var pressScale = getPressScale();
        var shrinkPx = lineHeightPx * (1 - pressScale);
        var highlights = container.querySelectorAll('.bio-interactive-highlight');

        for (var i = 0; i < highlights.length; i++) {
            var el = highlights[i];
            var rect = el.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) {
                clearPressScales(el);
                continue;
            }

            var scaleY = 1 - shrinkPx / rect.height;
            var scaleX = 1 - shrinkPx / rect.width;
            el.style.setProperty('--bio-highlight-press-scale-x', String(scaleX));
            el.style.setProperty('--bio-highlight-press-scale-y', String(scaleY));
        }
    }

    function schedulePressScaleUpdate(container) {
        requestAnimationFrame(function () {
            updatePressScales(container);
        });
    }

    window.initBioInteractiveHighlightPress = function (container) {
        container = container || document;
        var highlights = container.querySelectorAll('.bio-interactive-highlight');
        if (!highlights.length) return;

        function remeasure() {
            schedulePressScaleUpdate(container);
        }

        remeasure();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(remeasure);
        }
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
        }
        resizeHandler = remeasure;
        window.addEventListener('resize', resizeHandler);

        for (var i = 0; i < highlights.length; i++) {
            (function (el) {
                var lastPointerType = 'mouse';

                el.addEventListener('pointerdown', function (e) {
                    lastPointerType = e.pointerType || 'mouse';
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    el.classList.add(PRESSED_CLASS);
                });
                el.addEventListener('focus', function () {
                    /* Touch focus scrolls the page and can grow the visual viewport on Android. */
                    if (lastPointerType === 'touch') {
                        el.blur();
                    }
                });
                el.addEventListener('pointerup', function () {
                    el.classList.remove(PRESSED_CLASS);
                });
                el.addEventListener('pointercancel', function () {
                    el.classList.remove(PRESSED_CLASS);
                });
                el.addEventListener('pointerleave', function () {
                    if (el.classList.contains(PRESSED_CLASS)) {
                        el.classList.remove(PRESSED_CLASS);
                    }
                });
            })(highlights[i]);
        }
    };
})();
