// Mobile detection is now in utils.js

function renderBreadcrumb(caseStudyTitle) {
    return `
        <nav class="breadcrumb-nav" role="navigation" aria-label="Breadcrumb">
            <a href="index.html" class="breadcrumb-link" aria-label="Go to homepage">Home</a>
            <span class="breadcrumb-separator" aria-hidden="true">/</span>
            <span class="breadcrumb-current" aria-current="page">${caseStudyTitle}</span>
        </nav>
    `;
}

function renderCaseStudyContent(caseStudy, markdown) {
    var converter = new showdown.Converter();
    var htmlContent = converter.makeHtml(markdown);

    htmlContent = htmlContent.replace(/src="\.\/images\/casestudies\//g, 'src="images/casestudies/');
    htmlContent = htmlContent.replace(/src="\.\/data\/casestudies\/images\//g, 'src="data/casestudies/images/');
    htmlContent = htmlContent.replace(/href="\.\/images\/casestudies\//g, 'href="images/casestudies/');
    htmlContent = htmlContent.replace(/href="\.\/data\/casestudies\/images\//g, 'href="data/casestudies/images/');

    var introParagraph = '';
    if (caseStudy.key === 'prosho') {
        introParagraph = '<p class="archive-intro">I led the design and interaction research for a suite of apps showcasing Hyperion—<span class="bio-gradient-ultraleap">Ultraleap</span>\'s sixth-generation hand tracking. By moving from stakeholder interviews and ShapesXR prototypes to iterative user testing, we demonstrated the power of microgestures and "hand-on-object" tracking in real-world scenarios. These demos ultimately drove new OEM interest and excited customers at major events like AWE.</p>';
    }

    return `
        <section class="homepage-section case-study-section" id="case-study-content">
            <h1 class="case-study-page-title">${caseStudy.title}</h1>
            <p class="case-study-page-company">${caseStudy.company}</p>
            ${introParagraph}
            <div class="case-study-content">
                ${htmlContent}
            </div>
        </section>
    `;
}

function getCaseStudyImageDescription(img) {
    if (!img) return '';
    var alt = (img.getAttribute('alt') || '').trim();
    if (alt) return alt;
    var figure = img.closest ? img.closest('figure') : null;
    if (!figure) return '';
    var cap = figure.querySelector('figcaption');
    return cap ? (cap.textContent || '').trim() : '';
}

function appendCaseStudyFigcaption(figure, img) {
    if (!figure || !img || figure.querySelector('figcaption')) return;
    var captionText = (img.getAttribute('alt') || '').trim();
    if (!captionText) return;
    var caption = document.createElement('figcaption');
    caption.textContent = captionText;
    figure.appendChild(caption);
    img.setAttribute('alt', '');
}

function initCaseStudyMediaLayout(rootEl) {
    if (!rootEl) return;

    var scope = rootEl.querySelector('.case-study-content');
    if (!scope) return;

    var images = scope.querySelectorAll('img[title]');
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var rawTitle = (img.getAttribute('title') || '').trim();
        if (!rawTitle) continue;

        var tokens = rawTitle
            .split(/[\s,]+/g)
            .map(function (t) {
                return (t || '').trim().toLowerCase();
            })
            .filter(Boolean);

        var allowed = {
            wide: true,
            narrow: true,
            bleed: true,
            'bleed-xl': true,
            left: true,
            right: true
        };

        var picked = [];
        for (var t = 0; t < tokens.length; t++) {
            if (allowed[tokens[t]]) picked.push(tokens[t]);
        }

        // Nothing we recognise → leave as-is (still lets authors use title as actual tooltip text).
        if (!picked.length) continue;

        var mediaNode = img.closest('a');
        if (!mediaNode || mediaNode.querySelectorAll('img').length !== 1) {
            mediaNode = img;
        }

        // Avoid double-wrapping if content re-inits.
        if (mediaNode.closest && mediaNode.closest('figure.cs-media')) continue;

        var figure = document.createElement('figure');
        figure.className = 'cs-media';

        for (var p = 0; p < picked.length; p++) {
            figure.classList.add('cs-media--' + picked[p]);
        }

        var parent = mediaNode.parentNode;
        if (!parent) continue;
        parent.insertBefore(figure, mediaNode);
        figure.appendChild(mediaNode);

        appendCaseStudyFigcaption(figure, img);

        // Title was used as layout directive, so remove it to avoid weird hover tooltips.
        img.removeAttribute('title');

        // If the media was wrapped by a paragraph, remove the paragraph wrapper for cleaner spacing.
        if (figure.parentNode && figure.parentNode.tagName === 'P' && figure.parentNode.childNodes.length === 1) {
            var pEl = figure.parentNode;
            pEl.parentNode.insertBefore(figure, pEl);
            pEl.parentNode.removeChild(pEl);
        }
    }
}

function getOrCreateImageLightbox() {
    var existing = document.getElementById('image-lightbox-overlay');
    if (existing) return existing;

    var overlay = document.createElement('div');
    overlay.className = 'image-lightbox-overlay';
    overlay.id = 'image-lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.setAttribute('hidden', 'true');

    overlay.innerHTML =
        '<button type="button" class="image-lightbox-close" aria-label="Close image preview">' +
        '<span aria-hidden="true">×</span>' +
        '</button>' +
        '<div class="image-lightbox-stage" role="document">' +
        '<img class="image-lightbox-image" alt="" />' +
        '</div>';

    document.body.appendChild(overlay);
    return overlay;
}

function initCaseStudyVideos(rootEl) {
    if (!rootEl) return;

    var scope = rootEl.querySelector('.case-study-content');
    if (!scope) return;

    var videos = scope.querySelectorAll('video');
    if (!videos.length) return;

    var reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (var i = 0; i < videos.length; i++) {
        var video = videos[i];
        video.removeAttribute('autoplay');
        video.setAttribute('preload', 'none');
        video.pause();
        if (reduced) {
            video.removeAttribute('loop');
        }
    }

    if (reduced || typeof IntersectionObserver !== 'function') return;

    var observer = new IntersectionObserver(
        function (entries) {
            for (var e = 0; e < entries.length; e++) {
                var entry = entries[e];
                var video = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
                    if (video.getAttribute('preload') === 'none') {
                        video.setAttribute('preload', 'metadata');
                    }
                    var playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(function () {});
                    }
                } else {
                    video.pause();
                }
            }
        },
        { rootMargin: '120px 0px', threshold: [0, 0.2, 0.5] }
    );

    for (var v = 0; v < videos.length; v++) {
        observer.observe(videos[v]);
    }
}

function initCaseStudyContentImages(rootEl) {
    if (!rootEl) return;

    var scope = rootEl.querySelector('.case-study-content');
    if (!scope) return;

    var images = scope.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        if (!img.getAttribute('loading')) {
            img.setAttribute('loading', i === 0 ? 'eager' : 'lazy');
        }
        if (!img.getAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
    }
}

function initCaseStudyImageLightbox(rootEl) {
    if (!rootEl) return;

    var scope = rootEl.querySelector('.case-study-content');
    if (!scope) return;

    var overlay = getOrCreateImageLightbox();
    var stage = overlay.querySelector('.image-lightbox-stage');
    var imgEl = overlay.querySelector('.image-lightbox-image');
    var closeBtn = overlay.querySelector('.image-lightbox-close');

    var lastActiveEl = null;
    var scrollYBeforeOpen = 0;

    function openLightbox(fromImg) {
        if (!fromImg || !fromImg.src) return;

        lastActiveEl = document.activeElement;
        scrollYBeforeOpen = window.scrollY || 0;

        imgEl.src = fromImg.src;
        imgEl.alt = getCaseStudyImageDescription(fromImg);
        imgEl.removeAttribute('width');
        imgEl.removeAttribute('height');

        overlay.removeAttribute('hidden');
        overlay.classList.add('image-lightbox-overlay--open');
        document.documentElement.classList.add('image-lightbox-open');

        // Avoid layout shift if the page already has a stable scrollbar gutter, but still
        // prevent scroll chaining while open.
        document.body.style.overflow = 'hidden';

        closeBtn.focus();
    }

    function closeLightbox() {
        if (overlay.hasAttribute('hidden')) return;

        overlay.classList.remove('image-lightbox-overlay--open');
        overlay.setAttribute('hidden', 'true');
        document.documentElement.classList.remove('image-lightbox-open');
        document.body.style.overflow = '';

        // Release the image resource reference quickly (helps memory on huge images).
        imgEl.removeAttribute('src');

        try {
            window.scrollTo(0, scrollYBeforeOpen);
        } catch (e) {}

        if (lastActiveEl && typeof lastActiveEl.focus === 'function') {
            lastActiveEl.focus();
        }
        lastActiveEl = null;
    }

    function onOverlayClick(e) {
        // Close when clicking the dimmed backdrop or the stage padding, but not the image itself.
        if (e.target === overlay || e.target === stage) closeLightbox();
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeLightbox();
        }
    }

    // Ensure we only bind overlay listeners once.
    if (!overlay.__imageLightboxBound) {
        overlay.__imageLightboxBound = true;
        overlay.addEventListener('click', onOverlayClick);
        closeBtn.addEventListener('click', function () {
            closeLightbox();
        });
        document.addEventListener('keydown', onKeyDown);

        // Clicking the enlarged image closes too (fast “tap to dismiss”).
        imgEl.addEventListener('click', function () {
            closeLightbox();
        });
    }

    var images = scope.querySelectorAll('img:not([data-no-lightbox])');
    for (var i = 0; i < images.length; i++) {
        (function (img) {
            // If the image is inside a link, keep the overlay behaviour rather than navigation.
            img.classList.add('case-study-lightbox-image');
            img.setAttribute('role', 'button');
            img.setAttribute('tabindex', '0');
            img.setAttribute('aria-haspopup', 'dialog');

            function handleActivate(e) {
                // Let users drag to select text around images etc.
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                openLightbox(img);
            }

            img.addEventListener('click', handleActivate);
            img.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    openLightbox(img);
                }
            });
        })(images[i]);
    }
}

