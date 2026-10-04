// Work + Projects views: shared media markup (image or lazy looping video) and the
// in-view player. Lists, the grid and the detail card all render media through here.

(function () {
    var esc = function (s) { return window.WorkViewsUtil.escapeHtml(s); };

    // A still for small surfaces (list thumbs): the poster for videos, the image otherwise.
    function stillSrc(media) {
        if (!media) return null;
        if (media.type === 'video') return media.poster || null;
        return media.thumb || media.src;
    }

    // opts: { className, key, reduced, loading, playing, thumb }
    // thumb: use the media's tighter thumbnail crop, if it has one (small surfaces only).
    function mediaHtml(media, opts) {
        opts = opts || {};
        var cls = opts.className ? ' class="' + opts.className + '"' : '';
        var key = opts.key ? ' data-wv-key="' + esc(opts.key) + '"' : '';
        var loading = opts.loading || 'lazy';
        if (media.type === 'video') {
            if (opts.reduced) {
                if (media.poster) {
                    return '<img' + cls + key + ' src="' + esc(media.poster) + '" alt="' + esc(media.alt) + '" loading="' + loading + '" />';
                }
                // No poster on file: show the first frame, never autoplay.
                return '<video' + cls + key + ' muted playsinline preload="metadata" src="' + esc(media.src) + '#t=0.1" aria-label="' + esc(media.alt) + '"></video>';
            }
            return '<video' + cls + key + ' muted loop playsinline preload="none"' +
                (opts.playing ? ' autoplay src="' + esc(media.src) + '"' : ' data-wv-src="' + esc(media.src) + '"') +
                (media.poster ? ' poster="' + esc(media.poster) + '"' : '') +
                ' aria-label="' + esc(media.alt) + '"></video>';
        }
        var src = opts.thumb && media.thumb ? media.thumb : media.src;
        return '<img' + cls + key + ' src="' + esc(src) + '" alt="' + esc(media.alt) + '" loading="' + loading + '" decoding="async" />';
    }

    // Videos only load and play while on screen.
    var observer = null;
    function getObserver() {
        if (observer || !('IntersectionObserver' in window)) return observer;
        observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                var v = entries[i].target;
                if (entries[i].isIntersecting) {
                    if (!v.getAttribute('src') && v.dataset.wvSrc) v.src = v.dataset.wvSrc;
                    var p = v.play();
                    if (p && p.catch) p.catch(function () {});
                } else if (!v.paused) {
                    v.pause();
                }
            }
        }, { rootMargin: '200px 0px' });
        return observer;
    }

    function observeVideos(root) {
        var obs = getObserver();
        var vids = root.querySelectorAll('video[data-wv-src]');
        for (var i = 0; i < vids.length; i++) {
            if (obs) obs.observe(vids[i]);
            else vids[i].src = vids[i].dataset.wvSrc;
        }
    }

    function unobserveVideos(root) {
        if (!observer) return;
        var vids = root.querySelectorAll('video[data-wv-src]');
        for (var i = 0; i < vids.length; i++) observer.unobserve(vids[i]);
    }

    window.WorkViewsMedia = {
        stillSrc: stillSrc,
        mediaHtml: mediaHtml,
        observeVideos: observeVideos,
        unobserveVideos: unobserveVideos
    };
})();
