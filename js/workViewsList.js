// Work + Projects views: the List view - a typographic index grouped by year.
// Work runs a brand line down the rows (FitXR blue, Ultraleap green), with an employer
// intro where each employer's line begins, following the Featured timeline. Projects is
// the same index without the line. Heroes become compact cards inside the index.
// Rows carry data-wv-item, and their thumb/title carry data-wv-key, so the transition
// engine can fly them to and from Featured and Grid.

(function () {
    var U = window.WorkViewsUtil;
    var M = window.WorkViewsMedia;
    var esc = U.escapeHtml;

    function iconHtml(item) {
        var name = !item.href ? (item.comingSoon ? 'lock' : '') : (item.external ? 'north_east' : 'chevron_right');
        return name ? '<span class="material-icons wv-icon" aria-hidden="true">' + name + '</span>' : '';
    }

    // Whole-row link when the item has somewhere to go; a plain block otherwise.
    // (workViews.js turns a plain click into "open the detail card".)
    function rowOpen(item, cls, extraAttrs) {
        var soon = item.comingSoon ? ' is-soon' : '';
        var attrs = ' data-wv-item="' + esc(item.id) + '"' + (extraAttrs || '');
        if (item.href) {
            var target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return '<a class="' + cls + soon + '" href="' + esc(item.href) + '"' + target + attrs + '>';
        }
        return '<div class="' + cls + soon + '"' + attrs + '>';
    }

    function rowClose(item) {
        return item.href ? '</a>' : '</div>';
    }

    // `after` (the link arrow) goes inside the title, in a no-wrap span with the last word,
    // so a wrapped title takes the word and arrow to the next line together rather than
    // leaving the arrow alone. (A word joiner isn't enough: browsers may still break before
    // the inline-block icon.)
    function titleHtml(item, cls, after) {
        var text = esc(item.title);
        if (after) {
            var cut = item.title.lastIndexOf(' ');
            var head = cut === -1 ? '' : esc(item.title.slice(0, cut + 1));
            var last = esc(item.title.slice(cut + 1));
            text = head + '<span class="wv-nowrap">' + last + after + '</span>';
        }
        return '<span class="' + cls + '" data-wv-key="' + esc(item.id + '|title') + '">' + text + '</span>';
    }

    // List rows can't hold links, so the short line is plain text.
    function shortLine(item) {
        return esc(item.short || U.plainText(item.lead));
    }

    function brandOf(item) {
        return item.gradient || 'personal';
    }

    // A hero, as a compact card strip inside the index: thumb, title, short line, CTA.
    // Uses the project's own brand colour when it has one (Set Sail).
    function heroCardHtml(item, opts) {
        var style = item.brand ? ' style="--card-bg:' + esc(item.brand) + ';--card-ink:' + esc(item.ink || '#FFFDEF') + '"' : '';
        var cta = item.href ? '<span class="wv-icard-cta" data-wv-fade>' + esc(item.ctaLabel) + iconHtml(item) + '</span>' :
            (item.comingSoon ? '<span class="wv-icard-cta is-soon" data-wv-fade>Coming soon</span>' : '');
        var liCls = 'wv-icard-li' + (opts.brandLine ? ' wv-index-li wv-brand--' + brandOf(item) : '');
        return '<li class="' + liCls + '">' + rowOpen(item, 'wv-icard' + (item.brand ? ' wv-icard--brand' : ''), style) +
            // Archive heroes launch from the Interaction Archive card when coming from Featured.
            '<span class="wv-icard-media" data-wv-key="' + esc(item.id + '|media') + '"' +
            (item.kind === 'archive' ? ' data-wv-from="w-interaction-archive|media"' : '') + '>' +
            M.mediaHtml(item.media[0], { reduced: opts.reduced, thumb: true }) + '</span>' +
            '<span class="wv-icard-body">' +
            '<span class="wv-icard-meta" data-wv-fade>' + esc([item.yearLabel, item.category].filter(Boolean).join(' · ')) + '</span>' +
            titleHtml(item, 'wv-icard-title') +
            '<span class="wv-icard-lead" data-wv-fade>' + shortLine(item) + '</span>' +
            '</span>' + cta + rowClose(item) + '</li>';
    }

    function rowHtml(item, opts) {
        if (item.hero) return heroCardHtml(item, opts);
        var still = M.stillSrc(item.media[0]);
        var brandCls = opts.brandLine ? ' wv-brand--' + brandOf(item) : '';
        // Projects show their tags. Work has no middle column: the brand line and employer
        // intro already say whose work each row is.
        var meta = opts.brandLine ? '' : '<span class="wv-index-meta" data-wv-fade>' + esc(item.category) + '</span>';
        return '<li class="wv-index-li' + brandCls + '">' +
            rowOpen(item, 'wv-index-row', still ? ' data-wv-peek="' + esc(still) + '"' : '') +
            '<span class="wv-index-title">' + titleHtml(item, 'wv-index-name', iconHtml(item)) + '</span>' +
            meta +
            '<span class="wv-index-type" data-wv-fade>' + esc(item.typeLabel) + '</span>' +
            rowClose(item) + '</li>';
    }

    // A compact take on Featured's job intro, set where that employer's line begins.
    function employerIntroHtml(emp) {
        // data-wv-anchor matches the Featured job block's id (#work-fitxr), so the bio's
        // employer links can land here while List is showing.
        var anchor = emp.gradient ? ' data-wv-anchor="work-' + esc(emp.gradient) + '"' : '';
        return '<li class="wv-index-li wv-eintro-li wv-brand--' + (emp.gradient || 'personal') + '"' + anchor + '>' +
            '<div class="wv-eintro">' +
            (emp.logo ? '<img class="wv-eintro-logo" src="' + esc(emp.logo) + '" alt="" width="48" height="48" />' : '') +
            '<div class="wv-eintro-text">' +
            '<h3 class="wv-eintro-name"><span class="' + (emp.gradient ? 'gradient-' + emp.gradient : '') + '">' + esc(emp.company) + '</span></h3>' +
            '<p class="wv-eintro-meta">' + esc(emp.role) + ' · ' + esc(emp.dates) + '</p>' +
            (emp.description ? '<p class="wv-eintro-desc">' + esc(emp.description) + '</p>' : '') +
            '</div></div></li>';
    }

    // opts: { brandLine, reduced } - Work passes brandLine (and gets employer intros).
    function render(items, opts) {
        opts = opts || {};
        var sorted = items.slice().sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
        var html = '<div class="wv-list' + (opts.brandLine ? ' wv-list--brand' : '') + '">';
        var current = null;
        var introduced = {};
        var perYear = {};
        sorted.forEach(function (x) {
            var y = x.year ? String(x.year) : x.yearLabel;
            perYear[y] = (perYear[y] || 0) + 1;
        });
        for (var i = 0; i < sorted.length; i++) {
            var it = sorted[i];
            var label = it.year ? String(it.year) : it.yearLabel;
            if (label !== current) {
                if (current !== null) html += '</ul></div>';
                current = label;
                // Short years (one or two items) don't pin their label: it would only slide a
                // row or so as you scroll, which reads as the label drifting.
                html += '<div class="wv-index-group' + (perYear[label] <= 2 ? ' wv-index-group--short' : '') + '">' +
                    '<h3 class="wv-index-year">' + esc(label) + '</h3><ul class="wv-index-rows" role="list">';
            }
            // Within a year rows keep data order, so each employer's run is unbroken and
            // gets exactly one intro, at the top of its run.
            if (opts.brandLine && it.employer && !introduced[it.employer.company]) {
                introduced[it.employer.company] = true;
                html += employerIntroHtml(it.employer);
            }
            html += rowHtml(it, opts);
        }
        if (current !== null) html += '</ul></div>';
        return html + '</div>';
    }

    // A single floating preview that follows the cursor over plain rows (fine pointers only).
    var peek = null;
    function attach(stage) {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        // The stage outlives each render; bind once and let data-wv-peek decide per row.
        if (stage.dataset.wvPeekBound) return;
        stage.dataset.wvPeekBound = '1';
        stage.addEventListener('pointermove', function (e) {
            var row = e.target.closest && e.target.closest('[data-wv-peek]');
            if (!row || !stage.contains(row)) {
                if (peek) peek.classList.remove('is-on');
                return;
            }
            if (!peek) {
                peek = document.createElement('div');
                peek.className = 'wv-peek';
                peek.setAttribute('aria-hidden', 'true');
                peek.innerHTML = '<img alt="" />';
                document.body.appendChild(peek);
            }
            var img = peek.firstChild;
            if (img.getAttribute('src') !== row.dataset.wvPeek) img.src = row.dataset.wvPeek;
            peek.style.transform = 'translate(' + (e.clientX + 24) + 'px,' + (e.clientY - 60) + 'px)';
            peek.classList.add('is-on');
        });
        stage.addEventListener('pointerleave', function () { if (peek) peek.classList.remove('is-on'); });
        stage.addEventListener('click', function () { if (peek) peek.classList.remove('is-on'); });
    }

    window.WorkViewsList = { render: render, attach: attach };
})();
