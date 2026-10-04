// Work views prototype: the view-swap transition engine.
// Elements that represent the same thing across views share a data-wv-key
// ("<item id>|media" or "<item id>|title"). On a swap those fly from their old
// spot to their new one; everything else fades. Two engines to compare:
//   vt   - document.startViewTransition with a view-transition-name per key
//   flip - measure, swap, invert, play (Web Animations); also the vt fallback
//
// One swap can cover several stages (the single switcher drives Work and Projects
// together). They're measured, rendered and animated as one, and the scroll position
// is corrected so the section you're looking at (the anchor) doesn't jump when a
// section above it changes height.

(function () {
    var DUR = 560;
    var EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

    function isVisible(el) {
        if (!el.getClientRects().length) return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    // First visible element per key (Featured renders desktop and mobile copies; CSS hides one).
    function visibleParts(root, map) {
        map = map || new Map();
        var els = root.querySelectorAll('[data-wv-key]');
        for (var i = 0; i < els.length; i++) {
            var key = els[i].getAttribute('data-wv-key');
            if (!map.has(key) && isVisible(els[i])) map.set(key, els[i]);
        }
        return map;
    }

    function allParts(targets) {
        var map = new Map();
        targets.forEach(function (t) { visibleParts(t.stage, map); });
        return map;
    }

    function docRect(el) {
        var r = el.getBoundingClientRect();
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    }

    // Within a screen and a half of the viewport - the only parts worth animating.
    function nearViewport(el) {
        var r = el.getBoundingClientRect();
        var vh = window.innerHeight;
        return r.bottom > -vh * 0.5 && r.top < vh * 1.5;
    }

    function vtName(key) {
        return 'wv-' + key.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function isMedia(key) {
        return key.slice(-6) === '|media';
    }

    function staggerDelay(rank) {
        return Math.min(rank * 14, 220);
    }

    function renderAll(o) {
        var before = o.anchor ? o.anchor.getBoundingClientRect().top : null;
        o.targets.forEach(function (t) { t.render(); });
        if (!o.anchor) return;
        // Hold the anchor section where it was on screen...
        var delta = o.anchor.getBoundingClientRect().top - before;
        if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: 'instant' });
        // ...unless its new view is so much shorter that we'd be left below it.
        var r = o.anchor.getBoundingClientRect();
        if (r.bottom < 160) window.scrollTo({ top: r.top + window.scrollY - 16, behavior: 'instant' });
    }

    function swapWithViewTransition(o) {
        var style = document.createElement('style');
        document.head.appendChild(style);
        var named = [];
        var oldKeys = new Set();

        allParts(o.targets).forEach(function (el, key) {
            if (!nearViewport(el)) return;
            el.style.viewTransitionName = vtName(key);
            oldKeys.add(key);
        });

        var t = document.startViewTransition(function () {
            renderAll(o);
            var rules = '';
            var rank = 0;
            var parts = Array.from(allParts(o.targets).entries());
            parts.sort(function (a, b) {
                return a[1].getBoundingClientRect().top - b[1].getBoundingClientRect().top;
            });
            parts.forEach(function (entry) {
                var key = entry[0];
                var el = entry[1];
                if (!oldKeys.has(key) && !nearViewport(el)) return;
                var name = vtName(key);
                el.style.viewTransitionName = name;
                named.push(el);
                var delay = staggerDelay(rank++);
                rules += '::view-transition-group(' + name + '){animation-duration:' + DUR + 'ms;animation-timing-function:' + EASE + ';animation-delay:' + delay + 'ms}';
                rules += '::view-transition-old(' + name + '),::view-transition-new(' + name + '){animation-delay:' + delay + 'ms}';
                if (isMedia(key)) {
                    rules += '::view-transition-group(' + name + '){overflow:clip;border-radius:12px}';
                    rules += '::view-transition-old(' + name + '),::view-transition-new(' + name + '){width:100%;height:100%;object-fit:cover}';
                }
            });
            style.textContent = rules;
        });

        // ready rejects when the browser skips the transition (e.g. a hidden tab); the DOM still updates.
        t.ready.catch(function () {});
        t.finished.catch(function () {}).then(function () {
            for (var i = 0; i < named.length; i++) named[i].style.viewTransitionName = '';
            style.remove();
        });
        return { vt: t, anims: [] };
    }

    function makeGhost(stage) {
        var ghost = stage.cloneNode(true);
        ghost.removeAttribute('id');
        ghost.classList.add('wv-ghost');
        ghost.setAttribute('aria-hidden', 'true');
        ghost.setAttribute('inert', '');
        ghost.style.top = stage.offsetTop + 'px';
        ghost.style.left = stage.offsetLeft + 'px';
        ghost.style.width = stage.offsetWidth + 'px';
        stage.parentNode.appendChild(ghost);
        return ghost;
    }

    // Removes the element when the fade ends, or straight away if it is finished/cancelled early.
    function fadeOutAndRemove(el, duration) {
        var a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration, easing: 'ease-out', fill: 'forwards' });
        a.finished.then(function () { el.remove(); }, function () { el.remove(); });
        return a;
    }

    function swapWithFlip(o) {
        var before = new Map();
        allParts(o.targets).forEach(function (el, key) { before.set(key, docRect(el)); });
        var scrollBefore = window.scrollY;
        var olds = o.targets.map(function (t) {
            return { h: t.stage.offsetHeight, ghost: makeGhost(t.stage) };
        });

        renderAll(o);
        // Scroll moved to hold the anchor: shift the "before" rects by the same amount so
        // parts animate from where they were on screen, not where they were in the page.
        var scrollShift = window.scrollY - scrollBefore;
        if (scrollShift) before.forEach(function (r) { r.y += scrollShift; });

        // Ease each stage's height change - except stages above the anchor: their change
        // is already absorbed by the scroll correction, and animating it would push the
        // section being read down the screen mid-transition.
        var anims = [];
        o.targets.forEach(function (t, i) {
            if (o.anchor && t.stage !== o.anchor && !o.anchor.contains(t.stage) &&
                (o.anchor.compareDocumentPosition(t.stage) & Node.DOCUMENT_POSITION_PRECEDING)) return;
            anims.push(t.stage.animate([{ height: olds[i].h + 'px' }, { height: t.stage.offsetHeight + 'px' }], { duration: DUR, easing: EASE }));
        });

        var after = allParts(o.targets);
        var matched = [];
        after.forEach(function (el, key) {
            if (before.has(key) && nearViewport(el)) matched.push([key, el]);
        });
        matched.sort(function (a, b) { return a[1].getBoundingClientRect().top - b[1].getBoundingClientRect().top; });

        var movedItems = new Set();
        matched.forEach(function (entry, rank) {
            var key = entry[0];
            var el = entry[1];
            var from = before.get(key);
            var to = docRect(el);
            if (!to.w || !to.h) return;
            olds.forEach(function (old) {
                var hidden = old.ghost.querySelectorAll('[data-wv-key="' + CSS.escape(key) + '"]');
                for (var h = 0; h < hidden.length; h++) hidden[h].style.visibility = 'hidden';
            });

            var dx = from.x - to.x;
            var dy = from.y - to.y;
            var sx, sy;
            if (isMedia(key)) {
                sx = from.w / to.w;
                sy = from.h / to.h;
            } else {
                // Text scales uniformly so letterforms don't stretch.
                sx = sy = from.h / to.h;
            }
            anims.push(el.animate([
                { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
                { transformOrigin: '0 0', transform: 'none' }
            ], { duration: DUR, easing: EASE, delay: staggerDelay(rank), fill: 'backwards' }));

            var item = el.closest('[data-wv-item]');
            if (item) movedItems.add(item);
        });

        // Supporting copy on moved items fades in once the shared parts have mostly landed.
        // It fades to the opacity CSS gives it at rest, not to 1: labels that are meant to be
        // hidden (non-hero contact-sheet captions until hover) must stay hidden mid-swap.
        movedItems.forEach(function (item) {
            var fades = item.querySelectorAll('[data-wv-fade]');
            for (var f = 0; f < fades.length; f++) {
                if (!isVisible(fades[f])) continue;
                var rest = parseFloat(getComputedStyle(fades[f]).opacity);
                if (!(rest > 0)) continue;
                anims.push(fades[f].animate([{ opacity: 0 }, { opacity: rest }], { duration: 280, delay: 180, easing: 'ease-out', fill: 'backwards' }));
            }
        });

        // Items new to this view rise in, in reading order.
        var fresh = [];
        o.targets.forEach(function (t) {
            Array.prototype.forEach.call(t.stage.querySelectorAll('[data-wv-item]'), function (item) {
                if (!movedItems.has(item) && isVisible(item) && nearViewport(item)) fresh.push(item);
            });
        });
        fresh.forEach(function (item, i) {
            anims.push(item.animate([
                { opacity: 0, transform: 'translateY(14px)' },
                { opacity: 1, transform: 'none' }
            ], { duration: 380, delay: 80 + staggerDelay(i), easing: EASE, fill: 'backwards' }));
        });

        olds.forEach(function (old) { anims.push(fadeOutAndRemove(old.ghost, 220)); });
        return { anims: anims };
    }

    function swapReduced(o) {
        var ghosts = o.targets.map(function (t) { return makeGhost(t.stage); });
        renderAll(o);
        var anims = ghosts.map(function (g) { return fadeOutAndRemove(g, 150); });
        o.targets.forEach(function (t) {
            anims.push(t.stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' }));
        });
        return { anims: anims };
    }

    // The in-flight transition. A new swap doesn't queue behind it: it snaps the running
    // one to its end state first, so rapid clicks stay responsive.
    var running = null;

    function settle() {
        var r = running;
        if (!r) return;
        running = null;
        if (r.vt) r.vt.skipTransition();
        for (var i = 0; i < r.anims.length; i++) {
            try { r.anims[i].finish(); } catch (e) { r.anims[i].cancel(); }
        }
        var ghosts = document.querySelectorAll('.wv-ghost');
        for (var g = 0; g < ghosts.length; g++) ghosts[g].remove();
    }

    // o: { targets: [{ stage, render }], anchor, fx: 'vt'|'flip', reduced, instant }
    // (or the single-stage form { stage, section, render, ... })
    function swap(o) {
        if (!o.targets) {
            o = Object.assign({}, o, { targets: [{ stage: o.stage, render: o.render }], anchor: o.anchor || o.section });
        }
        settle();
        var record = null;
        try {
            if (o.instant) renderAll(o);
            else if (o.reduced) record = swapReduced(o);
            else if (o.fx === 'vt' && typeof document.startViewTransition === 'function' && !document.hidden) record = swapWithViewTransition(o);
            else record = swapWithFlip(o);
        } catch (err) {
            console.error('[work-views] transition failed', err);
        }
        running = record;
    }

    window.WorkViewsMotion = { swap: swap, vtName: vtName };
})();
