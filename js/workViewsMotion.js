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

    // ---- Shared media flights ----
    // Media can't simply be transformed in place: it sits inside frames that clip it (a grid
    // tile's frame, a Featured card), so it would only ever be seen sliding about inside its
    // own frame. Instead a stand-in copy flies on an unclipped layer above the page, from the
    // old spot to the new one, animating its box (the image crops to fit rather than
    // stretching), and the real frame stays hidden until the copy lands on it.

    var flyerLayer = null;

    function getFlyerLayer() {
        if (flyerLayer && flyerLayer.isConnected) return flyerLayer;
        flyerLayer = document.createElement('div');
        flyerLayer.className = 'wv-flyers';
        flyerLayer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(flyerLayer);
        return flyerLayer;
    }

    function mediaOf(el) {
        return (el.tagName === 'IMG' || el.tagName === 'VIDEO') ? el : el.querySelector('img, video');
    }

    // What the stand-in shows: the image itself, or a video's poster.
    function stillOf(el) {
        var m = mediaOf(el);
        if (!m) return null;
        if (m.tagName === 'IMG') return m.currentSrc || m.getAttribute('src');
        return m.getAttribute('poster');
    }

    // A loop that's playing in the old view keeps playing through the swap: note where it
    // is and grab its current frame (the stand-in shows that straight away, then a copy of
    // the loop picks up from the same moment), so nothing flips back to its poster.
    function liveLoop(el) {
        var v = mediaOf(el);
        if (!v || v.tagName !== 'VIDEO' || !v.getAttribute('src') || v.readyState < 2 || !v.videoWidth) return null;
        var frame = null;
        try {
            frame = document.createElement('canvas');
            frame.width = v.videoWidth;
            frame.height = v.videoHeight;
            frame.getContext('2d').drawImage(v, 0, 0);
        } catch (e) {
            frame = null;
        }
        return { src: v.getAttribute('src'), time: v.currentTime, at: performance.now(), paused: v.paused, frame: frame };
    }

    function loopTime(loop, video) {
        var t = loop.time + (loop.paused ? 0 : (performance.now() - loop.at) / 1000);
        return video.duration ? t % video.duration : t;
    }

    // Seek a video to where the loop is now and play it; onShowing runs once it's actually
    // presenting a frame from there (not its first frame, nor a stale one mid-seek).
    function startAt(video, loop, onShowing) {
        function seek() {
            if (onShowing) {
                video.addEventListener('seeked', function () { afterNextFrame(video, onShowing); }, { once: true });
            }
            try { video.currentTime = loopTime(loop, video); } catch (e) {}
            if (!loop.paused) {
                var p = video.play();
                if (p && p.catch) p.catch(function () {});
            }
        }
        if (video.readyState >= 1) seek();
        else video.addEventListener('loadedmetadata', seek, { once: true });
    }

    function afterNextFrame(video, cb) {
        if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(function () { cb(); });
        else requestAnimationFrame(function () { requestAnimationFrame(cb); });
    }

    // Corner radius of the element, or of the frame that clips it.
    function radiusOf(el) {
        var node = el;
        for (var i = 0; i < 3 && node; i++) {
            var r = getComputedStyle(node).borderTopLeftRadius;
            if (r && r !== '0px') return r;
            node = node.parentElement;
        }
        return '0px';
    }

    function flyMedia(el, from, to, delay, cleanups) {
        var src = stillOf(el);
        var loop = from.loop || null;
        if (!src && !loop) return null;
        var toRadius = radiusOf(el);
        var target = mediaOf(el);
        var f = document.createElement('div');
        f.className = 'wv-flyer' + (target && target.getAttribute('data-fit') === 'contain' ? ' is-contain' : '');
        f.style.left = to.x + 'px';
        f.style.top = to.y + 'px';
        f.style.width = to.w + 'px';
        f.style.height = to.h + 'px';
        f.style.borderRadius = toRadius;
        if (src) f.style.backgroundImage = 'url("' + src.replace(/"/g, '\\"') + '")';

        // The same loop, continuing: its last frame at once, then the loop itself on top.
        // The real video it lands on starts loading now, at the same moment in the loop.
        var copy = null;
        var sameLoop = loop && target && target.tagName === 'VIDEO' &&
            (target.getAttribute('src') || target.getAttribute('data-wv-src')) === loop.src;
        if (loop) {
            if (loop.frame) f.appendChild(loop.frame);
            copy = document.createElement('video');
            copy.muted = true;
            copy.loop = true;
            copy.playsInline = true;
            // Unseen until it's showing the right moment - the captured frame covers until then.
            copy.style.opacity = '0';
            copy.src = loop.src;
            f.appendChild(copy);
            startAt(copy, loop, function () { copy.style.opacity = ''; });
        }
        var targetShowing = !sameLoop;
        var landed = false;
        function dropWhenReady() {
            if (landed && targetShowing) f.remove();
        }
        if (sameLoop) {
            if (!target.getAttribute('src')) target.src = loop.src;
            startAt(target, loop, function () { targetShowing = true; dropWhenReady(); });
        }

        getFlyerLayer().appendChild(f);
        el.style.visibility = 'hidden';

        var done = false;
        function land() {
            if (done) return;
            done = true;
            el.style.visibility = '';
            // The copy stays over the real loop until that's showing a frame from the right
            // moment, so there's no flash of its poster (or first frame) on landing.
            landed = true;
            dropWhenReady();
            setTimeout(function () { f.remove(); }, 800);
        }
        cleanups.push(land);

        var a = f.animate([
            { left: from.x + 'px', top: from.y + 'px', width: from.w + 'px', height: from.h + 'px', borderRadius: from.radius },
            { left: to.x + 'px', top: to.y + 'px', width: to.w + 'px', height: to.h + 'px', borderRadius: toRadius }
        ], { duration: DUR, easing: EASE, delay: delay, fill: 'backwards' });
        a.finished.then(land, land);
        return a;
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
        allParts(o.targets).forEach(function (el, key) {
            var r = docRect(el);
            r.radius = isMedia(key) ? radiusOf(el) : '0px';
            if (isMedia(key) && nearViewport(el)) r.loop = liveLoop(el);
            before.set(key, r);
        });
        // Where each item sat as a whole - a fallback launch point for media that had no
        // image in the old view (a text-only list row).
        var beforeItems = new Map();
        o.targets.forEach(function (t) {
            var items = t.stage.querySelectorAll('[data-wv-item]');
            for (var i = 0; i < items.length; i++) {
                var id = items[i].getAttribute('data-wv-item');
                if (beforeItems.has(id) || !isVisible(items[i])) continue;
                var r = docRect(items[i]);
                r.radius = radiusOf(items[i]);
                beforeItems.set(id, r);
            }
        });
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
        var cleanups = [];
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

            var flight = isMedia(key) ? flyMedia(el, from, to, staggerDelay(rank), cleanups) : null;
            if (flight) {
                anims.push(flight);
            } else {
                var dx = from.x - to.x;
                var dy = from.y - to.y;
                // Text scales uniformly so letterforms don't stretch.
                var sx = isMedia(key) ? from.w / to.w : from.h / to.h;
                var sy = isMedia(key) ? from.h / to.h : from.h / to.h;
                anims.push(el.animate([
                    { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
                    { transformOrigin: '0 0', transform: 'none' }
                ], { duration: DUR, easing: EASE, delay: staggerDelay(rank), fill: 'backwards' }));
            }

            var item = el.closest('[data-wv-item]');
            if (item) movedItems.add(item);
        });

        // Media new to this view still flies in from somewhere it can be traced to: the item's
        // row in the old view.
        var rank = matched.length;
        var arrivals = [];
        after.forEach(function (el, key) {
            if (!isMedia(key) || before.has(key) || !nearViewport(el)) return;
            var from = beforeItems.get(key.slice(0, -6));
            if (from) arrivals.push([el, from]);
        });
        arrivals.sort(function (a, b) { return a[0].getBoundingClientRect().top - b[0].getBoundingClientRect().top; });
        arrivals.forEach(function (pair) {
            var el = pair[0];
            var to = docRect(el);
            if (!to.w || !to.h) return;
            var flight = flyMedia(el, pair[1], to, staggerDelay(rank++), cleanups);
            if (!flight) return;
            anims.push(flight);
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
        return { anims: anims, cleanups: cleanups };
    }

    // Reduced motion: a short crossfade, nothing moves.
    function swapReduced(o) {
        var ghosts = o.targets.map(function (t) { return makeGhost(t.stage); });
        renderAll(o);
        var anims = ghosts.map(function (g) { return fadeOutAndRemove(g, 150); });
        o.targets.forEach(function (t) {
            anims.push(t.stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' }));
        });
        return { anims: anims, cleanups: [] };
    }

    // The in-flight transition. A new swap doesn't queue behind it: it snaps the running
    // one to its end state first, so rapid clicks stay responsive.
    var running = { anims: [], cleanups: [] };

    function settle() {
        var r = running;
        running = { anims: [], cleanups: [] };
        for (var i = 0; i < r.anims.length; i++) {
            try { r.anims[i].finish(); } catch (e) { r.anims[i].cancel(); }
        }
        // finish() resolves its promises later; land the flights now so the next swap
        // measures real, visible frames.
        for (var c = 0; c < r.cleanups.length; c++) r.cleanups[c]();
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
