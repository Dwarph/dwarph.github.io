// Work / Experiments / Projects views: the Grid view - a contact sheet of square tiles, one per item.
// Heroes take a 2x2 cell and always show their title; other tiles show theirs on hover
// or keyboard focus (work-views-grid.css). Tiles are buttons that open the detail card.

(function () {
    var esc = window.WorkViewsUtil.escapeHtml;
    var M = window.WorkViewsMedia;

    // Newest first, like the List (same year: data order; no year: last), so the latest
    // work leads the sheet rather than whichever group the data lists first. An item's
    // `sortYear` overrides its year here, to space heroes out without changing the year shown.
    function sortKey(it) {
        return it.sortYear || it.year || 0;
    }

    function buildTiles(items) {
        var sorted = items.slice().sort(function (a, b) { return sortKey(b) - sortKey(a); });
        return sorted.map(function (it) {
            return { item: it, media: it.media[0], key: it.id, hero: !!it.hero };
        });
    }

    function tileHtml(tile, n, opts) {
        var it = tile.item;
        var label = it.title + (tile.media.alt ? '. ' + tile.media.alt : '');
        return '<button type="button" class="wv-tile' + (tile.hero ? ' is-hero' : '') + '" data-wv-item="' + esc(tile.key) + '" data-wv-tile="' + n + '"' +
            ' aria-haspopup="dialog" aria-label="' + esc(label) + '">' +
            // The key is on the frame, so the whole frame is what travels between views.
            '<span class="wv-tile-media" data-wv-key="' + esc(tile.key + '|media') + '">' +
            M.mediaHtml(tile.media, { reduced: opts.reduced, loading: n < 8 ? 'eager' : 'lazy', thumb: true }) +
            '</span>' +
            '<span class="wv-tile-cap" data-wv-fade>' +
            '<span class="wv-tile-title" data-wv-key="' + esc(it.id + '|title') + '">' + esc(it.title) + '</span>' +
            '</span>' +
            '</button>';
    }

    function render(tiles, opts) {
        opts = opts || {};
        var html = '<div class="wv-grid">';
        for (var i = 0; i < tiles.length; i++) html += tileHtml(tiles[i], i, opts);
        return html + '</div>';
    }

    window.WorkViewsGrid = { buildTiles: buildTiles, render: render };
})();
