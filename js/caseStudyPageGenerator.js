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
                            html += renderCaseStudyContent(caseStudy, markdown);
                            container.innerHTML = html;
                            if (window.initHeaderImageReveal) window.initHeaderImageReveal(container);
                            if (window.loadHeaderDistortion) window.loadHeaderDistortion(container);
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
