// Work views prototype: the view switcher, in three styles to compare.
//   s1 - segmented pill with a sliding thumb
//   s2 - bare icons; active one goes pink with a dot
//   s3 - one button that cycles, its icon morphing
//   s4 - the s3 button, but it opens a small menu of all three views
// s1/s2 are a radiogroup with a roving tabindex (arrow keys move and select).
// s4 is a menu button: the menu holds menuitemradio options.

(function () {
    var VIEWS = [
        { id: 'featured', label: 'Featured', icon: 'view_agenda' },
        { id: 'list', label: 'List', icon: 'view_list' },
        { id: 'grid', label: 'Grid', icon: 'grid_view' }
    ];

    function indexOf(view) {
        for (var i = 0; i < VIEWS.length; i++) if (VIEWS[i].id === view) return i;
        return 0;
    }

    function render(sectionLabel, current, style) {
        var i = indexOf(current);
        if (style === 's4') {
            var menu = '';
            for (var m = 0; m < VIEWS.length; m++) {
                menu += '<button type="button" class="wv-sw-item" role="menuitemradio" tabindex="-1" data-view="' + VIEWS[m].id + '"' +
                    ' aria-checked="' + (m === i) + '">' +
                    '<span class="material-icons" aria-hidden="true">' + VIEWS[m].icon + '</span>' +
                    '<span class="wv-sw-item-label">' + VIEWS[m].label + '</span>' +
                    '<span class="material-icons wv-sw-check" aria-hidden="true">check</span></button>';
            }
            return '<div class="wv-switcher wv-switcher--s4" data-wv-menu>' +
                '<button type="button" class="wv-sw-trigger" aria-haspopup="menu" aria-expanded="false"' +
                ' aria-label="' + sectionLabel + ' view: ' + VIEWS[i].label + '">' +
                '<span class="material-icons wv-sw-icon" aria-hidden="true">' + VIEWS[i].icon + '</span>' +
                '<span class="wv-sw-label" aria-hidden="true">' + VIEWS[i].label + '</span>' +
                '<span class="material-icons wv-sw-caret" aria-hidden="true">expand_more</span></button>' +
                '<div class="wv-sw-menu" role="menu" aria-label="' + sectionLabel + ' view" hidden>' + menu + '</div></div>';
        }
        if (style === 's3') {
            var next = VIEWS[(i + 1) % VIEWS.length];
            return '<button type="button" class="wv-switcher wv-switcher--s3" data-wv-cycle' +
                ' aria-label="' + sectionLabel + ' view: ' + VIEWS[i].label + '. Switch to ' + next.label + '">' +
                '<span class="material-icons wv-sw-icon" aria-hidden="true">' + VIEWS[i].icon + '</span>' +
                '<span class="wv-sw-label" aria-hidden="true">' + VIEWS[i].label + '</span></button>';
        }
        var html = '<div class="wv-switcher wv-switcher--' + style + '" role="radiogroup" aria-label="' + sectionLabel + ' view" style="--i:' + i + '">';
        if (style === 's1') html += '<span class="wv-sw-thumb" aria-hidden="true"></span>';
        for (var v = 0; v < VIEWS.length; v++) {
            var on = v === i;
            html += '<button type="button" class="wv-sw-opt" role="radio" data-view="' + VIEWS[v].id + '"' +
                ' aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" aria-label="' + VIEWS[v].label + '" title="' + VIEWS[v].label + '">' +
                '<span class="material-icons" aria-hidden="true">' + VIEWS[v].icon + '</span></button>';
        }
        return html + '</div>';
    }

    function setActive(el, view, sectionLabel) {
        var i = indexOf(view);
        if (el.hasAttribute('data-wv-menu')) {
            var items = el.querySelectorAll('[role="menuitemradio"]');
            for (var k = 0; k < items.length; k++) items[k].setAttribute('aria-checked', items[k].dataset.view === view);
            el.querySelector('.wv-sw-trigger').setAttribute('aria-label', sectionLabel + ' view: ' + VIEWS[i].label);
        }
        if (el.hasAttribute('data-wv-cycle') || el.hasAttribute('data-wv-menu')) {
            var iconEl = el.querySelector('.wv-sw-icon');
            var labelEl = el.querySelector('.wv-sw-label');
            if (el.hasAttribute('data-wv-cycle')) {
                var next = VIEWS[(i + 1) % VIEWS.length];
                el.setAttribute('aria-label', sectionLabel + ' view: ' + VIEWS[i].label + '. Switch to ' + next.label);
            }
            var reduced = document.documentElement.classList.contains('wv-reduced');
            if (reduced || !iconEl.animate) {
                iconEl.textContent = VIEWS[i].icon;
                labelEl.textContent = VIEWS[i].label;
                return;
            }
            iconEl.animate([
                { transform: 'none', opacity: 1, filter: 'blur(0)' },
                { transform: 'rotate(-90deg) scale(0.4)', opacity: 0, filter: 'blur(2px)' }
            ], { duration: 140, easing: 'ease-in' }).finished.then(function () {
                iconEl.textContent = VIEWS[i].icon;
                labelEl.textContent = VIEWS[i].label;
                iconEl.animate([
                    { transform: 'rotate(90deg) scale(0.4)', opacity: 0, filter: 'blur(2px)' },
                    { transform: 'none', opacity: 1, filter: 'blur(0)' }
                ], { duration: 260, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' });
            });
            return;
        }
        el.style.setProperty('--i', i);
        var opts = el.querySelectorAll('[role="radio"]');
        for (var o = 0; o < opts.length; o++) {
            var on = opts[o].dataset.view === view;
            opts[o].setAttribute('aria-checked', on);
            opts[o].tabIndex = on ? 0 : -1;
        }
    }

    // onChange(view) is called with the requested view; the caller decides and then calls setActive.
    function bindMenu(el, onChange) {
        var trigger = el.querySelector('.wv-sw-trigger');
        var menu = el.querySelector('.wv-sw-menu');
        var items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitemradio"]'));
        var reduced = function () { return document.documentElement.classList.contains('wv-reduced'); };

        function isOpen() { return !menu.hidden; }

        function open(focusIndex) {
            if (isOpen()) return;
            menu.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            if (!reduced() && menu.animate) {
                menu.animate([
                    { opacity: 0, transform: 'translateY(-4px) scale(0.96)' },
                    { opacity: 1, transform: 'none' }
                ], { duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
            }
            var checked = items.findIndex(function (it) { return it.getAttribute('aria-checked') === 'true'; });
            var target = items[focusIndex !== undefined ? focusIndex : Math.max(checked, 0)];
            target.focus();
            document.addEventListener('pointerdown', onOutside, true);
        }

        function close(returnFocus) {
            if (!isOpen()) return;
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('pointerdown', onOutside, true);
            if (returnFocus) trigger.focus();
        }

        function onOutside(e) {
            if (!el.contains(e.target)) close(false);
        }

        trigger.addEventListener('click', function () {
            if (isOpen()) close(true);
            else open();
        });
        trigger.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                open(e.key === 'ArrowUp' ? items.length - 1 : undefined);
            }
        });
        menu.addEventListener('click', function (e) {
            var item = e.target.closest('[role="menuitemradio"]');
            if (!item) return;
            close(true);
            onChange(item.dataset.view);
        });
        menu.addEventListener('keydown', function (e) {
            var i = items.indexOf(document.activeElement);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
            } else if (e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                items[e.key === 'Home' ? 0 : items.length - 1].focus();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                close(true);
            } else if (e.key === 'Tab') {
                close(false);
            }
        });
    }

    function bind(el, getCurrent, onChange) {
        if (el.hasAttribute('data-wv-menu')) {
            bindMenu(el, function (view) {
                if (view !== getCurrent()) onChange(view);
            });
            return;
        }
        if (el.hasAttribute('data-wv-cycle')) {
            el.addEventListener('click', function () {
                onChange(VIEWS[(indexOf(getCurrent()) + 1) % VIEWS.length].id);
            });
            return;
        }
        el.addEventListener('click', function (e) {
            var opt = e.target.closest('[role="radio"]');
            if (opt && opt.dataset.view !== getCurrent()) onChange(opt.dataset.view);
        });
        el.addEventListener('keydown', function (e) {
            var delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            var jump = { Home: 0, End: VIEWS.length - 1 }[e.key];
            if (delta === undefined && jump === undefined) return;
            e.preventDefault();
            var i = jump !== undefined ? jump : (indexOf(getCurrent()) + delta + VIEWS.length) % VIEWS.length;
            onChange(VIEWS[i].id);
            var target = el.querySelector('[data-view="' + VIEWS[i].id + '"]');
            if (target) target.focus();
        });
    }

    window.WorkViewsSwitcher = { VIEWS: VIEWS, render: render, setActive: setActive, bind: bind };
})();
