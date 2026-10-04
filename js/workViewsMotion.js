// Work + Projects views: the view-swap transition (FLIP with the Web Animations API).
// Elements that represent the same thing across views share a data-wv-key
// ("<item id>|media" or "<item id>|title"). On a swap those fly from their old spot to
// their new one; a snapshot ("ghost") of the outgoing view fades out; new items rise in.
//
// One swap covers both sections (the single switcher drives Work and Projects). They're
// measured, rendered and animated together, and the scroll position is corrected so the
// section being read (the anchor) doesn't jump when a section above it changes height.

(function () {
    var DUR = 560;
    var EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

    function isVisible(el) {
        if (!el.getClientRects().length) return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    // First visible element per key (Featured renders desktop and mobile copies; CSS hides one).
    function allParts(targets) {
        var map = new Map();
        targets.forEach(function (t) {
            var els = t.stage.querySelectorAll('[data-wv-key]');
            for (var i = 0; i < els.length; i++) {
                var key = els[i].getAttribute('data-wv-key');
                if (!map.has(key) && isVisible(els[i])) map.set(key, els[i]);
            }
        });
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

    function makeGhost(stage) {
        var ghost = stage.cloneNode(true);
        ghost.removeAttribute('id');
        // Featured carries ids (job anchors); the snapshot must not duplicate them.
        var withIds = ghost.querySelectorAll('[id]');
        for (var i = 0; i < withIds.length; i++) withIds[i].removeAttribute('id');
        ghost.classList.add('wv-ghost');
        ghost.setAttribute('aria-hidden', 'true');
        ghost.setAttribute('inert', '');
        ghost.style.top = stage.offsetTop + 'px';
        ghost.style.left = stage.offsetLeft + 'px';
        ghost.style.width = stage.offsetWidth + 'px';
        stage.parentNode.appendChild(ghost);
        return ghost;
    }

    // Removes the element when the fade ends, or straight away if finished/cancelled early.
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

        // Ease each stage's height change - except stages above the anchor: their change is
        // already absorbed by the scroll correction, and animating it would push the section
        // being read down the screen mid-transition.
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
            // Text scales uniformly so letterforms don't stretch.
            var sx = isMedia(key) ? from.w / to.w : from.h / to.h;
            var sy = isMedia(key) ? from.h / to.h : from.h / to.h;
            anims.push(el.animate([
                { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
                { transformOrigin: '0 0', transform: 'none' }
            ], { duration: DUR, easing: EASE, delay: staggerDelay(rank), fill: 'backwards' }));

            var item = el.closest('[data-wv-item]');
            if (item) movedItems.add(item);
        });

        // Supporting copy on moved items fades in once the shared parts have mostly landed -
        // to its resting opacity, so labels meant to stay hidden (non-hero grid titles until
        // hover) aren't flashed mid-swap.
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
        return anims;
    }

    // Reduced motion: a short crossfade, nothing moves.
    function swapReduced(o) {
        var ghosts = o.targets.map(function (t) { return makeGhost(t.stage); });
        renderAll(o);
        var anims = ghosts.map(function (g) { return fadeOutAndRemove(g, 150); });
        o.targets.forEach(function (t) {
            anims.push(t.stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' }));
        });
        return anims;
    }

    // The in-flight transition. A new swap doesn't queue behind it: it snaps the running
    // one to its end state first, so rapid clicks stay responsive.
    var running = [];

    function settle() {
        for (var i = 0; i < running.length; i++) {
            try { running[i].finish(); } catch (e) { running[i].cancel(); }
        }
        running = [];
        var ghosts = document.querySelectorAll('.wv-ghost');
        for (var g = 0; g < ghosts.length; g++) ghosts[g].remove();
    }

    // o: { targets: [{ stage, render }], anchor, reduced, instant }
    function swap(o) {
        settle();
        try {
            if (o.instant) renderAll(o);
            else if (o.reduced) running = swapReduced(o);
            else running = swapWithFlip(o);
        } catch (err) {
            console.error('[work views] transition failed', err);
        }
    }

    window.WorkViewsMotion = { swap: swap };
})();
