// Experiments page (experiments.html): every interaction experiment and prototype, as a
// wall of loops grouped by year. Replaces the Interaction Archive.
//
// Items come from the same builder as the homepage's Experiments section
// (window.loadExperimentItems in workViewsData.js), and open the same detail card
// (workViewsCard.js). Loops play while on screen and pause off it; with reduced motion
// they show their poster and a play button instead.

(function () {
    // Filters: All, then each origin the data has, current employer first.
    var ORIGIN_ORDER = ['FitXR', 'Ultraleap', 'Personal'];
    var FILTERS = [{ id: 'all', label: 'All' }];

    var esc = function (s) { return window.WorkViewsUtil.escapeHtml(s); };
    var isVideo = function (src) { return window.WorkViewsUtil.isVideo(src); };

    var container = null;
    var wall = null;
    var items = [];
    var tiles = [];
    var state = { filter: 'all', card: null };

    function isReduced() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ---- URL state: ?filter=personal&card=a-microgestures ----

    function buildFilters() {
        var seen = {};
        items.forEach(function (it) { seen[it.origin] = true; });
        var origins = Object.keys(seen).sort(function (a, b) {
            var ia = ORIGIN_ORDER.indexOf(a), ib = ORIGIN_ORDER.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });
        FILTERS = [{ id: 'all', label: 'All' }].concat(origins.map(function (o) { return { id: o, label: o }; }));
    }

    function readUrl() {
        var q = new URLSearchParams(location.search);
        var f = q.get('filter');
        FILTERS.forEach(function (x) { if (f && x.id.toLowerCase() === f.toLowerCase()) state.filter = x.id; });
        state.card = q.get('card');
    }

    function writeUrl() {
        var q = new URLSearchParams(location.search);
        if (state.filter === 'all') q.delete('filter'); else q.set('filter', state.filter.toLowerCase());
        if (state.card) q.set('card', state.card); else q.delete('card');
        var s = q.toString();
        history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
    }

    // ---- Rendering ----

    function mediaHtml(media) {
        var fit = media.fit ? ' data-fit="' + esc(media.fit) + '"' : '';
        if (media.type === 'video') {
            return '<video class="exp-wall-video"' + fit + ' muted loop playsinline preload="none" data-src="' + esc(media.src) + '"' +
                (media.poster ? ' poster="' + esc(media.poster) + '"' : '') +
                ' aria-label="' + esc(media.alt) + '"></video>';
        }
        return '<img' + fit + ' src="' + esc(media.src) + '" alt=""' + esc(media.alt) + '" loading="lazy" decoding="async" />';
    }

    function tileHtml(it, n, reduced) {
        var media = it.media[0];
        var meta = [it.origin, it.typeLabel].filter(Boolean).join(' · ');
        // The card opener is a button; the reduced-motion play button sits beside it, over
        // the media, so the two never nest.
        return '<li class="exp-wall-item">' +
            '<button type="button" class="exp-wall-open" data-wv-tile="' + n + '" aria-haspopup="dialog">' +
            '<span class="exp-wall-media" data-wv-key="' + esc(it.id + '|media') + '">' + mediaHtml(media) + '</span>' +
            '<span class="exp-wall-text">' +
            '<span class="exp-wall-title">' + esc(it.title) + '</span>' +
            (it.short ? '<span class="exp-wall-short">' + esc(it.short) + '</span>' : '') +
            '<span class="exp-wall-meta">' + esc(meta) + '</span>' +
            '</span></button>' +
            (reduced && media.type === 'video' ?
                '<button type="button" class="exp-wall-play" aria-pressed="false" aria-label="Play ' + esc(it.title) + '">' +
                '<span class="material-icons" aria-hidden="true">play_arrow</span></button>' : '') +
            '</li>';
    }

    function visibleItems() {
        if (state.filter === 'all') return items;
        return items.filter(function (it) { return it.origin === state.filter; });
    }

    function renderWall() {
        stopVideos();
        var list = visibleItems();
        var reduced = isReduced();
        tiles = list.map(function (it) { return { item: it, media: it.media[0], key: it.id, hero: false }; });

        var html = '';
        var year = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].year !== year) {
                if (year !== null) html += '</ul></section>';
                year = list[i].year;
                html += '<section class="exp-year" aria-labelledby="exp-year-' + year + '">' +
                    '<h2 class="exp-year-label" id="exp-year-' + year + '">' + year + '</h2>' +
                    '<ul class="exp-wall-grid" role="list">';
            }
            html += tileHtml(list[i], i, reduced);
        }
        if (year !== null) html += '</ul></section>';
        wall.innerHTML = html || '<p class="exp-empty">Nothing here yet.</p>';

        if (!reduced) {
            observeVideos();
            reveal();
        }
    }

    function filtersHtml() {
        var counts = { all: items.length };
        items.forEach(function (it) { counts[it.origin] = (counts[it.origin] || 0) + 1; });
        var html = '<div class="exp-filters" role="group" aria-label="Show experiments from">';
        FILTERS.forEach(function (f) {
            html += '<button type="button" class="exp-filter" data-filter="' + f.id + '" aria-pressed="' + (state.filter === f.id) + '">' +
                esc(f.label) + ' <span class="exp-filter-count">' + (counts[f.id] || 0) + '</span></button>';
        });
        return html + '</div>';
    }

    function renderPage() {
        var html =
            '<nav class="breadcrumb-nav" role="navigation" aria-label="Breadcrumb">' +
            '<a href="index.html" class="breadcrumb-link">Home</a>' +
            '<span class="breadcrumb-separator" aria-hidden="true">/</span>' +
            '<span class="breadcrumb-current" aria-current="page">Experiments</span>' +
            '</nav>' +
            '<header class="homepage-section exp-head">' +
            '<h1 class="section-title">Experiments</h1>' +
            '<p class="exp-intro">Interaction experiments and prototypes. Most come from my five years at ' +
            '<span class="bio-gradient-ultraleap">Ultraleap</span>, where we explored novel spatial interactions to prove ' +
            'high fidelity hand tracking as a primary input for XR. The rest are motion and UI play at ' +
            '<span class="bio-gradient-fitxr">FitXR</span>, or things I made for fun.</p>' +
            filtersHtml() +
            '</header>' +
            '<main id="experiments-wall" class="exp-wall" tabindex="-1"></main>';
        if (typeof window.renderReturnHomeLink === 'function') html += window.renderReturnHomeLink();
        container.innerHTML = html;
        wall = container.querySelector('#experiments-wall');
    }

    // ---- Loops: play while on screen, pause off it ----

    var observer = null;

    function observeVideos() {
        var vids = wall.querySelectorAll('video[data-src]');
        if (!('IntersectionObserver' in window)) {
            for (var i = 0; i < vids.length; i++) vids[i].src = vids[i].dataset.src;
            return;
        }
        if (!observer) {
            observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    var v = e.target;
                    if (e.isIntersecting) {
                        if (!v.getAttribute('src')) v.src = v.dataset.src;
                        var p = v.play();
                        if (p && p.catch) p.catch(function () {});
                    } else if (!v.paused) {
                        v.pause();
                    }
                });
            }, { threshold: 0.35 });
        }
        for (var j = 0; j < vids.length; j++) observer.observe(vids[j]);
    }

    function stopVideos() {
        if (observer) observer.disconnect();
        if (!wall) return;
        var vids = wall.querySelectorAll('video');
        for (var i = 0; i < vids.length; i++) vids[i].pause();
    }

    // A gentle rise as each tile first comes on screen (never with reduced motion).
    var revealer = null;
    function reveal() {
        if (!('IntersectionObserver' in window)) return;
        wall.classList.add('exp-wall--reveal');
        if (revealer) revealer.disconnect();
        revealer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.classList.add('is-in');
                revealer.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        var els = wall.querySelectorAll('.exp-wall-item');
        for (var i = 0; i < els.length; i++) revealer.observe(els[i]);
    }

    // ---- Detail card ----

    function openCard(index) {
        window.WorkViewsCard.open({
            tiles: tiles,
            index: index,
            stage: wall,
            reduced: isReduced(),
            sourceLink: false,
            onChange: function (tile) {
                state.card = tile ? tile.key : null;
                writeUrl();
            }
        });
    }

    function restoreCard() {
        if (!state.card) return;
        var index = -1;
        tiles.forEach(function (t, i) { if (t.key === state.card) index = i; });
        if (index === -1 && state.filter !== 'all') {
            // A link to a card the filter hides: show everything rather than lose the card.
            setFilter('all');
            tiles.forEach(function (t, i) { if (t.key === state.card) index = i; });
        }
        if (index === -1) { state.card = null; writeUrl(); return; }
        var el = wall.querySelector('[data-wv-tile="' + index + '"]');
        if (el) el.scrollIntoView({ block: 'center' });
        openCard(index);
    }

    function setFilter(id) {
        if (state.filter === id) return;
        state.filter = id;
        var btns = container.querySelectorAll('.exp-filter');
        for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', String(btns[i].dataset.filter === id));
        writeUrl();
        renderWall();
    }

    function bind() {
        container.addEventListener('click', function (e) {
            var f = e.target.closest('.exp-filter');
            if (f) { setFilter(f.dataset.filter); return; }

            var play = e.target.closest('.exp-wall-play');
            if (play) {
                var v = play.parentNode.querySelector('video');
                if (!v.getAttribute('src')) v.src = v.dataset.src;
                if (v.paused) {
                    var p = v.play();
                    if (p && p.catch) p.catch(function () {});
                } else {
                    v.pause();
                }
                var on = !v.paused;
                play.setAttribute('aria-pressed', String(on));
                play.querySelector('.material-icons').textContent = on ? 'pause' : 'play_arrow';
                return;
            }

            var open = e.target.closest('[data-wv-tile]');
            if (open) openCard(Number(open.dataset.wvTile));
        });
    }

    // ---- Load ----

    function showError() {
        container.removeAttribute('aria-busy');
        container.innerHTML =
            '<div class="page-status page-status--error" role="alert">' +
            '<p class="page-status-text">Could not load the experiments. Check your connection and try again.</p>' +
            '<button type="button" class="page-status-retry" id="experiments-retry">Try again</button>' +
            '</div>';
        document.getElementById('experiments-retry').addEventListener('click', function () {
            location.reload();
        });
    }

    function init() {
        container = document.getElementById('experiments-container');
        if (!container || typeof window.loadExperimentItems !== 'function') return;
        container.setAttribute('aria-busy', 'true');
        window.loadExperimentItems().then(function (list) {
            container.removeAttribute('aria-busy');
            items = list;
            buildFilters();
            readUrl();
            renderPage();
            renderWall();
            bind();
            restoreCard();
        }, showError);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