function renderCaseStudyFetchError(onRetryId) {
    return (
        '<div class="page-status page-status--error" role="alert" id="case-study-content">' +
        '<p class="page-status-text">Could not load this case study. Check your connection and try again.</p>' +
        '<button type="button" class="page-status-retry" id="' +
        onRetryId +
        '">Try again</button>' +
        '</div>'
    );
}

function renderCaseStudyNotFound() {
    var html = renderBreadcrumb('Not found');
    html +=
        '<section class="homepage-section case-study-section" id="case-study-content">' +
        '<h1 class="case-study-page-title">Case study not found</h1>' +
        '<p class="case-study-page-company">This page does not exist or has been moved.</p>' +
        '</section>';
    html += typeof window.renderReturnHomeLink === 'function' ? window.renderReturnHomeLink() : '';
    return html;
}

function loadCaseStudyPage() {
    var pathParts = window.location.pathname.split('/');
    var fileName = pathParts[pathParts.length - 1];
    var caseStudyKey = fileName.replace('.html', '');

    var container = document.getElementById('case-study-container');
    if (!container) return;

    if (typeof window.fetchJsonWithRetry !== 'function' || typeof window.fetchTextWithRetry !== 'function') {
        container.innerHTML =
            '<div class="page-status page-status--error" role="alert"><p class="page-status-text">Could not load scripts.</p></div>';
        return;
    }

    container.setAttribute('aria-busy', 'true');
    container.innerHTML =
        '<div class="sr-only" role="status" aria-live="polite" aria-label="Loading case study">Loading</div>';

    window.fetchJsonWithRetry(
        'data/caseStudiesData.json',
        function (caseStudies) {
            var caseStudy = null;
            for (var i = 0; i < caseStudies.length; i++) {
                if (caseStudies[i].key === caseStudyKey) {
                    caseStudy = caseStudies[i];
                    break;
                }
            }

            if (!caseStudy) {
                container.removeAttribute('aria-busy');
                document.title = 'Pip Turner — Case study not found';
                container.innerHTML = renderCaseStudyNotFound();
                return;
            }

            window.fetchTextWithRetry(
                'data/casestudies/' + caseStudyKey + '.md',
                function (markdown) {
                    container.removeAttribute('aria-busy');
                    document.title = 'Pip Turner - ' + caseStudy.title;
                    var html = renderBreadcrumb(caseStudy.title);
                    html += renderCaseStudyContent(caseStudy, markdown);
                    if (typeof window.renderReturnHomeLink === 'function') {
                        html += window.renderReturnHomeLink();
                    }
                    container.innerHTML = html;
                    initCaseStudyMediaLayout(container);
                    initCaseStudyContentImages(container);
                    initCaseStudyVideos(container);
                    initCaseStudyImageLightbox(container);
                    if (typeof window.initCaseStudyCompare === 'function') {
                        window.initCaseStudyCompare(container);
                    }
                },
                function () {
                    container.removeAttribute('aria-busy');
                    container.innerHTML = renderCaseStudyFetchError('case-study-retry');
                    var btn = document.getElementById('case-study-retry');
                    if (btn) {
                        btn.addEventListener('click', function () {
                            loadCaseStudyPage();
                        });
                    }
                }
            );
        },
        function () {
            container.removeAttribute('aria-busy');
            container.innerHTML = renderCaseStudyFetchError('case-study-retry');
            var btn = document.getElementById('case-study-retry');
            if (btn) {
                btn.addEventListener('click', function () {
                    loadCaseStudyPage();
                });
            }
        }
    );
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCaseStudyPage);
} else {
    loadCaseStudyPage();
}
