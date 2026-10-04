// Work + Projects views: Featured / List / Grid for the homepage's Work and Projects
// sections, driven by one switcher (prototyped in experiments/work-views/).
//
// Featured is the existing homepage markup. It stays in the page and is only hidden while
// List or Grid shows, so scrollAnim.js (which captured those elements at load) keeps
// working when you come back to it. List and Grid render into a sibling container.
//
// Grid is the default view. The view (when not the default) and any open detail card live
// in the URL (?view=list&card=work:a-aurora), so a link reopens exactly what was on screen.
// Called by homepageGenerator.js after render.

(function () {
    var SECTIONS = [
        { id: 'work', label: 'Work', brandLine: true },
        { id: 'projects', label: 'Projects', brandLine: false }
    ];
    var VIEWS = ['featured', 'list', 'grid'];
    // What the bare homepage shows; the URL only names a view when it differs.
    var DEFAULT_VIEW = 'grid';
    var GROUP_LABEL = 'Work and projects view';

    var home = null;
    var items = null;
    var hosts = {};
    var shared = { dock: null, switcher: null };
    var state = { view: DEFAULT_VIEW, card: null };

    // ---- URL state ----

    function readUrl() {
        var q = new URLSearchParams(location.search);
        var view = q.get('view');
        state.view = VIEWS.indexOf(view) !== -1 ? view : DEFAULT_VIEW;
        state.card = q.get('card');
    }

    function writeUrl() {
        var q = new URLSearchParams(location.search);
        if (state.view === DEFAULT_VIEW) q.delete('view');
        else q.set('view', state.view);
        if (state.card) q.set('card', state.card);
        else q.delete('card');
        var s = q.toString();
        history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash);
    }

    function isReduced() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ---- Data ----

    var stamped = false;

    function ensureItems() {
        return window.loadWorkViewsData(home).then(function (d) {
            items = d;
            if (!stamped) {
                stamped = true;
                SECTIONS.forEach(function (sec) { stampFeatured(sec.id); });
            }
            return d;
        });
    }

    // Give Featured's cards the same keys List and Grid use, so a swap can fly them.
    function stampFeatured(sectionId) {
        var host = hosts[sectionId];
        var byTitle = {};
        items[sectionId].forEach(function (it) { byTitle[it.title] = it; });
        var titleSel = sectionId === 'work' ?
            '.case-study-title-link, .case-study-title' :
            '.pb-name, .project-title-link, .project-title';
        var titles = host.featured.querySelectorAll(titleSel);
        for (var i = 0; i < titles.length; i++) {
            var t = titles[i];
            var text = (t.firstChild && t.firstChild.nodeType === 3 ? t.firstChild.nodeValue : t.textContent).trim();
            var it = byTitle[text];
            if (!it) continue;
            var card = t.closest('.case-study-card-link, .project-banner-link, .project-card-link') ||
                t.closest('.case-study-card, .project-card');
            if (!card) continue;
            card.setAttribute('data-wv-item', it.id);
            t.setAttribute('data-wv-key', it.id + '|title');
            mark(card.querySelectorAll('.case-study-image, .pb-bg, .pb-art img, .project-image'), 'data-wv-key', it.id + '|media');
            mark(card.querySelectorAll('.case-study-tags, .case-study-description, .pb-meta, .pb-lead, .pb-cta, .project-meta, .project-description, .link-icon'), 'data-wv-fade', '');
        }
    }

    function mark(els, attr, value) {
        for (var i = 0; i < els.length; i++) els[i].setAttribute(attr, value);
    }

    // ---- Rendering ----

    function renderStage(sectionId) {
        var host = hosts[sectionId];
        var view = state.view;
        window.WorkViewsMedia.unobserveVideos(host.alt);
        host.stage.classList.toggle('wv-stage--wide', view === 'grid');

        if (view === 'featured') {
            host.alt.hidden = true;
            host.alt.innerHTML = '';
            host.featured.hidden = false;
            host.tiles = null;
            return;
        }

        host.featured.hidden = true;
        host.alt.hidden = false;
        if (view === 'list') {
            host.alt.innerHTML = window.WorkViewsList.render(items[sectionId], { brandLine: host.brandLine, reduced: isReduced() });
            window.WorkViewsList.attach(host.alt);
            host.tiles = listTiles(host.alt, items[sectionId]);
        } else {
            host.tiles = window.WorkViewsGrid.buildTiles(items[sectionId]);
            host.alt.innerHTML = window.WorkViewsGrid.render(host.tiles, { reduced: isReduced() });
        }
        window.WorkViewsMedia.observeVideos(host.alt);
        if (window.refreshScrollAnim) window.refreshScrollAnim();
    }

    // List rows open the detail card too. Tiles follow the rows' on-screen order, so ←/→
    // in the card walk the list as you see it.
    function listTiles(root, list) {
        var byId = {};
        list.forEach(function (it) { byId[it.id] = it; });
        var tiles = [];
        var rows = root.querySelectorAll('[data-wv-item]');
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var it = byId[row.getAttribute('data-wv-item')];
            if (!it) continue;
            row.setAttribute('data-wv-tile', tiles.length);
            row.setAttribute('aria-haspopup', 'dialog');
            if (row.tagName !== 'A') {
                row.setAttribute('role', 'button');
                row.setAttribute('tabindex', '0');
            }
            tiles.push({ item: it, media: it.media[0], key: it.id, hero: false });
        }
        return tiles;
    }

    // Featured was hidden while its layout-dependent bits (the timeline bar's start,
    // scroll reveals) could go stale: re-measure and nudge scrollAnim once it's back.
    function refreshFeatured() {
        requestAnimationFrame(function () {
            if (window.updateHomepageTimelinePositions) window.updateHomepageTimelinePositions();
            window.dispatchEvent(new Event('scroll'));
        });
    }

    // The section the reader is looking at - whichever fills most of the screen. It's held
    // still while both swap.
    function anchorSection() {
        var best = null;
        var bestShown = 0;
        SECTIONS.forEach(function (sec) {
            var r = hosts[sec.id].section.getBoundingClientRect();
            var shown = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
            if (shown > bestShown) { bestShown = shown; best = hosts[sec.id].section; }
        });
        return best;
    }

    function transition(opts) {
        window.WorkViewsMotion.swap({
            targets: SECTIONS.map(function (sec) {
                return { stage: hosts[sec.id].stage, render: function () { renderStage(sec.id); } };
            }),
            anchor: anchorSection(),
            reduced: isReduced(),
            instant: opts && opts.instant
        });
        if (state.view === 'featured') refreshFeatured();
    }

    function setView(view) {
        if (state.view === view) return;
        var previous = state.view;
        state.view = view;
        state.card = null;
        window.WorkViewsSwitcher.setActive(shared.switcher, view);
        writeUrl();
        ensureItems().then(function () {
            // A later click may already have moved on.
            if (state.view === view) transition();
        }, function (err) {
            console.error('[work views] could not load items', err);
            state.view = previous;
            window.WorkViewsSwitcher.setActive(shared.switcher, previous);
            writeUrl();
        });
    }

    // ---- Detail card ----

    function openCard(sectionId, index) {
        window.WorkViewsCard.open({
            tiles: hosts[sectionId].tiles,
            index: index,
            stage: hosts[sectionId].alt,
            reduced: isReduced(),
            onChange: function (tile) {
                state.card = tile ? sectionId + ':' + tile.key : null;
                writeUrl();
            }
        });
    }

    // Reopen the card named in the URL (only List and Grid have cards).
    function restoreCard() {
        if (!state.card || state.view === 'featured') {
            if (state.card) { state.card = null; writeUrl(); }
            return;
        }
        var sep = state.card.indexOf(':');
        var host = hosts[state.card.slice(0, sep)];
        var key = state.card.slice(sep + 1);
        var index = -1;
        if (host && host.tiles) {
            host.tiles.forEach(function (t, i) { if (index === -1 && t.key === key) index = i; });
        }
        if (index === -1) { state.card = null; writeUrl(); return; }
        var el = host.alt.querySelector('[data-wv-tile="' + index + '"]');
        if (el) el.scrollIntoView({ block: 'center' });
        openCard(state.card.slice(0, sep), index);
    }

    function bindOpeners(sectionId) {
        var alt = hosts[sectionId].alt;
        alt.addEventListener('click', function (e) {
            var tile = e.target.closest && e.target.closest('[data-wv-tile]');
            if (!tile || !hosts[sectionId].tiles) return;
            if (tile.tagName === 'A') {
                // Cmd/Ctrl/Shift-click and middle-click still follow the link as usual, and so
                // does a hero card's CTA pill - it's the "take me there" part of the card.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (e.target.closest('.wv-icard-cta')) return;
                e.preventDefault();
            }
            openCard(sectionId, Number(tile.dataset.wvTile));
        });
        // Rows without a link are role=button divs; give them the keyboard behaviour of one.
        alt.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var row = e.target.closest && e.target.closest('[data-wv-tile][role="button"]');
            if (!row || row !== e.target) return;
            e.preventDefault();
            row.click();
        });
    }

    // The bio's employer links (#work-fitxr, #work-ultraleap) point at Featured's job
    // blocks. While List or Grid shows, those are hidden: point at that employer's intro
    // row (List) or first tile (Grid) instead. Returns null in Featured.
    window.resolveWorkViewsAnchor = function (id) {
        var host = hosts.work;
        if (!host || state.view === 'featured' || host.alt.hidden) return null;
        if (state.view === 'list') return host.alt.querySelector('[data-wv-anchor="' + id + '"]');
        var gradient = id.replace(/^work-/, '');
        var tiles = host.tiles || [];
        for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].item.gradient === gradient) return host.alt.querySelector('[data-wv-tile="' + i + '"]');
        }
        return null;
    };

    // ---- Setup ----

    // Line the switcher's centre up with the Work title at rest. offsetTop/offsetHeight
    // ignore transforms, so the title's scroll-reveal nudge doesn't throw it off.
    function alignDock() {
        var title = hosts.work && hosts.work.section.querySelector('.section-title');
        if (!title || !shared.switcher) return;
        var offset = hosts.work.section.offsetTop + title.offsetTop +
            (title.offsetHeight - shared.switcher.offsetHeight) / 2;
        shared.dock.style.setProperty('--wv-dock-offset', Math.round(offset) + 'px');
    }

    // Wrap a rendered section's content (everything after its title) as the Featured view,
    // next to an empty container for List/Grid.
    function adoptSection(container, sec) {
        var section = container.querySelector('#' + sec.id);
        if (!section) return null;
        var title = section.querySelector('.section-title');
        var stage = document.createElement('div');
        stage.className = 'wv-stage';
        var featured = document.createElement('div');
        featured.className = 'wv-featured';
        var alt = document.createElement('div');
        alt.className = 'wv-alt';
        alt.hidden = true;
        var node = title ? title.nextSibling : section.firstChild;
        while (node) {
            var next = node.nextSibling;
            featured.appendChild(node);
            node = next;
        }
        stage.appendChild(featured);
        stage.appendChild(alt);
        section.appendChild(stage);
        section.classList.add('wv-section');
        return { section: section, stage: stage, featured: featured, alt: alt, brandLine: sec.brandLine, tiles: null };
    }

    window.initWorkViews = function (container, homeData) {
        if (!container || !homeData || typeof window.loadWorkViewsData !== 'function') return;
        home = homeData;
        readUrl();

        for (var i = 0; i < SECTIONS.length; i++) {
            var host = adoptSection(container, SECTIONS[i]);
            if (!host) return;
            hosts[SECTIONS[i].id] = host;
        }

        // One sticky dock for both sections: the first child of a wrapper around them, so
        // the switcher stays pinned from the Work title down through Projects.
        var wrapper = document.createElement('div');
        wrapper.className = 'wv-sections';
        var dock = document.createElement('div');
        dock.className = 'homepage-section wv-dock';
        var workSection = hosts.work.section;
        workSection.parentNode.insertBefore(wrapper, workSection);
        wrapper.appendChild(dock);
        wrapper.appendChild(workSection);
        wrapper.appendChild(hosts.projects.section);

        dock.innerHTML = window.WorkViewsSwitcher.render(GROUP_LABEL, state.view);
        shared.dock = dock;
        shared.switcher = dock.firstElementChild;
        alignDock();
        window.addEventListener('resize', function () { requestAnimationFrame(alignDock); });
        window.WorkViewsSwitcher.bind(shared.switcher, function () { return state.view; }, setView);

        // Someone on Featured may still reach for the switcher: fetch the data early.
        var prefetch = function () { ensureItems().catch(function () {}); };
        dock.addEventListener('pointerenter', prefetch, { once: true });
        dock.addEventListener('focusin', prefetch, { once: true });

        SECTIONS.forEach(function (sec) { bindOpeners(sec.id); });

        if (state.view !== 'featured') {
            // Hide Featured straight away so it doesn't flash before List/Grid arrive (the
            // markup stays for scroll reveals and crawlers). If the data can't load, fall
            // back to Featured rather than leave the sections empty.
            SECTIONS.forEach(function (sec) { hosts[sec.id].featured.hidden = true; });
            ensureItems().then(function () {
                transition({ instant: true });
                restoreCard();
            }, function () {
                state.view = 'featured';
                SECTIONS.forEach(function (sec) { hosts[sec.id].featured.hidden = false; });
                window.WorkViewsSwitcher.setActive(shared.switcher, 'featured');
                writeUrl();
                refreshFeatured();
            });
        } else if (state.card) {
            state.card = null;
            writeUrl();
        }
    };
})();
