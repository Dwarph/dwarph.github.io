// Work views prototype: dev-only control panel for flipping between variants.
// Not part of the design under test - it just drives the URL state in work-views-app.js.

(function () {
    var LIST_NAMES = {
        b: 'B · Index',
        e: 'E · Index by employer',
        f: 'F · Index + brand line',
        a: 'A · Ledger',
        c: 'C · By employer',
        d: 'D · Expandable'
    };
    var GRID_NAMES = { a: 'A · Gallery stagger', b: 'B · Masonry wall', c: 'C · Bento rhythm', d: 'D · Contact sheet' };

    function select(name, options, value) {
        var html = '<select name="' + name + '">';
        Object.keys(options).forEach(function (k) {
            html += '<option value="' + k + '"' + (k === value ? ' selected' : '') + '>' + options[k] + '</option>';
        });
        return html + '</select>';
    }

    function radios(name, options, value) {
        var html = '<span class="wv-pk-seg" role="radiogroup">';
        Object.keys(options).forEach(function (k) {
            html += '<label><input type="radio" name="' + name + '" value="' + k + '"' + (k === value ? ' checked' : '') + ' /><span>' + options[k] + '</span></label>';
        });
        return html + '</span>';
    }

    window.initWorkViewsPicker = function (o) {
        var s = o.state;
        var panel = document.createElement('details');
        panel.className = 'wv-picker';
        // Start collapsed on narrow screens, where the panel would cover the content.
        var collapsed = window.innerWidth < 700;
        try {
            var stored = localStorage.getItem('wv-picker-collapsed');
            if (stored !== null) collapsed = stored === '1';
        } catch (e) { /* ignore */ }
        if (!collapsed) panel.open = true;

        var rows = '';
        o.sections.forEach(function (sec) {
            rows += '<fieldset><legend>' + sec.label + '</legend>' +
                '<label class="wv-pk-row"><span>List</span>' + select(sec.id + ':list', LIST_NAMES, s.variant[sec.id].list) + '</label>' +
                '<label class="wv-pk-row"><span>Grid</span>' + select(sec.id + ':grid', GRID_NAMES, s.variant[sec.id].grid) + '</label>' +
                '</fieldset>';
        });

        panel.innerHTML =
            '<summary>Prototype controls</summary>' +
            '<form class="wv-pk-body">' + rows +
            '<fieldset><legend>Contact labels · off the image</legend>' + radios('cl', { none: 'None', spotlight: 'Spotlight', cursor: 'Cursor', readout: 'Readout', reveal: 'Reveal' }, s.contactLabels) + '</fieldset>' +
            '<fieldset><legend>Contact labels · on the tile</legend>' + radios('cl', { below: 'Below', scrim: 'Scrim', film: 'Film', polaroid: 'Polaroid', stamp: 'Stamp' }, s.contactLabels) + '</fieldset>' +
            '<fieldset><legend>On-tile label scope</legend>' + radios('ls', { hero: 'Heroes + hover', all: 'All tiles' }, s.labelScope) +
            '<label class="wv-pk-check"><input type="checkbox" name="sp"' + (s.spotlight ? ' checked' : '') + ' /> Add spotlight on hover</label></fieldset>' +
            '<fieldset><legend>Detail card</legend>' + radios('cd', { adaptive: 'Adaptive', fit: 'Fit', split: 'Split', bleed: 'Bleed', caption: 'Caption' }, s.cardLayout) + '</fieldset>' +
            '<fieldset><legend>Max media size in card</legend>' + radios('up', { '1': 'Native 1×', '1.5': '1.5×', off: 'Off' }, s.upscale) + '</fieldset>' +
            '<fieldset><legend>Grid density</legend>' + radios('density', { covers: 'Covers', all: 'Everything' }, s.density) + '</fieldset>' +
            '<fieldset><legend>Hero items</legend>' + radios('heroes', { on: 'On', off: 'Off' }, s.heroes ? 'on' : 'off') + '</fieldset>' +
            '<fieldset><legend>Index heroes</legend>' + radios('hs', { card: 'Card', row: 'Row' }, s.heroStyle) + '</fieldset>' +
            '<fieldset><legend>Hero card background</legend>' + radios('hb', { tint: 'Tint', none: 'None' }, s.heroBg) + '</fieldset>' +
            '<fieldset><legend>Employer intro (list F)</legend>' + radios('ei', { on: 'On', off: 'Off' }, s.employerIntro ? 'on' : 'off') + '</fieldset>' +
            '<fieldset><legend>Switcher</legend>' + radios('sw', { s2: 'Icons', s4: 'Dropdown', s3: 'Cycle', s1: 'Pill' }, s.sw) + '</fieldset>' +
            '<fieldset><legend>Transition</legend>' + radios('fx', { flip: 'FLIP', vt: 'View Transitions' }, s.fx) +
            '<label class="wv-pk-check"><input type="checkbox" name="motion"' + (s.motionOverride ? ' checked' : '') + ' /> Simulate reduced motion</label></fieldset>' +
            '<div class="wv-pk-copy"><button type="button" class="wv-pk-copy-btn">Copy settings</button><span class="wv-pk-copy-status" role="status"></span></div>' +
            (o.weakAlt && o.weakAlt.length ? '<p class="wv-pk-note">' + o.weakAlt.length + ' media have placeholder alt text. The list is in the console.</p>' : '') +
            '</form>';
        document.body.appendChild(panel);

        // A modal card puts the page under an inert backdrop, so while one is open the
        // panel moves into the dialog (top layer) and stays usable for comparing layouts.
        document.addEventListener('wv:card-open', function (e) { e.detail.dialog.appendChild(panel); });
        // A card reopened from the URL opens before this panel exists.
        var openCard = document.querySelector('dialog.wv-card[open]');
        if (openCard) openCard.appendChild(panel);
        document.addEventListener('wv:card-close', function () { document.body.appendChild(panel); });

        panel.addEventListener('toggle', function () {
            try { localStorage.setItem('wv-picker-collapsed', panel.open ? '0' : '1'); } catch (e) { /* ignore */ }
        });

        // A readable summary of the current choices plus the shareable URL, for pasting into chat.
        function summary() {
            var sw = { s1: 'Pill', s2: 'Icons', s3: 'Cycle', s4: 'Dropdown' };
            var cl = { none: 'None', spotlight: 'Spotlight', cursor: 'Cursor', readout: 'Readout', reveal: 'Reveal',
                below: 'Below', scrim: 'Scrim', film: 'Film', polaroid: 'Polaroid', stamp: 'Stamp' };
            var lines = ['Work views prototype settings:'];
            o.sections.forEach(function (sec) {
                lines.push('- ' + sec.label + ': showing ' + s.view[sec.id] +
                    ' · list ' + LIST_NAMES[s.variant[sec.id].list] + ' · grid ' + GRID_NAMES[s.variant[sec.id].grid]);
            });
            lines.push('- Grid density: ' + (s.density === 'all' ? 'Everything' : 'Covers'));
            lines.push('- Hero items: ' + (s.heroes ? 'on' : 'off') + ' · index heroes: ' + s.heroStyle + ' · card background: ' + s.heroBg +
                ' · employer intro: ' + (s.employerIntro ? 'on' : 'off'));
            lines.push('- Contact labels: ' + cl[s.contactLabels] + ' · scope: ' + (s.labelScope === 'hero' ? 'Heroes + hover' : 'All tiles') +
                ' · spotlight: ' + (s.spotlight ? 'on' : 'off'));
            lines.push('- Detail card: ' + s.cardLayout + ' · max media size: ' + (s.upscale === 'off' ? 'off' : s.upscale + '×'));
            lines.push('- Switcher: ' + sw[s.sw] + ' · transition: ' + (s.fx === 'flip' ? 'FLIP' : 'View Transitions') +
                (s.motionOverride ? ' · reduced motion simulated' : ''));
            lines.push(location.href);
            return lines.join('\n');
        }

        function copyText(text) {
            if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
            // Fallback for non-secure contexts: a hidden textarea and execCommand.
            return new Promise(function (resolve, reject) {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                var ok = false;
                try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
                ta.remove();
                if (ok) resolve(); else reject(new Error('copy failed'));
            });
        }

        var statusEl = panel.querySelector('.wv-pk-copy-status');
        panel.querySelector('.wv-pk-copy-btn').addEventListener('click', function () {
            var text = summary();
            copyText(text).then(function () {
                statusEl.textContent = 'Copied';
            }, function () {
                statusEl.textContent = 'Copy blocked. The text is in the console.';
                console.log(text);
            });
            setTimeout(function () { statusEl.textContent = ''; }, 2500);
        });

        panel.addEventListener('change', function (e) {
            var t = e.target;
            if (t.tagName === 'SELECT') {
                var parts = t.name.split(':');
                o.update({ variant: { section: parts[0], view: parts[1], value: t.value } });
            } else if (t.name === 'density') {
                o.update({ density: t.value });
            } else if (t.name === 'heroes') {
                o.update({ heroes: t.value === 'on' });
            } else if (t.name === 'up') {
                o.update({ upscale: t.value });
            } else if (t.name === 'cd') {
                o.update({ cardLayout: t.value });
            } else if (t.name === 'sp') {
                o.update({ spotlight: t.checked });
            } else if (t.name === 'ls') {
                o.update({ labelScope: t.value });
            } else if (t.name === 'cl') {
                o.update({ contactLabels: t.value });
            } else if (t.name === 'ei') {
                o.update({ employerIntro: t.value === 'on' });
            } else if (t.name === 'hb') {
                o.update({ heroBg: t.value });
            } else if (t.name === 'hs') {
                o.update({ heroStyle: t.value });
            } else if (t.name === 'sw') {
                o.update({ sw: t.value });
            } else if (t.name === 'fx') {
                o.update({ fx: t.value });
            } else if (t.name === 'motion') {
                o.update({ motionOverride: t.checked });
            }
        });
    };
})();
