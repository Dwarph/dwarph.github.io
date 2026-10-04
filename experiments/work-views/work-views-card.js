// Work views prototype: the detail card a grid tile opens into.
// Native <dialog>: Esc and focus return come for free. ←/→ step through the
// grid's tiles; the tile's media morphs into the card when View Transitions exist.
//
// The card sizes itself to the media's aspect ratio (--ar on the dialog) so the image
// fills its box instead of floating in whitespace. Five layouts to compare (data-layout):
//   fit      - media on top, text below; card exactly as wide as the image allows
//   split    - media left at its own shape, text panel right
//   bleed    - media as large as the screen allows, small panel floating bottom-left
//   caption  - no card: rounded media, text set on the backdrop beneath
//   adaptive - fit for landscape media, split for square/portrait

(function () {
    var esc = function (s) { return window.WorkViewsUtil.escapeHtml(s); };
    var M = window.WorkViewsMedia;
    var CARD_NAME = 'wv-card-media';

    var dialog = null;
    var state = { tiles: [], index: 0, stage: null, reduced: false, layout: 'fit', upscale: 1, onChange: null };

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
            '<span class="wv-card-nav">' +
            '<button type="button" class="wv-card-step" data-step="-1" aria-label="Previous"><span class="material-icons" aria-hidden="true">arrow_back</span></button>' +
            '<span class="wv-card-count" aria-live="polite"></span>' +
            '<button type="button" class="wv-card-step" data-step="1" aria-label="Next"><span class="material-icons" aria-hidden="true">arrow_forward</span></button>' +
            '</span>' +
            '</div></div></div>';
        document.body.appendChild(dialog);

        dialog.addEventListener('click', function (e) {
            // The dialog is a full-screen scroller, so clicks around the card land on it.
            // In bleed the inner grid is the empty stage itself, so that closes too.
            if (e.target === dialog || (state.layout === 'bleed' && e.target.classList.contains('wv-card-inner'))) close();
            var step = e.target.closest && e.target.closest('[data-step]');
            if (step) go(state.index + Number(step.dataset.step));
            if (e.target.closest && e.target.closest('.wv-card-close')) close();
        });
        dialog.addEventListener('keydown', function (e) {
            // The dev picker rides inside the dialog while it's open; leave its keys alone.
            if (e.target.closest && e.target.closest('.wv-picker')) return;
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

    // Aspect ratio drives the card's size, and the native width caps it: most archive
    // loops are ~288px, so showing them at 700px just shows off the blur. --nat-w is the
    // largest width the media may display at (native x upscale limit; huge when off/unknown).
    // The tile's media is usually already loaded, so the first frame is right; otherwise
    // this runs again when the card's own copy loads.
    function setAspect(size) {
        var ar = size ? size[0] / size[1] : 16 / 9;
        ar = Math.max(0.45, Math.min(ar, 3));
        dialog.style.setProperty('--ar', ar.toFixed(4));
        dialog.style.setProperty('--nat-w', size && state.upscale ? Math.round(size[0] * state.upscale) + 'px' : '9999px');
        dialog.dataset.orient = ar > 1.2 ? 'landscape' : 'portrait';
    }

    function fill() {
        var tile = state.tiles[state.index];
        var it = tile.item;
        var d = dialog;
        d.dataset.layout = state.layout;

        var tileMediaEl = sourceMediaEl(state.index);
        setAspect(mediaSize(tileMediaEl));

        var box = d.querySelector('.wv-card-media');
        box.innerHTML = M.mediaHtml(tile.media, { reduced: state.reduced, playing: true, loading: 'eager' });
        var el = box.firstElementChild;
        if (el && !mediaSize(tileMediaEl)) {
            el.addEventListener(el.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', function () {
                setAspect(mediaSize(el));
            }, { once: true });
        }

        // The project's own description - not the image's alt text, which stays on the image.
        d.querySelector('.wv-card-title').textContent = it.title;
        d.querySelector('.wv-card-desc').innerHTML = window.WorkViewsUtil.richText(it.lead);
        d.querySelector('.wv-card-desc').hidden = !it.lead;
        d.querySelector('.wv-card-sub').innerHTML = esc([it.company === 'Personal' ? null : it.company, it.typeLabel].filter(Boolean).join(' · ')) +
            (it.kind === 'archive' ? ' · <a href="' + esc(it.sourceHref) + '">Interaction Archive</a>' : '');

        var link = linkFor(it);
        var a = d.querySelector('.wv-card-link');
        a.hidden = !link;
        if (link) {
            a.href = link.href;
            a.innerHTML = esc(link.label) + '<span class="material-icons" aria-hidden="true">' + (link.external ? 'north_east' : 'chevron_right') + '</span>';
            if (link.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            else { a.removeAttribute('target'); a.removeAttribute('rel'); }
        }
        d.querySelector('.wv-card-count').textContent = (state.index + 1) + ' / ' + state.tiles.length;
        // Let the app mirror the open card in the URL.
        if (state.onChange) state.onChange(tile);
    }

    function tileEl(index) {
        return state.stage && state.stage.querySelector('[data-wv-tile="' + index + '"]');
    }

    // The card opens from grid tiles and from list rows. A row's media is its thumbnail
    // (if it has one); a text-only row morphs from the row itself.
    function tileMedia(index) {
        var t = tileEl(index);
        if (!t) return null;
        return t.querySelector('.wv-tile-media, .wv-icard-media, .wv-row-thumb') || t;
    }

    function sourceMediaEl(index) {
        var t = tileEl(index);
        return t && t.querySelector('.wv-tile-media > *, [data-wv-key$="|media"]');
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

    function open(opts) {
        ensureDialog();
        state.tiles = opts.tiles;
        state.index = opts.index;
        state.stage = opts.stage;
        state.reduced = opts.reduced;
        state.layout = opts.layout || 'fit';
        state.upscale = typeof opts.upscale === 'number' ? opts.upscale : 1;
        state.onChange = opts.onChange || null;
        morph(tileMedia(state.index), function () { return dialog.querySelector('.wv-card-media'); }, function () {
            fill();
            dialog.showModal();
            document.dispatchEvent(new CustomEvent('wv:card-open', { detail: { dialog: dialog } }));
        });
    }

    // Card settings changed while it's open (dev picker): re-lay out the same media.
    function refresh(opts) {
        if (typeof opts.layout === 'string') state.layout = opts.layout;
        if (typeof opts.upscale === 'number') state.upscale = opts.upscale;
        if (dialog && dialog.open) fill();
    }

    function close() {
        var index = state.index;
        morph(dialog.querySelector('.wv-card-media'), function () { return tileMedia(index); }, function () {
            document.dispatchEvent(new CustomEvent('wv:card-close', { detail: { dialog: dialog } }));
            dialog.close();
            if (state.onChange) state.onChange(null);
            dialog.querySelector('.wv-card-media').innerHTML = '';
        }).then(function () {
            // Focus goes back to the tile we ended on, which may not be the one we opened from.
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
        state.index = (index + n) % n;
        var inner = dialog.querySelector('.wv-card-inner');
        if (state.reduced) {
            fill();
            return;
        }
        // Swap first, then fade in: never wait on an animation to change content (a paused
        // or throttled tab would otherwise leave the card stuck on the old tile).
        fill();
        inner.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }

    window.WorkViewsCard = { open: open, refresh: refresh };
})();
