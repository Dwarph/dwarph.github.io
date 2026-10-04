// Work views prototype: the four List layouts.
// Every row carries data-wv-item, and its thumb/title carry data-wv-key, so the
// transition engine can fly them to and from the Featured and Grid views.

(function () {
    var esc = function (s) { return window.WorkViewsUtil.escapeHtml(s); };
    // Rows are links, so leads render as plain text (data descriptions may hold <a>/<br>).
    var lead = function (s) { return esc(window.WorkViewsUtil.plainText(s)); };
    var M = window.WorkViewsMedia;

    function icon(item) {
        if (!item.href) return item.comingSoon ? 'lock' : '';
        return item.external ? 'north_east' : 'chevron_right';
    }

    function iconHtml(item) {
        var name = icon(item);
        return name ? '<span class="material-icons wv-icon" aria-hidden="true">' + name + '</span>' : '';
    }

    // Whole-row link when the item has somewhere to go; a plain block otherwise.
    function rowOpen(item, cls) {
        var heroCls = item._hero ? ' is-hero' : '';
        var soonCls = item.comingSoon ? ' is-soon' : '';
        if (item.href) {
            var target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return '<a class="' + cls + heroCls + soonCls + '" href="' + esc(item.href) + '"' + target +
                ' data-wv-item="' + esc(item.id) + '">';
        }
        return '<div class="' + cls + heroCls + soonCls + '" data-wv-item="' + esc(item.id) + '">';
    }

    function rowClose(item) {
        return item.href ? '</a>' : '</div>';
    }

    function thumbHtml(item, cls) {
        var still = M.stillSrc(item.media[0]);
        var key = item.id + '|media';
        if (!still) return '<span class="' + cls + ' wv-thumb--empty" data-wv-key="' + esc(key) + '"></span>';
        return '<span class="' + cls + '"><img src="' + esc(still) + '" alt="" loading="lazy" decoding="async" data-wv-key="' + esc(key) + '" /></span>';
    }

    // `after` (e.g. the link arrow) goes inside the title, glued to the last word with a
    // word joiner, so a wrapped title never leaves the arrow alone on its own line.
    function titleHtml(item, cls, after) {
        return '<span class="' + cls + '" data-wv-key="' + esc(item.id + '|title') + '">' + esc(item.title) +
            (after ? '\u2060' + after : '') + '</span>';
    }

    function withHero(items, heroes) {
        return items.map(function (it) {
            var copy = Object.assign({}, it);
            copy._hero = heroes && it.hero;
            return copy;
        });
    }

    // A: Ledger - closest to the reference screenshot.
    function renderLedger(items) {
        var html = '<ul class="wv-list wv-list--a" role="list">';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            html += '<li>' + rowOpen(it, 'wv-row') +
                thumbHtml(it, 'wv-row-thumb') +
                '<span class="wv-row-main">' + titleHtml(it, 'wv-row-title') +
                (it._hero && it.lead ? '<span class="wv-row-lead" data-wv-fade>' + lead(it.lead) + '</span>' : '') +
                '</span>' +
                '<span class="wv-row-cat" data-wv-fade>' + esc(it.category || it.typeLabel) + '</span>' +
                '<span class="wv-row-cta" data-wv-fade><span class="wv-row-cta-text">' + esc(it.ctaLabel) + '</span>' + iconHtml(it) + '</span>' +
                rowClose(it) + '</li>';
        }
        return html + '</ul>';
    }

    // Employer identity for the brand line. Personal work gets Pip pink.
    function brandOf(it) {
        return it.gradient || 'personal';
    }

    function brandName(it) {
        return it.company === 'Personal' ? 'Personal' : it.company;
    }

    // The index's hero, as a compact card strip: thumb, title, one-line lead, CTA. Uses the project's own
    // brand colour when it has one (Set Sail), cream otherwise.
    function indexCardHtml(it, opts) {
        var style = it.brand ? ' style="--card-bg:' + esc(it.brand) + ';--card-ink:' + esc(it.ink || '#FFFDEF') + '"' : '';
        var cta = it.href ? '<span class="wv-icard-cta" data-wv-fade>' + esc(it.ctaLabel) + iconHtml(it) + '</span>' :
            (it.comingSoon ? '<span class="wv-icard-cta is-soon" data-wv-fade>Coming soon</span>' : '');
        // On the brand-line index the card keeps its segment, so the line runs unbroken past it.
        var liCls = 'wv-icard-li' + (opts.brandLine ? ' wv-index-li wv-brand--' + brandOf(it) : '');
        return '<li class="' + liCls + '">' + rowOpen(it, 'wv-icard' + (it.brand ? ' wv-icard--brand' : '')).replace('>', style + '>') +
            '<span class="wv-icard-media">' + M.mediaHtml(it.media[0], { key: it.id + '|media', reduced: opts.reduced }) + '</span>' +
            '<span class="wv-icard-body">' +
            '<span class="wv-icard-meta" data-wv-fade>' + esc([it.yearLabel, it.category].filter(Boolean).join(' · ')) + '</span>' +
            titleHtml(it, 'wv-icard-title') +
            '<span class="wv-icard-lead" data-wv-fade>' + lead(it.lead) + '</span>' +
            '</span>' + cta + rowClose(it) + '</li>';
    }

    function indexRowHtml(it, metaText, opts) {
        if (it._hero && opts.heroStyle === 'card') return indexCardHtml(it, opts);
        var still = M.stillSrc(it.media[0]);
        var brandCls = opts.brandLine ? ' wv-brand--' + brandOf(it) : '';
        return '<li class="wv-index-li' + brandCls + '">' +
            rowOpen(it, 'wv-index-row').replace('>', (still ? ' data-wv-peek="' + esc(still) + '"' : '') + '>') +
            '<span class="wv-index-title">' + titleHtml(it, 'wv-index-name', iconHtml(it)) +
            (it._hero && it.lead ? '<span class="wv-index-lead" data-wv-fade>' + lead(it.lead) + '</span>' : '') + '</span>' +
            '<span class="wv-index-meta" data-wv-fade>' + esc(metaText) + '</span>' +
            '<span class="wv-index-type" data-wv-fade>' + esc(opts.lastCol === 'year' ? it.yearLabel : it.typeLabel) + '</span>' +
            rowClose(it) + '</li>';
    }

    // F's employer intro: a compact take on Featured's job intro, set where that
    // employer's brand line begins. It carries the line itself, so the line starts here.
    function employerIntroHtml(emp) {
        var brand = emp.gradient || 'personal';
        return '<li class="wv-index-li wv-eintro-li wv-brand--' + brand + '">' +
            '<div class="wv-eintro">' +
            (emp.logo ? '<img class="wv-eintro-logo" src="' + esc(emp.logo) + '" alt="" width="48" height="48" />' : '') +
            '<div class="wv-eintro-text">' +
            '<h3 class="wv-eintro-name"><span class="' + (emp.gradient ? 'gradient-' + emp.gradient : '') + '">' + esc(emp.company) + '</span></h3>' +
            '<p class="wv-eintro-meta">' + esc(emp.role) + ' · ' + esc(emp.dates) + '</p>' +
            (emp.description ? '<p class="wv-eintro-desc">' + esc(emp.description) + '</p>' : '') +
            '</div></div></li>';
    }

    function byYearDesc(items) {
        return items.slice().sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
    }

    // B: Index - a typographic table grouped by year, with a cursor-following preview.
    // F is the same table with a continuous brand line down the rows, changing colour
    // wherever the employer changes.
    function renderIndex(items, section, opts) {
        var sorted = byYearDesc(items);
        var html = '<div class="wv-list wv-list--b' + (opts.brandLine ? ' wv-list--f' : '') + '">';
        var current = null;
        var introduced = {};
        for (var i = 0; i < sorted.length; i++) {
            var it = sorted[i];
            var label = it.year ? String(it.year) : it.yearLabel;
            if (label !== current) {
                if (current !== null) html += '</ul></div>';
                current = label;
                html += '<div class="wv-index-group"><h3 class="wv-index-year">' + esc(label) + '</h3><ul class="wv-index-rows" role="list">';
            }
            // Within a year, rows keep data order, so each employer's run is unbroken and
            // gets exactly one intro, at the top of its run.
            if (opts.brandLine && opts.employerIntro && it.employer && !introduced[it.employer.company]) {
                introduced[it.employer.company] = true;
                html += employerIntroHtml(it.employer);
            }
            // Work rows name the employer only; personal projects (no employer) show their tags.
            var meta = it.company === 'Personal' ? it.category : it.company;
            html += indexRowHtml(it, meta, opts);
        }
        if (current !== null) html += '</ul></div>';
        return html + '</div>';
    }

    // E: Index by employer - the index table, grouped under each employer with its
    // gradient brand line running the length of the group (the feel of C).
    function renderIndexByEmployer(items, section, opts) {
        var groups = [];
        var byName = {};
        for (var i = 0; i < items.length; i++) {
            var name = brandName(items[i]);
            if (!byName[name]) {
                byName[name] = { name: name, brand: brandOf(items[i]), items: [] };
                groups.push(byName[name]);
            }
            byName[name].items.push(items[i]);
        }
        var html = '<div class="wv-list wv-list--b wv-list--e">';
        for (var g = 0; g < groups.length; g++) {
            var grp = groups[g];
            var rows = byYearDesc(grp.items);
            html += '<div class="wv-eidx-group wv-brand--' + grp.brand + '">' +
                '<div class="wv-emp-head"><h3 class="wv-emp-name">' + esc(grp.name) + '</h3>' +
                '<span class="wv-emp-count">' + rows.length + '</span></div><ul class="wv-index-rows" role="list">';
            for (var r = 0; r < rows.length; r++) {
                // Grouping already says who; the last column carries the year instead of the type.
                html += indexRowHtml(rows[r], rows[r].category, Object.assign({}, opts, { lastCol: 'year' }));
            }
            html += '</ul></div>';
        }
        return html + '</div>';
    }

    // C: By employer - grouped with the employer gradient as a rail; heroes lead each group.
    function renderByEmployer(items, section) {
        var groups = [];
        var byName = {};
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var name = section === 'projects' ? (it.tier === 'major' ? 'Products' : 'Experiments') : it.company;
            if (!byName[name]) {
                byName[name] = { name: name, gradient: it.gradient, items: [] };
                groups.push(byName[name]);
            }
            byName[name].items.push(it);
        }
        var html = '<div class="wv-list wv-list--c">';
        for (var g = 0; g < groups.length; g++) {
            var grp = groups[g];
            var heroes = grp.items.filter(function (x) { return x._hero; });
            var rest = grp.items.filter(function (x) { return !x._hero; });
            html += '<div class="wv-emp-group' + (grp.gradient ? ' wv-emp-group--' + grp.gradient : '') + '">' +
                '<div class="wv-emp-head"><h3 class="wv-emp-name">' + esc(grp.name) + '</h3>' +
                '<span class="wv-emp-count">' + grp.items.length + '</span></div><ul class="wv-emp-rows" role="list">';
            for (var h = 0; h < heroes.length; h++) {
                var hi = heroes[h];
                html += '<li>' + rowOpen(hi, 'wv-emp-row wv-emp-row--hero') +
                    thumbHtml(hi, 'wv-emp-thumb') +
                    '<span class="wv-emp-main">' + titleHtml(hi, 'wv-emp-title') +
                    '<span class="wv-emp-lead" data-wv-fade>' + lead(hi.lead) + '</span></span>' +
                    iconHtml(hi) + rowClose(hi) + '</li>';
            }
            for (var r = 0; r < rest.length; r++) {
                var ri = rest[r];
                html += '<li>' + rowOpen(ri, 'wv-emp-row') +
                    titleHtml(ri, 'wv-emp-title') +
                    '<span class="wv-emp-meta" data-wv-fade>' + esc(ri.yearLabel) + '</span>' +
                    iconHtml(ri) + rowClose(ri) + '</li>';
            }
            html += '</ul></div>';
        }
        return html + '</div>';
    }

    // D: Expandable - one line each; heroes start open.
    function renderExpandable(items, section, opts) {
        var html = '<div class="wv-list wv-list--d">';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var link = '';
            if (it.href) {
                var target = it.external ? ' target="_blank" rel="noopener noreferrer"' : '';
                link = '<a class="wv-exp-link" href="' + esc(it.href) + '"' + target + '>' + esc(it.ctaLabel) + iconHtml(it) + '</a>';
            } else if (it.comingSoon) {
                link = '<span class="wv-exp-link is-soon">Coming soon</span>';
            }
            html += '<details class="wv-exp' + (it._hero ? ' is-hero' : '') + '" data-wv-item="' + esc(it.id) + '"' + (it._hero ? ' open' : '') + '>' +
                '<summary class="wv-exp-summary">' + titleHtml(it, 'wv-exp-title') +
                '<span class="wv-exp-meta" data-wv-fade>' + esc(it.yearLabel) + ' · ' + esc(it.typeLabel) + '</span>' +
                '<span class="material-icons wv-exp-chevron" aria-hidden="true">expand_more</span></summary>' +
                '<div class="wv-exp-body">' +
                '<span class="wv-exp-media">' + M.mediaHtml(it.media[0], { key: it.id + '|media', reduced: opts.reduced }) + '</span>' +
                '<div class="wv-exp-text"><p class="wv-exp-lead">' + window.WorkViewsUtil.richText(it.lead) + '</p>' +
                (it.category ? '<p class="wv-exp-cat">' + esc(it.category) + '</p>' : '') + link + '</div>' +
                '</div></details>';
        }
        return html + '</div>';
    }

    function renderList(items, section, variant, opts) {
        opts = opts || {};
        var list = withHero(items, opts.heroes);
        switch (variant) {
            case 'b': return renderIndex(list, section, opts);
            case 'e': return renderIndexByEmployer(list, section, opts);
            case 'f': return renderIndex(list, section, Object.assign({}, opts, { brandLine: true }));
            case 'c': return renderByEmployer(list, section, opts);
            case 'd': return renderExpandable(list, section, opts);
            default: return renderLedger(list, section, opts);
        }
    }

    // Index variant: a single floating preview that follows the cursor over rows (fine pointers only).
    var peek = null;
    function ensurePeek() {
        if (peek) return peek;
        peek = document.createElement('div');
        peek.className = 'wv-peek';
        peek.setAttribute('aria-hidden', 'true');
        peek.innerHTML = '<img alt="" />';
        document.body.appendChild(peek);
        return peek;
    }

    function attachList(stage) {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        // The stage outlives each render; bind once and let data-wv-peek decide per row.
        if (stage.dataset.wvPeekBound) return;
        stage.dataset.wvPeekBound = '1';
        var el = ensurePeek();
        var img = el.querySelector('img');
        stage.addEventListener('pointermove', function (e) {
            var row = e.target.closest && e.target.closest('[data-wv-peek]');
            if (!row || !stage.contains(row)) {
                el.classList.remove('is-on');
                return;
            }
            if (img.getAttribute('src') !== row.dataset.wvPeek) img.src = row.dataset.wvPeek;
            el.style.transform = 'translate(' + (e.clientX + 24) + 'px,' + (e.clientY - 60) + 'px)';
            el.classList.add('is-on');
        });
        stage.addEventListener('pointerleave', function () { el.classList.remove('is-on'); });
    }

    window.WorkViewsList = { render: renderList, attach: attachList };
})();
