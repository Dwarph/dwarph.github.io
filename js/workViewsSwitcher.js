// Work + Projects views: the view switcher - a segmented pill with a sliding thumb.
// A radiogroup with a roving tabindex: arrow keys move and select, Home/End jump.

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

    function render(groupLabel, current) {
        var i = indexOf(current);
        var html = '<div class="wv-switcher" role="radiogroup" aria-label="' + groupLabel + '" style="--i:' + i + '">' +
            '<span class="wv-sw-thumb" aria-hidden="true"></span>';
        for (var v = 0; v < VIEWS.length; v++) {
            var on = v === i;
            html += '<button type="button" class="wv-sw-opt" role="radio" data-view="' + VIEWS[v].id + '"' +
                ' aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" aria-label="' + VIEWS[v].label + '" title="' + VIEWS[v].label + '">' +
                '<span class="material-icons" aria-hidden="true">' + VIEWS[v].icon + '</span></button>';
        }
        return html + '</div>';
    }

    function setActive(el, view) {
        el.style.setProperty('--i', indexOf(view));
        var opts = el.querySelectorAll('[role="radio"]');
        for (var o = 0; o < opts.length; o++) {
            var on = opts[o].dataset.view === view;
            opts[o].setAttribute('aria-checked', on);
            opts[o].tabIndex = on ? 0 : -1;
        }
    }

    // onChange(view) is called with the requested view; the caller decides and then calls setActive.
    function bind(el, getCurrent, onChange) {
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
