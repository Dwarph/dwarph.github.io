// Work views prototype: the four Grid layouts.
// Density decides which media become tiles ("covers": one per item, "all": every image
// and loop we have). The hero flag makes a tile bigger in every layout.

(function () {
    var esc = function (s) { return window.WorkViewsUtil.escapeHtml(s); };
    var M = window.WorkViewsMedia;

    function buildTiles(items, density, heroes) {
        var tiles = [];
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var count = density === 'all' ? it.media.length : 1;
            for (var m = 0; m < count; m++) {
                tiles.push({
                    item: it,
                    media: it.media[m],
                    isCover: m === 0,
                    // Only covers share identity with List/Featured; extra media just fade in.
                    key: m === 0 ? it.id : it.id + '~' + m,
                    hero: !!(heroes && it.hero && m === 0)
                });
            }
        }
        return tiles;
    }

    function tileHtml(tile, n, opts, extraCls) {
        var it = tile.item;
        var cls = 'wv-tile' + (tile.hero ? ' is-hero' : '') + (tile.isCover ? '' : ' is-extra') + (extraCls ? ' ' + extraCls : '');
        var title = tile.isCover ?
            '<span class="wv-tile-title" data-wv-key="' + esc(it.id + '|title') + '">' + esc(it.title) + '</span>' :
            '<span class="wv-tile-title">' + esc(it.title) + '</span>';
        var label = it.title + (it.yearLabel ? ', ' + it.yearLabel : '') + (tile.media.alt ? '. ' + tile.media.alt : '');
        return '<button type="button" class="' + cls + '" data-wv-item="' + esc(tile.key) + '" data-wv-tile="' + n + '"' +
            ' aria-haspopup="dialog" aria-label="' + esc(label) + '">' +
            '<span class="wv-tile-media">' +
            M.mediaHtml(tile.media, { key: tile.key + '|media', reduced: opts.reduced, loading: n < 6 ? 'eager' : 'lazy' }) +
            '</span>' +
            '<span class="wv-tile-cap" data-wv-fade>' + title +
            '<span class="wv-tile-year">' + esc(it.yearLabel || '') + '</span>' +
            '<span class="wv-tile-cat">' + esc(tile.isCover ? (it.category || it.typeLabel) : (tile.media.alt || it.typeLabel)) + '</span>' +
            '</span>' +
            '</button>';
    }

    // A: Gallery stagger - two independent columns, the right one offset; heroes run full width.
    function renderStagger(tiles, opts) {
        var html = '<div class="wv-grid wv-grid--a">';
        var left = [];
        var right = [];
        function flush() {
            if (!left.length && !right.length) return;
            html += '<div class="wv-stag-cols"><div class="wv-stag-col">' + left.join('') +
                '</div><div class="wv-stag-col wv-stag-col--offset">' + right.join('') + '</div></div>';
            left = [];
            right = [];
        }
        var seg = 0;
        for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].hero) {
                flush();
                seg = 0;
                html += '<div class="wv-stag-hero" style="order:' + i + '">' + tileHtml(tiles[i], i, opts) + '</div>';
                continue;
            }
            // A gentle rhythm of portrait and landscape crops down each column.
            var shape = (Math.floor(seg / 2) % 3 === 1) ? 'wv-shape-tall' : 'wv-shape-wide';
            // order keeps reading order when mobile collapses the two columns into one.
            (seg % 2 === 0 ? left : right).push(tileHtml(tiles[i], i, opts, shape).replace('<button ', '<button style="order:' + i + '" '));
            seg++;
        }
        flush();
        return html + '</div>';
    }

    // B: Masonry wall - natural aspect ratios in CSS columns; heroes span every column.
    function renderMasonry(tiles, opts) {
        var html = '<div class="wv-grid wv-grid--b">';
        for (var i = 0; i < tiles.length; i++) html += tileHtml(tiles[i], i, opts);
        return html + '</div>';
    }

    // C: Bento rhythm - a repeating span pattern on a dense grid; heroes take 2x2.
    var BENTO = ['s11', 's11', 's21', 's12', 's11', 's11', 's21', 's11'];
    function renderBento(tiles, opts) {
        var html = '<div class="wv-grid wv-grid--c">';
        var p = 0;
        for (var i = 0; i < tiles.length; i++) {
            var span = tiles[i].hero ? 's22' : BENTO[p++ % BENTO.length];
            html += tileHtml(tiles[i], i, opts, 'wv-' + span);
        }
        return html + '</div>';
    }

    // D: Contact sheet - tight square proofs; heroes take 2x2. Titles surface on hover/focus.
    function renderContact(tiles, opts) {
        var html = '<div class="wv-grid wv-grid--d">';
        for (var i = 0; i < tiles.length; i++) html += tileHtml(tiles[i], i, opts);
        return html + '</div>';
    }

    function renderGrid(tiles, variant, opts) {
        opts = opts || {};
        switch (variant) {
            case 'b': return renderMasonry(tiles, opts);
            case 'c': return renderBento(tiles, opts);
            case 'd': return renderContact(tiles, opts);
            default: return renderStagger(tiles, opts);
        }
    }

    // Contact-sheet label modes that need JS: "cursor" (pill follows the pointer) and
    // "readout" (title shows beside the sticky switcher). Bound once per stage; the
    // current mode is read from <html> at event time, so switching modes needs no rebind.
    var cursorEl = null;
    function labelMode() {
        var m = /(?:^|\s)wv-cl-(\w+)/.exec(document.documentElement.className);
        return m ? m[1] : 'none';
    }

    function contactTile(target, stage) {
        var tile = target && target.closest && target.closest('.wv-grid--d .wv-tile');
        return tile && stage.contains(tile) ? tile : null;
    }

    // Title only - contact sheet labels never carry the year.
    function labelHtml(tile) {
        var t = tile.querySelector('.wv-tile-title');
        return esc(t ? t.textContent : '');
    }

    // getReadout returns the section's current readout element (the dock is rebuilt when
    // the switcher style changes, so a captured element would go stale).
    function attach(stage, getReadout) {
        if (stage.dataset.wvLabelsBound) return;
        stage.dataset.wvLabelsBound = '1';
        var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        function show(tile, e) {
            var mode = labelMode();
            var readoutEl = getReadout();
            if (mode === 'readout' && readoutEl) {
                readoutEl.innerHTML = labelHtml(tile);
                readoutEl.classList.add('is-on');
            } else if (mode === 'cursor' && (fine || !e)) {
                if (!cursorEl) {
                    cursorEl = document.createElement('div');
                    cursorEl.className = 'wv-cursor-label';
                    cursorEl.setAttribute('aria-hidden', 'true');
                    document.body.appendChild(cursorEl);
                }
                cursorEl.innerHTML = labelHtml(tile);
                var x, y;
                if (e) { x = e.clientX + 16; y = e.clientY + 18; }
                else { var r = tile.getBoundingClientRect(); x = r.left + 8; y = r.bottom + 8; }
                cursorEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
                cursorEl.classList.add('is-on');
            }
        }

        function hide() {
            var readoutEl = getReadout();
            if (readoutEl) readoutEl.classList.remove('is-on');
            if (cursorEl) cursorEl.classList.remove('is-on');
        }

        stage.addEventListener('pointermove', function (e) {
            var tile = contactTile(e.target, stage);
            if (tile) show(tile, e);
            else hide();
        });
        stage.addEventListener('pointerleave', hide);
        stage.addEventListener('focusin', function (e) {
            var tile = contactTile(e.target, stage);
            if (tile && tile.matches(':focus-visible')) show(tile, null);
        });
        stage.addEventListener('focusout', hide);
        // A click opens the card; don't leave a label hanging behind it.
        stage.addEventListener('click', hide);
    }

    window.WorkViewsGrid = { buildTiles: buildTiles, render: renderGrid, attach: attach };
})();
