// Work views prototype: state, section rendering and wiring.
// State lives in the URL query so any combination can be shared:
//   ?work=grid&projects=list&wl=e&wg=d&pl=b&pg=d&density=all&heroes=1&hs=card&sw=s2&fx=flip&motion=reduced
// Defaults follow the first round of feedback: index lists, contact sheet grids,
// FLIP transitions and the icon switcher.

(function () {
    var SECTIONS = [
        { id: 'work', label: 'Work', listParam: 'wl', gridParam: 'wg', defaultList: 'e', defaultGrid: 'd' },
        { id: 'projects', label: 'Projects', listParam: 'pl', gridParam: 'pg', defaultList: 'b', defaultGrid: 'd' }
    ];
    var LIST_VARIANTS = ['a', 'b', 'c', 'd', 'e', 'f'];
    var GRID_VARIANTS = ['a', 'b', 'c', 'd'];
    // 1-5 keep the image clean (hover/elsewhere); 6-10 label every tile.
    var CONTACT_LABELS = ['none', 'spotlight', 'cursor', 'readout', 'reveal', 'below', 'scrim', 'film', 'polaroid', 'stamp'];

    var data = null;
    var state = null;
    var hosts = {};

    function readStored(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function writeStored(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* private mode etc. */ }
    }

    function pick(value, allowed, fallback) {
        return allowed.indexOf(value) !== -1 ? value : fallback;
    }

    function readState() {
        var q = new URLSearchParams(location.search);
        var views = ['featured', 'list', 'grid'];
        var s = {
            view: {},
            variant: {},
            density: pick(q.get('density'), ['covers', 'all'], 'covers'),
            heroes: q.get('heroes') !== '0',
            heroStyle: pick(q.get('hs'), ['row', 'card'], 'card'),
            heroBg: pick(q.get('hb'), ['tint', 'none'], 'tint'),
            employerIntro: q.get('ei') !== '0',
            contactLabels: pick(q.get('cl'), CONTACT_LABELS, 'none'),
            labelScope: pick(q.get('ls'), ['hero', 'all'], 'hero'),
            spotlight: q.get('sp') === '1',
            cardLayout: pick(q.get('cd'), ['adaptive', 'fit', 'split', 'bleed', 'caption'], 'adaptive'),
            upscale: pick(q.get('up'), ['1', '1.5', 'off'], '1'),
            // "<section>:<tile key>" while a detail card is open, so the URL reopens it.
            card: q.get('card') || null,
            sw: pick(q.get('sw'), ['s1', 's2', 's3', 's4'], 's2'),
            fx: pick(q.get('fx'), ['vt', 'flip'], 'flip'),
            motionOverride: q.get('motion') === 'reduced'
        };
        // One switcher drives both sections, so they always share a view.
        var view = pick(q.get('view') || q.get('work') || readStored('wv-view'), views, 'featured');
        SECTIONS.forEach(function (sec) {
            s.view[sec.id] = view;
            s.variant[sec.id] = {
                list: pick(q.get(sec.listParam), LIST_VARIANTS, sec.defaultList),
                grid: pick(q.get(sec.gridParam), GRID_VARIANTS, sec.defaultGrid)
            };
        });
        return s;
    }

    function writeUrl() {
        var q = new URLSearchParams();
        q.set('view', state.view.work);
        SECTIONS.forEach(function (sec) {
            q.set(sec.listParam, state.variant[sec.id].list);
            q.set(sec.gridParam, state.variant[sec.id].grid);
        });
        q.set('density', state.density);
        q.set('heroes', state.heroes ? '1' : '0');
        q.set('hs', state.heroStyle);
        q.set('hb', state.heroBg);
        q.set('ei', state.employerIntro ? '1' : '0');
        q.set('cl', state.contactLabels);
        q.set('ls', state.labelScope);
        q.set('sp', state.spotlight ? '1' : '0');
        q.set('cd', state.cardLayout);
        q.set('up', state.upscale);
        if (state.card) q.set('card', state.card);
        q.set('sw', state.sw);
        q.set('fx', state.fx);
        if (state.motionOverride) q.set('motion', 'reduced');
        history.replaceState(null, '', location.pathname + '?' + q.toString());
    }

    function isReduced() {
        return state.motionOverride || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ---- Featured: the live homepage renderer, stamped with shared keys ----

    function featuredHtml(sectionId) {
        var tmp = document.createElement('div');
        tmp.innerHTML = sectionId === 'work' ? window.renderWork(data.home.work) : window.renderProjects(data.home.projects);
        var sec = tmp.firstElementChild;
        var title = sec.querySelector('.section-title');
        if (title) title.remove();
        return sec.innerHTML;
    }

    function ownText(el) {
        return (el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.nodeValue : el.textContent).trim();
    }

    function mark(els, attr, value) {
        for (var i = 0; i < els.length; i++) els[i].setAttribute(attr, value);
    }

    function stampFeatured(stage, sectionId) {
        var items = data.items[sectionId];
        var byTitle = {};
        items.forEach(function (it) { byTitle[it.title] = it; });

        var titleSel = sectionId === 'work' ?
            '.case-study-title-link, .case-study-title' :
            '.pb-name, .project-title-link, .project-title';
        var titles = stage.querySelectorAll(titleSel);
        for (var i = 0; i < titles.length; i++) {
            var t = titles[i];
            var it = byTitle[ownText(t)];
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

    // ---- Section rendering ----

    function renderStage(sectionId) {
        var host = hosts[sectionId];
        var stage = host.stage;
        var view = state.view[sectionId];
        var items = data.items[sectionId];
        var reduced = isReduced();

        window.WorkViewsMedia.unobserveVideos(stage);
        stage.className = 'wv-stage wv-stage--' + view + (view === 'grid' ? ' wv-stage--wide' : '');
        stage.setAttribute('data-variant', view === 'featured' ? '' : state.variant[sectionId][view]);

        if (view === 'featured') {
            stage.innerHTML = featuredHtml(sectionId);
            stampFeatured(stage, sectionId);
            host.tiles = null;
        } else if (view === 'list') {
            stage.innerHTML = window.WorkViewsList.render(items, sectionId, state.variant[sectionId].list, { heroes: state.heroes, heroStyle: state.heroStyle, employerIntro: state.employerIntro, reduced: reduced });
            window.WorkViewsList.attach(stage);
            host.tiles = listTiles(stage, items);
        } else {
            host.tiles = window.WorkViewsGrid.buildTiles(items, state.density, state.heroes);
            stage.innerHTML = window.WorkViewsGrid.render(host.tiles, state.variant[sectionId].grid, { reduced: reduced });
            window.WorkViewsGrid.attach(stage, function () { return shared.readout; });
        }
        window.WorkViewsMedia.observeVideos(stage);
    }

    // List rows open the detail card too. Tiles follow the rows' on-screen order, so
    // ←/→ in the card walk the list as you see it. Expandable rows (D) already open in
    // place, so they're left alone.
    function listTiles(stage, items) {
        var byId = {};
        items.forEach(function (it) { byId[it.id] = it; });
        var tiles = [];
        var rows = stage.querySelectorAll('[data-wv-item]');
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var it = byId[row.getAttribute('data-wv-item')];
            if (!it || row.tagName === 'DETAILS') continue;
            row.setAttribute('data-wv-tile', tiles.length);
            row.setAttribute('aria-haspopup', 'dialog');
            if (row.tagName !== 'A') {
                row.setAttribute('role', 'button');
                row.setAttribute('tabindex', '0');
            }
            tiles.push({ item: it, media: it.media[0], isCover: true, key: it.id, hero: false });
        }
        return tiles.length ? tiles : null;
    }

    // The section the reader is looking at - whichever fills most of the screen. It's held
    // still while both swap. (Neither on screen: no anchor, nothing to hold.)
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

    // Swap one or more sections as a single transition.
    function transition(sectionIds, opts) {
        if (!sectionIds.length) return;
        window.WorkViewsMotion.swap({
            targets: sectionIds.map(function (id) {
                return { stage: hosts[id].stage, render: function () { renderStage(id); } };
            }),
            anchor: anchorSection(),
            fx: state.fx,
            reduced: isReduced(),
            instant: opts && opts.instant
        });
    }

    function allSectionIds() {
        return SECTIONS.map(function (sec) { return sec.id; });
    }

    function setViewState(view) {
        SECTIONS.forEach(function (sec) { state.view[sec.id] = view; });
        writeStored('wv-view', view);
        window.WorkViewsSwitcher.setActive(shared.switcher, view, SWITCHER_LABEL);
    }

    function setView(view) {
        if (state.view.work === view) return;
        setViewState(view);
        writeUrl();
        transition(allSectionIds());
    }

    // One switcher for both sections. It lives in a sticky dock at the top of the
    // sections wrapper, so it follows you from Work down through Projects.
    var shared = { dock: null, switcher: null, readout: null };
    var SWITCHER_LABEL = 'Work and projects';

    function mountSwitcher() {
        // The readout (contact-sheet label mode) rides in the dock beside the switcher.
        shared.dock.innerHTML = '<span class="wv-readout" aria-hidden="true"></span>' +
            window.WorkViewsSwitcher.render(SWITCHER_LABEL, state.view.work, state.sw);
        shared.readout = shared.dock.firstElementChild;
        shared.switcher = shared.dock.lastElementChild;
        window.WorkViewsSwitcher.bind(shared.switcher, function () { return state.view.work; }, setView);
    }

    function openCard(sectionId, index) {
        window.WorkViewsCard.open({
            tiles: hosts[sectionId].tiles,
            index: index,
            stage: hosts[sectionId].stage,
            reduced: isReduced(),
            layout: state.cardLayout,
            upscale: state.upscale === 'off' ? 0 : Number(state.upscale),
            onChange: function (tile) {
                state.card = tile ? sectionId + ':' + tile.key : null;
                writeUrl();
            }
        });
    }

    // Reopen the card named in the URL. Matches the exact tile first, then the item's cover
    // (e.g. the link came from "Everything" density and this view only has covers).
    function restoreCard() {
        if (!state.card) return;
        var sep = state.card.indexOf(':');
        var sectionId = state.card.slice(0, sep);
        var key = state.card.slice(sep + 1);
        var host = hosts[sectionId];
        if (!host || !host.tiles) { state.card = null; writeUrl(); return; }
        var itemId = key.split('~')[0];
        var index = -1;
        host.tiles.forEach(function (t, i) { if (index === -1 && t.key === key) index = i; });
        if (index === -1) host.tiles.forEach(function (t, i) { if (index === -1 && t.item.id === itemId) index = i; });
        if (index === -1) { state.card = null; writeUrl(); return; }
        var el = host.stage.querySelector('[data-wv-tile="' + index + '"]');
        if (el) el.scrollIntoView({ block: 'center' });
        openCard(sectionId, index);
    }

    function buildSection(sec) {
        var section = document.getElementById(sec.id);
        section.innerHTML =
            '<div class="wv-section-head"><h2 class="section-title">' + sec.label + '</h2></div>' +
            '<div class="wv-stage"></div>';
        hosts[sec.id] = {
            label: sec.label,
            section: section,
            stage: section.querySelector('.wv-stage'),
            tiles: null
        };

        var stageEl = hosts[sec.id].stage;
        stageEl.addEventListener('click', function (e) {
            var tile = e.target.closest && e.target.closest('[data-wv-tile]');
            if (!tile || !hosts[sec.id].tiles) return;
            // A link inside a card's description etc. keeps working.
            var innerLink = e.target.closest('a');
            if (innerLink && innerLink !== tile) return;
            if (tile.tagName === 'A') {
                // Cmd/Ctrl/Shift-click and middle-click still follow the link as usual.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
            }
            openCard(sec.id, Number(tile.dataset.wvTile));
        });
        // Rows without a link are role=button divs; give them the keyboard behaviour of one.
        stageEl.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var row = e.target.closest && e.target.closest('[data-wv-tile][role="button"]');
            if (!row || row !== e.target) return;
            e.preventDefault();
            row.click();
        });
    }

    // Called by the picker. `animate` re-renders affected sections through the transition engine.
    function update(patch) {
        var prevSw = state.sw;
        var viewChanged = false;
        Object.keys(patch).forEach(function (k) {
            if (k === 'variant') {
                var v = patch.variant;
                state.variant[v.section][v.view] = v.value;
                // Picking a layout jumps both sections into that view so the change is visible.
                if (state.view[v.section] !== v.view) {
                    setViewState(v.view);
                    viewChanged = true;
                }
            } else {
                state[k] = patch[k];
            }
        });
        applyRootClasses();
        writeUrl();
        if ('cardLayout' in patch || 'upscale' in patch) {
            window.WorkViewsCard.refresh({
                layout: state.cardLayout,
                upscale: state.upscale === 'off' ? 0 : Number(state.upscale)
            });
        }
        if (state.sw !== prevSw) {
            mountSwitcher();
            return;
        }
        var touched = allSectionIds().filter(function (id) {
            var view = state.view[id];
            if (viewChanged) return true;
            if (patch.variant) return patch.variant.section === id && patch.variant.view === view;
            return (('density' in patch || 'heroes' in patch) && view !== 'featured') ||
                (('heroStyle' in patch || 'employerIntro' in patch) && view === 'list') ||
                ('motionOverride' in patch);
        });
        transition(touched);
    }

    // Pure styling switches live on <html>, so flipping them needs no re-render.
    function applyRootClasses() {
        document.documentElement.classList.toggle('wv-reduced', isReduced());
        document.documentElement.classList.toggle('wv-icard-plain', state.heroBg === 'none');
        var root = document.documentElement;
        CONTACT_LABELS.forEach(function (m) { root.classList.toggle('wv-cl-' + m, state.contactLabels === m); });
        root.classList.toggle('wv-cl-scope-hero', state.labelScope === 'hero');
        root.classList.toggle('wv-spot', state.spotlight);
    }

    function init() {
        state = readState();
        applyRootClasses();
        window.loadWorkViewsData().then(function (d) {
            data = d;
            shared.dock = document.querySelector('.wv-sections > .wv-dock');
            mountSwitcher();
            SECTIONS.forEach(function (sec) {
                buildSection(sec);
                renderStage(sec.id);
            });
            writeUrl();
            restoreCard();
            if (window.initWorkViewsPicker) {
                window.initWorkViewsPicker({ state: state, sections: SECTIONS, update: update, weakAlt: d.weakAlt });
            }
            document.getElementById('wv-root').removeAttribute('aria-busy');
        }).catch(function (err) {
            console.error(err);
            document.getElementById('wv-root').innerHTML = '<p class="page-status page-status--error" role="alert">Could not load the data files.</p>';
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
