// Work views and the experiments page: the detail card a tile or list row opens into.
// Native <dialog>: Esc and focus return come for free. ←/→ step through the section's
// items; the opener's media morphs into the card where View Transitions exist.
//
// Layout: the media as large as the screen allows on a dark stage, with the text beside
// it (wide screens) or below it (narrow). It never shows media past 1.5x its native
// width - the archive loops are ~288px and fall apart when blown up.

(function () {
    var U = window.WorkViewsUtil;
    var M = window.WorkViewsMedia;
    var esc = U.escapeHtml;
    var CARD_NAME = 'wv-card-media';
    var MAX_UPSCALE = 1.5;

    var dialog = null;
    var state = { tiles: [], index: 0, stage: null, reduced: false, onChange: null };

    function ensureDialog() {
        if (dialog) return dialog;
        dialog = document.createElement('dialog');
        dialog.className = 'wv-card';
        dialog.setAttribute('aria-labelledby', 'wv-card-title');
        dialog.innerHTML =
            '<div class="wv-card-inner">' +
            '<button type="button" class="wv-card-close" aria-label="Close"><span class="material-icons" aria-hidden="true">close</span></button>' +
            '<div class="wv-card-media"></div>' +
            '<div class="wv-card-panel">' +
            '<div class="wv-card-text">' +
            '<p class="wv-card-sub"></p>' +
            '<h2 class="wv-card-title" id="wv-card-title"></h2>' +
            '<p class="wv-card-desc"></p>' +
            '</div>' +
            '<div class="wv-card-actions">' +
            '<a class="wv-card-link"></a>' +
            '<span class="wv-card-soon"><span class="material-icons" aria-hidden="true">lock</span>Coming soon</span>' +
            '<span class="wv-card-nav">' +
            '<button type="button" class="wv-card-step" data-step="-1" aria-label="Previous"><span class="material-icons" aria-hidden="true">arrow_back</span></button>' +
            '<span class="wv-card-count" aria-live="polite"></span>' +
            '<button type="button" class="wv-card-step" data-step="1" aria-label="Next"><span class="material-icons" aria-hidden="true">arrow_forward</span></button>' +
            '</span>' +
            '</div></div></div>';
        document.body.appendChild(dialog);

        dialog.addEventListener('click', function (e) {
            // The dialog is a full-screen stage: clicks on its empty space close it.
            if (e.target === dialog || e.target.classList.contains('wv-card-inner')) close();
            var step = e.target.closest && e.target.closest('[data-step]');
            if (step) go(state.index + Number(step.dataset.step));
            if (e.target.closest && e.target.closest('.wv-card-close')) close();
        });
        dialog.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { e.preventDefault(); go(state.index + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(state.index - 1); }
        });
        dialog.addEventListener('cancel', function (e) {
            e.preventDefault();
            close();
        });
        return dialog;
    }

    function linkFor(item) {
        if (item.comingSoon || !item.href) return null;
        var label;
        if (item.kind === 'case-study') label = 'Case study';
        else if (item.kind === 'archive') label = 'Watch it';
        else label = item.ctaLabel || 'View';
        return { href: item.href, label: label, external: item.external };
    }

    function mediaSize(el) {
        if (!el) return null;
        if (el.tagName === 'IMG' && el.naturalWidth) return [el.naturalWidth, el.naturalHeight];
        if (el.tagName === 'VIDEO' && el.videoWidth) return [el.videoWidth, el.videoHeight];
        return null;
    }

    // The media's shape (--ar) and largest allowed width (--nat-w) size the card.
    function setAspect(size) {
        var ar = size ? size[0] / size[1] : 16 / 9;
        ar = Math.max(0.45, Math.min(ar, 3));
        dialog.style.setProperty('--ar', ar.toFixed(4));
        dialog.style.setProperty('--nat-w', size ? Math.round(size[0] * MAX_UPSCALE) + 'px' : '9999px');
    }

    // Known media sizes by src. A list row has no thumbnail to read the shape from, so the
    // card measures the media's still first; without this it would open at a guessed 16:9
    // and snap to the real shape when the image loaded.
    var sizes = {};

    function stillOf(media) {
        return media.type === 'video' ? media.poster : media.src;
    }

    // Resolves to [w, h] or null; gives up after `wait` ms so opening never stalls.
    function measure(media, wait) {
        var src = stillOf(media);
        if (!src) return Promise.resolve(null);
        if (sizes[src]) return Promise.resolve(sizes[src]);
        return new Promise(function (resolve) {
            var img = new Image();
            var done = false;
            function finish(size) {
                if (done) return;
                done = true;
                resolve(size);
            }
            img.onload = function () {
                sizes[src] = [img.naturalWidth, img.naturalHeight];
                finish(sizes[src]);
            };
            img.onerror = function () { finish(null); };
            setTimeout(function () { finish(null); }, wait);
            img.src = src;
        });
    }

    function tileEl(index) {
        return state.stage && state.stage.querySelector('[data-wv-tile="' + index + '"]');
    }

    // Opens from grid tiles and list rows. Only real media morphs into the card (a tile, a
    // hero card's thumb); a text-only row has no shape to grow from - morphing the wide row
    // into the media looked like a zoom from landscape - so the card fades in instead.
    function openerMedia(index) {
        var t = tileEl(index);
        return t ? t.querySelector('.wv-tile-media, .wv-icard-media, .exp-wall-media') : null;
    }

    // The opener's media, if it shows the same file the card will - a tile showing a
    // thumbnail crop (Set Sail) has a different shape, so it can't size the card.
    function openerMediaEl(index) {
        var t = tileEl(index);
        var key = t && t.querySelector('[data-wv-key$="|media"]');
        if (!key) return null;
        var el = (key.tagName === 'IMG' || key.tagName === 'VIDEO') ? key : key.querySelector('img, video');
        var media = state.tiles[index] && state.tiles[index].media;
        if (el && el.tagName === 'IMG' && media && media.thumb && el.getAttribute('src') === media.thumb) return null;
        return el;
    }

    function fill() {
        var tile = state.tiles[state.index];
        var it = tile.item;
        var d = dialog;

        // Size from the opener's loaded media, else a measured still; failing both, this
        // runs again when the card's own copy loads.
        var known = mediaSize(openerMediaEl(state.index)) || sizes[stillOf(tile.media)] || null;
        setAspect(known);
        var box = d.querySelector('.wv-card-media');
        box.innerHTML = M.mediaHtml(tile.media, { reduced: state.reduced, playing: true, loading: 'eager' });
        var el = box.firstElementChild;
        if (el && !known) {
            el.addEventListener(el.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', function () {
                setAspect(mediaSize(el));
            }, { once: true });
        }

        // The project's own description - not the image's alt text, which stays on the image.
        d.querySelector('.wv-card-title').textContent = it.title;
        d.querySelector('.wv-card-desc').innerHTML = U.richText(it.lead);
        d.querySelector('.wv-card-desc').hidden = !it.lead;
        d.querySelector('.wv-card-sub').innerHTML = esc([it.company === 'Personal' ? null : it.company, it.typeLabel].filter(Boolean).join(' · ')) +
            (it.section === 'experiments' && state.sourceLink ? ' · <a href="experiments.html">All experiments</a>' : '');

        var link = linkFor(it);
        var a = d.querySelector('.wv-card-link');
        a.hidden = !link;
        d.querySelector('.wv-card-soon').hidden = !it.comingSoon;
        if (link) {
            a.href = link.href;
            a.innerHTML = esc(link.label) + '<span class="material-icons" aria-hidden="true">' + (link.external ? 'north_east' : 'chevron_right') + '</span>';
            if (link.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            else { a.removeAttribute('target'); a.removeAttribute('rel'); }
        }
        d.querySelector('.wv-card-count').textContent = (state.index + 1) + ' / ' + state.tiles.length;
        if (state.onChange) state.onChange(tile);
    }

    function canMorph() {
        return !state.reduced && !document.hidden && typeof document.startViewTransition === 'function';
    }

    function morph(fromEl, toEl, update) {
        if (!canMorph() || !fromEl) {
            update();
            return Promise.resolve();
        }
        fromEl.style.viewTransitionName = CARD_NAME;
        var t = document.startViewTransition(function () {
            fromEl.style.viewTransitionName = '';
            update();
            var target = toEl();
            if (target) target.style.viewTransitionName = CARD_NAME;
        });
        t.ready.catch(function () {});
        return t.finished.catch(function () {}).then(function () {
            var target = toEl();
            if (target) target.style.viewTransitionName = '';
        });
    }

    // opts: { tiles, index, stage, reduced, onChange(tile|null) }
    function open(opts) {
        ensureDialog();
        state.tiles = opts.tiles;
        state.index = opts.index;
        state.stage = opts.stage;
        state.reduced = opts.reduced;
        state.onChange = opts.onChange || null;
        // The experiments page leaves out the "All experiments" link - it's already there.
        state.sourceLink = opts.sourceLink !== false;
        var tile = state.tiles[state.index];
        var ready = mediaSize(openerMediaEl(state.index)) ? Promise.resolve() : measure(tile.media, 300);
        ready.then(function () {
            var from = openerMedia(state.index);
            morph(from, function () { return dialog.querySelector('.wv-card-media'); }, function () {
                fill();
                dialog.showModal();
            });
            if ((!from || !canMorph()) && !state.reduced) {
                dialog.querySelector('.wv-card-inner').animate([
                    { opacity: 0, transform: 'scale(0.97)' },
                    { opacity: 1, transform: 'none' }
                ], { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
            }
        });
    }

    function close() {
        var index = state.index;
        morph(dialog.querySelector('.wv-card-media'), function () { return openerMedia(index); }, function () {
            dialog.close();
            dialog.querySelector('.wv-card-media').innerHTML = '';
            if (state.onChange) state.onChange(null);
        }).then(function () {
            // Focus goes back to the item we ended on, which may not be the one we opened from.
            var t = tileEl(index);
            if (t) {
                t.focus({ preventScroll: true });
                var r = t.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) t.scrollIntoView({ block: 'center' });
            }
        });
    }

    function go(index) {
        var n = state.tiles.length;
        var target = (index + n) % n;
        state.index = target;
        // Measure the next item's shape first (briefly), so the card resizes once instead of
        // showing it at the old shape and snapping. Then swap and fade in - never waiting on
        // an animation to change content.
        measure(state.tiles[target].media, 250).then(function () {
            if (state.index !== target || !dialog.open) return;
            fill();
            if (!state.reduced) {
                dialog.querySelector('.wv-card-inner').animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
            }
        });
    }

    window.WorkViewsCard = { open: open };
})();
