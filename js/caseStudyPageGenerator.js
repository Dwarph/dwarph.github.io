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

function getCaseStudyCompanyKey(companyLine) {
    var raw = (companyLine || '').split('//')[0] || '';
    raw = raw.trim().toLowerCase();
    if (raw.indexOf('fitxr') !== -1) return 'fitxr';
    if (raw.indexOf('ultraleap') !== -1) return 'ultraleap';
    return '';
}

function renderCaseStudyProgressScroller(companyLine) {
    var companyKey = getCaseStudyCompanyKey(companyLine);
    var companyClass = companyKey ? ' case-study-progress-scroller--' + companyKey : '';
    return (
        '<nav class="case-study-progress-scroller' +
        companyClass +
        '" role="navigation" aria-label="Reading progress" id="case-study-progress-scroller" style="--progress: 0">' +
        '<div class="case-study-progress-track" aria-hidden="true">' +
        '<div class="case-study-progress-fill" aria-hidden="true"></div>' +
        '</div>' +
        '<button type="button" class="case-study-progress-top" aria-label="Back to top" title="Back to top">' +
        '<span class="material-icons" aria-hidden="true">arrow_upward</span>' +
        '</button>' +
        '</nav>'
    );
}

/** null | 'dock' | 'rail' */
var caseStudyScrollerLayoutMode = null;
var CASE_STUDY_SCROLLER_RAIL_ENTER = 1080;
var CASE_STUDY_SCROLLER_DOCK_ENTER = 1040;

function syncCaseStudyScrollerLayout() {
    var w = window.innerWidth;
    if (w <= 768) {
        document.documentElement.classList.add('home-nav-layout-dock');
        document.documentElement.classList.remove('home-nav-layout-rail');
        caseStudyScrollerLayoutMode = 'dock';
        return;
    }
    if (caseStudyScrollerLayoutMode === null) {
        caseStudyScrollerLayoutMode = w <= CASE_STUDY_SCROLLER_DOCK_ENTER ? 'dock' : 'rail';
    } else if (caseStudyScrollerLayoutMode === 'dock' && w >= CASE_STUDY_SCROLLER_RAIL_ENTER) {
        caseStudyScrollerLayoutMode = 'rail';
    } else if (caseStudyScrollerLayoutMode === 'rail' && w <= CASE_STUDY_SCROLLER_DOCK_ENTER) {
        caseStudyScrollerLayoutMode = 'dock';
    }
    if (caseStudyScrollerLayoutMode === 'dock') {
        document.documentElement.classList.add('home-nav-layout-dock');
        document.documentElement.classList.remove('home-nav-layout-rail');
    } else {
        document.documentElement.classList.remove('home-nav-layout-dock');
        document.documentElement.classList.add('home-nav-layout-rail');
    }
}

function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
}

function getPageScrollProgress() {
    var scrollY = window.scrollY || window.pageYOffset || 0;
    // Use layout viewport here so "bottom of page" maps to progress=1 reliably.
    var viewportH = window.innerHeight;
    var scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
    );
    var maxScroll = Math.max(0, scrollHeight - viewportH);
    var distanceFromBottom = scrollHeight - (scrollY + viewportH);
    if (maxScroll <= 0) return { progress: 0, maxScroll: 0 };
    if (distanceFromBottom <= 2) return { progress: 1, maxScroll: maxScroll };
    return { progress: clamp01(scrollY / maxScroll), maxScroll: maxScroll };
}

function initCaseStudyProgressScroller(rootEl) {
    rootEl = rootEl || document;
    var scroller = rootEl.querySelector('#case-study-progress-scroller');
    if (!scroller) return;

    var prefersReducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var topRevealThreshold = 0.1;
    var smoothing = 0.12;
    var minScrollablePxToShow = 24;

    var ticking = false;
    var smoothProgress = parseFloat(scroller.style.getPropertyValue('--progress')) || 0;
    function update() {
        ticking = false;
        syncCaseStudyScrollerLayout();
        var metrics = getPageScrollProgress();
        var target = metrics.progress;

        // Hide on pages that don't really scroll.
        if (!metrics.maxScroll || metrics.maxScroll < minScrollablePxToShow) {
            scroller.classList.add('case-study-progress-scroller--hidden');
            return;
        }
        scroller.classList.remove('case-study-progress-scroller--hidden');

        if (smoothing > 0 && smoothing < 1) {
            smoothProgress = smoothProgress + (target - smoothProgress) * smoothing;
        } else {
            smoothProgress = target;
        }
        var p = clamp01(smoothProgress);
        scroller.style.setProperty('--progress', String(p));
        // Always show a “start cap” so the bar has colour at the top of the page.
        scroller.classList.add('case-study-progress-scroller--has-progress');
        if (p >= topRevealThreshold) scroller.classList.add('case-study-progress-scroller--top-visible');
        else scroller.classList.remove('case-study-progress-scroller--top-visible');
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    }

    var topBtn = scroller.querySelector('.case-study-progress-top');
    if (topBtn) {
        topBtn.addEventListener('click', function () {
            try {
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            } catch (e) {
                window.scrollTo(0, 0);
            }
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
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
        imgEl.alt = fromImg.alt || '';
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

function renderCaseStudyNotFound(homepageData) {
    var html = window.renderHeader(homepageData.header, { homeLink: 'index.html' });
    html += renderBreadcrumb('Not found');
    html +=
        '<section class="homepage-section case-study-section" id="case-study-content">' +
        '<h1 class="case-study-page-title">Case study not found</h1>' +
        '<p class="case-study-page-company">This page does not exist or has been moved.</p>' +
        '<p class="about-bio-paragraph"><a href="index.html">Return to homepage</a></p>' +
        '</section>';
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
        'data/homepageData.json',
        function (homepageData) {
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
                        container.innerHTML = renderCaseStudyNotFound(homepageData);
                        if (window.initHeaderImageReveal) window.initHeaderImageReveal(container);
                        if (window.loadHeaderDistortion) window.loadHeaderDistortion(container);
                        return;
                    }

                    window.fetchTextWithRetry(
                        'data/casestudies/' + caseStudyKey + '.md',
                        function (markdown) {
                            container.removeAttribute('aria-busy');
                            document.title = 'Pip Turner - ' + caseStudy.title;
                            var html = window.renderHeader(homepageData.header, { homeLink: 'index.html' });
                            html += renderBreadcrumb(caseStudy.title);
                            html += renderCaseStudyProgressScroller(caseStudy.company);
                            html += renderCaseStudyContent(caseStudy, markdown);
                            container.innerHTML = html;
                            if (window.initHeaderImageReveal) window.initHeaderImageReveal(container);
                            if (window.loadHeaderDistortion) window.loadHeaderDistortion(container);
                            initCaseStudyProgressScroller(container);
                            initCaseStudyMediaLayout(container);
                            initCaseStudyImageLightbox(container);
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
