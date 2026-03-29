// Mobile detection is now in utils.js


function getGradientClass(company) {
    if (company === "fitxr") {
        return "gradient-fitxr";
    } else if (company === "ultraleap") {
        return "gradient-ultraleap";
    }
    return "";
}

function isExternalLink(url) {
    if (!url) return false;
    return url.startsWith('http://') || 
           url.startsWith('https://') || 
           url.startsWith('mailto:');
}

// Header is now rendered using window.renderHeader from header.js

/** Material Icons for homepage side nav (desktop). Sync names with Figma if they differ. */
var HOMEPAGE_NAV_ICONS = ['person', 'work', 'palette', 'mic', 'mail'];

/**
 * Click Talks nav: top of #talks vs viewport (not the pink active state — that’s scroll-spy).
 * FRACTION: 0 = align section top to viewport top; 0.08 = section top 8% down from top.
 */
var HOMEPAGE_TALKS_VIEWPORT_TOP_FRACTION = 0;

/** Extra px gap from viewport top to top of #talks (after FRACTION). Positive = Talks sits lower. */
var HOMEPAGE_TALKS_VIEWPORT_TOP_INSET_PX = 0;

/**
 * Extra scroll down (px) so Talks sits higher on the screen. Increase if Talks still feels too low when clicked.
 */
var HOMEPAGE_TALKS_SCROLL_OVERSHOOT_PX = 96;

/**
 * Min scrollable space left below the viewport after jumping to Talks (so Contact can still be reached).
 * Only the value below is used here — keep it modest or the scroll target gets capped and Talks stays too low.
 */
var HOMEPAGE_TALKS_BOTTOM_RESERVE_PX = 140;

function renderAbout(about) {
    // Split bio text to handle styling for "Pip", "Ultraleap", "FitXR", and "joyful and inevitable"
    var bioText = about.bio;
    
    // Apply styling
    bioText = bioText
        .replace(/Pip/g, '<span class="bio-highlight-pip">Pip</span>')
        .replace(/Ultraleap/g, '<span class="bio-gradient-ultraleap">Ultraleap</span>')
        .replace(/FitXR/g, '<span class="bio-gradient-fitxr">FitXR</span>')
        .replace(/joyful and inevitable/g, '<span class="bio-highlight-yellow">joyful and inevitable</span>');
    
    // Split by double newlines to create paragraphs
    var paragraphs = bioText.split(/\n\n+/);
    var bioHtml = '';
    for (var i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].trim()) {
            bioHtml += '<p class="about-bio-paragraph">' + paragraphs[i].trim() + '</p>';
        }
    }

    return `
        <section id="about" class="homepage-section about-section">
            <h2 class="section-title">About</h2>
            <div class="about-content">
                <div class="about-bio">${bioHtml}</div>
                <a href="${about.cvLink}" class="cv-download-link" download aria-label="Download CV">
                    Download CV
                    <span class="material-icons link-icon external" aria-hidden="true">north_east</span>
                </a>
            </div>
        </section>
    `;
}

function renderCaseStudy(caseStudy, isMobile) {
    if (isMobile === undefined) {
        isMobile = window.mobileCheck();
    }
    
    // Generate link: use explicit link, or generate from key, or null if coming soon
    var caseStudyLink = null;
    if (caseStudy.link) {
        // Use explicit link
        caseStudyLink = caseStudy.link;
    } else if (caseStudy.key && !caseStudy.comingSoon) {
        // Generate link from key (assume page exists)
        caseStudyLink = caseStudy.key + '.html';
    }
    // If comingSoon is true or no key, leave link as null
    
    // Check if this is a coming soon case study
    var isComingSoon = caseStudy.comingSoon === true;
    
    // Determine if link is external or internal
    var isExternal = caseStudyLink ? isExternalLink(caseStudyLink) : false;
    
    var linkIcon = '';
    if (caseStudyLink) {
        if (isExternal) {
            linkIcon = '<span class="material-icons link-icon external" aria-hidden="true">north_east</span>';
        } else {
            linkIcon = '<span class="material-icons link-icon chevron" aria-hidden="true">chevron_right</span>';
        }
    } else if (!isComingSoon) {
        // Only show chevron if not coming soon
        linkIcon = '<span class="material-icons link-icon chevron" aria-hidden="true">chevron_right</span>';
    }

    var comingSoonClass = isComingSoon ? ' coming-soon' : '';
    var comingSoonDataAttr = isComingSoon ? ' data-coming-soon="true"' : '';
    var comingSoonBadge = isComingSoon ? '<span class="coming-soon-badge"><span class="material-icons">lock</span><span class="coming-soon-text">Coming Soon!</span></span>' : '';
    
    var titleContainer = isMobile ? 
        `<div class="case-study-title-container${comingSoonClass}"${comingSoonDataAttr}>` :
        `<div class="case-study-title-container desktop-align-right${comingSoonClass}"${comingSoonDataAttr}>`;

    // If there's a link, title is just styled text (card will be the link)
    // If no link, title is a span
    var titleHtml = caseStudyLink ? 
        `${titleContainer}<span class="case-study-title-link">${caseStudy.title}</span>${linkIcon}</div>` :
        `${titleContainer}<span class="case-study-title">${caseStudy.title}</span>${linkIcon}${comingSoonBadge}</div>`;

    var tagsHtml = caseStudy.tags ? `<p class="case-study-tags">${caseStudy.tags}</p>` : '';
    
    // Image is just an image (card will be the link if there's a link)
    // Add lazy loading and aspect ratio to prevent layout shift
    var imageHtml = `<img class="case-study-image" src="${caseStudy.image}" alt="${caseStudy.imageAlt || ''}" loading="lazy" width="800" height="600" />`;
    
    // Wrap entire card in link if there's a link, otherwise just a div
    var cardContent = `
        ${imageHtml}
        <div class="case-study-content">
            ${titleHtml}
            ${tagsHtml}
            <p class="case-study-description">${caseStudy.description}</p>
        </div>
    `;
    
    if (caseStudyLink) {
        var targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        var ariaLabel = caseStudy.imageAlt || caseStudy.title;
        return `
            <a href="${caseStudyLink}" class="case-study-card-link"${targetAttr} aria-label="View case study: ${ariaLabel}">
                <div class="case-study-card${comingSoonClass}"${comingSoonDataAttr}>
                    ${cardContent}
                </div>
            </a>
        `;
    } else {
        return `
            <div class="case-study-card${comingSoonClass}"${comingSoonDataAttr} role="article" aria-label="${caseStudy.title}">
                ${cardContent}
            </div>
        `;
    }
}

function renderWork(work) {
    var isMobile = window.mobileCheck();
    var workHtml = '<section id="work" class="homepage-section work-section"><h2 class="section-title">Work</h2><div class="work-jobs">';

    for (var i = 0; i < work.length; i++) {
        var job = work[i];
        var gradientClass = getGradientClass(job.gradientColor);
        
        // Build case studies HTML
        var caseStudiesHtml = '';
        if (job.caseStudies && job.caseStudies.length > 0) {
            var caseStudiesTitle = job.company === 'Ultraleap' ? 'Case Studies & Other Work' : 'Case Studies';
            caseStudiesHtml += '<div class="job-case-studies ' + job.gradientColor + '"><h4 class="case-studies-title">' + caseStudiesTitle + '</h4>';
            for (var j = 0; j < job.caseStudies.length; j++) {
                caseStudiesHtml += renderCaseStudy(job.caseStudies[j], isMobile);
            }
            caseStudiesHtml += '</div>';
        }

        // Build other work HTML
        var otherWorkHtml = '';
        if (job.otherWork && job.otherWork.length > 0) {
            otherWorkHtml += '<div class="job-other-work ' + job.gradientColor + '"><h4 class="case-studies-title">Other Work</h4>';
            for (var k = 0; k < job.otherWork.length; k++) {
                otherWorkHtml += renderCaseStudy(job.otherWork[k], isMobile);
            }
            otherWorkHtml += '</div>';
        }

        // Check if we need a timeline divider (if there are case studies or other work)
        var needsTimeline = (job.caseStudies && job.caseStudies.length > 0) || (job.otherWork && job.otherWork.length > 0);

        // Apply styling to company names in description (matching About section formatting)
        var descriptionText = job.description;
        descriptionText = descriptionText
            .replace(/Ultraleap/g, '<span class="bio-gradient-ultraleap">Ultraleap</span>')
            .replace(/FitXR/g, '<span class="bio-gradient-fitxr">FitXR</span>');

        // Build case studies container with timeline if needed
        var caseStudiesContainerHtml = '';
        if (needsTimeline) {
            caseStudiesContainerHtml = `
                <div class="job-case-studies-container ${job.gradientColor}">
                    <div class="job-timeline-column">
                        <div class="job-timeline-gradient ${job.gradientColor}"></div>
                    </div>
                    <div class="job-case-studies-content">
                        ${caseStudiesHtml}
                        ${otherWorkHtml}
                    </div>
                </div>
            `;
        } else {
            // If no case studies, still wrap in container but without timeline
            caseStudiesContainerHtml = `
                <div class="job-case-studies-container">
                    <div class="job-case-studies-content">
                        ${caseStudiesHtml}
                        ${otherWorkHtml}
                    </div>
                </div>
            `;
        }

        workHtml += `
            <div class="work-job">
                <div class="job-layout">
                    <div class="job-left-column">
                        <div class="job-logo-container">
                            <img class="job-logo" src="${job.logo}" alt="${job.company} logo" loading="lazy" width="100" height="100" />
                        </div>
                    </div>
                    <div class="job-right-column ${needsTimeline ? 'has-case-studies ' + job.gradientColor : ''}">
                        ${needsTimeline ? '<div class="job-timeline-scroll-bar ' + job.gradientColor + '" aria-hidden="true"></div>' : ''}
                        <!-- Desktop: job info and description -->
                        <div class="job-info-desktop">
                            <div class="job-info">
                                <h3 class="job-company ${gradientClass}">${job.company}</h3>
                                <p class="job-dates">${job.dates}</p>
                                <p class="job-role">${job.role}</p>
                            </div>
                            <p class="job-description">${descriptionText}</p>
                        </div>
                        ${caseStudiesHtml}
                        ${otherWorkHtml}
                        
                        <!-- Mobile: work info container -->
                        <div class="job-work-info">
                            <div class="job-logo-container-mobile">
                                <img class="job-logo" src="${job.logo}" alt="${job.company} logo" loading="lazy" width="100" height="100" />
                            </div>
                            <div class="job-info-mobile">
                                <h3 class="job-company ${gradientClass}">${job.company}</h3>
                                <p class="job-dates">${job.dates}</p>
                                <p class="job-role">${job.role}</p>
                            </div>
                        </div>
                        
                        <!-- Mobile: work description container -->
                        <div class="job-work-description">
                            <p class="job-description-mobile">${descriptionText}</p>
                        </div>
                        
                        <!-- Mobile: case studies container -->
                        ${caseStudiesContainerHtml}
                    </div>
                </div>
                <div class="job-bottom-bar ${job.gradientColor}"></div>
            </div>
        `;
    }

    workHtml += '</div></section>';
    return workHtml;
}

function renderProjects(projects) {
    var isMobile = window.mobileCheck();
    var projectsHtml = '<section id="projects" class="homepage-section projects-section"><h2 class="section-title">Projects</h2><div class="projects-list">';

    for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var isExternal = project.link ? isExternalLink(project.link) : false;
        var linkIcon = '';
        if (project.link) {
            if (isExternal) {
                linkIcon = '<span class="material-icons link-icon external" aria-hidden="true">north_east</span>';
            } else {
                linkIcon = '<span class="material-icons link-icon chevron" aria-hidden="true">chevron_right</span>';
            }
        }

        // If there's a link, title is just styled text (card will be the link)
        // If no link, title is a span
        var titleHtml = project.link ? 
            `<span class="project-title-link">${project.title}${linkIcon}</span>` :
            `<span class="project-title">${project.title}${linkIcon}</span>`;

        var tagsHtml = project.tags ? `<p class="project-tags">${project.tags}</p>` : '';
        
        // Image is just an image (card will be the link if there's a link)
        // Add lazy loading and dimensions to prevent layout shift
        var imageHtml = `<img class="project-image" src="${project.image}" alt="${project.imageAlt || ''}" loading="lazy" width="400" height="300" />`;
        
        var cardContent = `
            ${imageHtml}
            <div class="project-content">
                ${titleHtml}
                <p class="project-year">${project.year}</p>
                ${tagsHtml}
                <p class="project-description">${project.description}</p>
            </div>
        `;
        
        if (project.link) {
            var targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            var ariaLabel = project.imageAlt || project.title;
            projectsHtml += `
                <a href="${project.link}" class="project-card-link"${targetAttr} aria-label="View project: ${ariaLabel}">
                    <div class="project-card">
                        ${cardContent}
                    </div>
                </a>
            `;
        } else {
            projectsHtml += `
                <div class="project-card" role="article" aria-label="${project.title}">
                    ${cardContent}
                </div>
            `;
        }
    }

    projectsHtml += '</div></section>';
    return projectsHtml;
}

function renderTalks(talks) {
    var talksHtml = '<section id="talks" class="homepage-section talks-section"><h2 class="section-title">Talks</h2><div class="talks-list">';

    for (var i = 0; i < talks.length; i++) {
        var talk = talks[i];
        var locationsHtml = '';
        for (var j = 0; j < talk.locations.length; j++) {
            locationsHtml += `<p class="talk-location">${talk.locations[j]}</p>`;
        }

        var isExternal = talk.link ? isExternalLink(talk.link) : false;
        var linkIcon = '';
        if (talk.link) {
            if (isExternal) {
                linkIcon = '<span class="material-icons link-icon external" aria-hidden="true">north_east</span>';
            } else {
                linkIcon = '<span class="material-icons link-icon chevron" aria-hidden="true">chevron_right</span>';
            }
        }

        var targetAttr = talk.link && isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        var titleHtml = talk.link ? 
            `<a href="${talk.link}" class="talk-title-link"${targetAttr}>${talk.title}${linkIcon}</a>` :
            `<span class="talk-title">${talk.title}${linkIcon}</span>`;

        talksHtml += `
            <div class="talk-item">
                ${titleHtml}
                <div class="talk-locations">${locationsHtml}</div>
            </div>
        `;
    }

    talksHtml += '</div></section>';
    return talksHtml;
}

function renderContact(contact) {
    var socialLinksHtml = '';
    for (var i = 0; i < contact.socialLinks.length; i++) {
        var link = contact.socialLinks[i];
        var linkIcon = '<span class="material-icons link-icon external" aria-hidden="true">north_east</span>';
        
        var linkAriaLabel = 'Visit ' + link.name + ' profile';
        socialLinksHtml += `
            <div class="contact-item">
                ${link.link ? `<a href="${link.link}" class="contact-link" target="_blank" rel="noopener noreferrer" aria-label="${linkAriaLabel}">${link.name}${linkIcon}</a>` : `<span class="contact-link">${link.name}${linkIcon}</span>`}
            </div>
        `;
    }

    var emailLinkIcon = '<span class="material-icons link-icon external" aria-hidden="true">north_east</span>';
    
    return `
        <section id="contact" class="homepage-section contact-section">
            <h2 class="section-title">Contact</h2>
            <div class="contact-content">
                ${socialLinksHtml}
                <div class="contact-item">
                    <a href="mailto:${contact.email}" class="contact-label" target="_blank" rel="noopener noreferrer" aria-label="Send email to ${contact.email}">Email${emailLinkIcon}</a>
                    <p class="contact-email">${contact.email}</p>
                </div>
            </div>
        </section>
    `;
}

function loadHomepageData() {
    var container = document.getElementById('homepage-container');
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML =
        '<div class="sr-only" role="status" aria-live="polite" aria-label="Loading content">Loading</div>';

    if (typeof window.fetchJsonWithRetry !== 'function') {
        container.removeAttribute('aria-busy');
        container.innerHTML =
            '<div class="page-status page-status--error" role="alert" id="about"><p class="page-status-text">Could not load scripts.</p></div>';
        return;
    }

    window.fetchJsonWithRetry('data/homepageData.json', function (data) {
        container.removeAttribute('aria-busy');

        var html = '';
        // Header and nav wrapped in one div with 0px gap so layout stays identical
        html += '<div class="homepage-header-nav-wrapper">';
        html += window.renderHeader(data.header, { isHomepage: true });
        var navItems = [
            { href: '#about', label: 'About', icon: HOMEPAGE_NAV_ICONS[0] },
            { href: '#work', label: 'Work', icon: HOMEPAGE_NAV_ICONS[1] },
            { href: '#projects', label: 'Projects', icon: HOMEPAGE_NAV_ICONS[2] },
            { href: '#talks', label: 'Talks', icon: HOMEPAGE_NAV_ICONS[3] },
            { href: '#contact', label: 'Contact', icon: HOMEPAGE_NAV_ICONS[4] }
        ];
        html += '<nav class="homepage-nav" role="navigation" aria-label="Main navigation" id="homepage-section-nav">';
        for (var ni = 0; ni < navItems.length; ni++) {
            var item = navItems[ni];
            html +=
                '<a href="' +
                item.href +
                '" class="nav-link" data-section="' +
                item.href.slice(1) +
                '" aria-label="Navigate to ' +
                item.label +
                ' section">' +
                '<span class="material-icons nav-icon" aria-hidden="true">' +
                item.icon +
                '</span>' +
                '<span class="nav-text">' +
                item.label +
                '</span>' +
                '</a>';
        }
        html += '</nav>';
        html += '</div>';
        html += renderAbout(data.about);
        html += renderWork(data.work);
        html += renderProjects(data.projects);
        html += renderTalks(data.talks);
        html += renderContact(data.contact);

        homepageNavLayoutMode = null;
        lastHomepageNavActiveId = null;
        container.innerHTML = html;
        syncHomepageNavLayout();
        if (window.initHeaderImageReveal) window.initHeaderImageReveal(container);
        if (window.loadHeaderDistortion) {
            window.loadHeaderDistortion(container);
        }

        // Position timeline dividers to start at case studies section
        function updateTimelinePositions() {
            // Set --timeline-top so the animated .job-timeline-scroll-bar starts at the correct y-position.
            // On desktop this uses the direct .job-case-studies; on mobile the visible timeline lives inside .job-case-studies-container.
            var rightColumns = container.querySelectorAll('.job-right-column.has-case-studies');
            for (var i = 0; i < rightColumns.length; i++) {
                var rightColumn = rightColumns[i];

                var timelineAnchor = null;
                // Mobile (visible) anchor
                var mobileTimelineAnchor = rightColumn.querySelector('.job-case-studies-container .job-timeline-gradient');
                if (mobileTimelineAnchor && mobileTimelineAnchor.offsetHeight > 0) timelineAnchor = mobileTimelineAnchor;

                // Desktop (visible) anchor
                var desktopTimelineAnchor = rightColumn.querySelector(':scope > .job-case-studies');
                if (!timelineAnchor && desktopTimelineAnchor && desktopTimelineAnchor.offsetHeight > 0) timelineAnchor = desktopTimelineAnchor;

                // Fallbacks for edge cases (e.g. before layout/visibility settles)
                if (!timelineAnchor) {
                    if (mobileTimelineAnchor) timelineAnchor = mobileTimelineAnchor;
                    else if (desktopTimelineAnchor) timelineAnchor = desktopTimelineAnchor;
                }

                if (timelineAnchor) {
                    var anchorRect = timelineAnchor.getBoundingClientRect();
                    var rightColumnRect = rightColumn.getBoundingClientRect();
                    var anchorOffset = anchorRect.top - rightColumnRect.top;
                    rightColumn.style.setProperty('--timeline-top', anchorOffset + 'px');
                }
            }
        }

        // Wait for layout to settle using requestAnimationFrame
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                updateTimelinePositions();
                try {
                    if (window.initScrollAnim) window.initScrollAnim(container);
                } catch (err) {
                    console.error('Scroll animation failed:', err);
                    if (window.forceVisibleScrollSections) window.forceVisibleScrollSections(container);
                }

                // Also update after images load in case they affect layout
                var images = container.querySelectorAll('img');
                var imagesLoaded = 0;
                if (images.length === 0) {
                    return;
                }
                for (var i = 0; i < images.length; i++) {
                    if (images[i].complete) {
                        imagesLoaded++;
                    } else {
                        images[i].addEventListener('load', function() {
                            imagesLoaded++;
                            if (imagesLoaded === images.length) {
                                requestAnimationFrame(updateTimelinePositions);
                            }
                        });
                        images[i].addEventListener('error', function() {
                            imagesLoaded++;
                            if (imagesLoaded === images.length) {
                                requestAnimationFrame(updateTimelinePositions);
                            }
                        });
                    }
                }
                if (imagesLoaded === images.length) {
                    requestAnimationFrame(updateTimelinePositions);
                }
            });
        });

        // Constrain project images to match content height
        setTimeout(function() {
            var projectCards = container.querySelectorAll('.project-card');
            for (var i = 0; i < projectCards.length; i++) {
                var card = projectCards[i];
                var image = card.querySelector('.project-image');
                var content = card.querySelector('.project-content');
                if (image && content) {
                    var contentHeight = content.offsetHeight;
                    var minHeight = 194; // Minimum height (width of image)
                    var maxHeight = Math.max(minHeight, contentHeight);
                    image.style.maxHeight = maxHeight + 'px';
                    image.style.height = 'auto';
                }
            }
        }, 0);

        // Section nav: scroll spy + smooth in-page jumps
        initHomepageSectionNav(container);

        var navLinks = container.querySelectorAll('.homepage-nav .nav-link');
        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].addEventListener('click', function(e) {
                e.preventDefault();
                var targetId = this.getAttribute('href').substring(1);
                setHomepageNavActive(container, targetId);
                /* Smooth scroll leaves short sections with the reading line still in the next block — hold clicked id */
                homepageNavSpySuppressUntil =
                    homepageNavNow() + (prefersReducedMotion ? 50 : 950);
                var targetElement = document.getElementById(targetId);
                if (targetElement) {
                    if (targetId === 'talks') {
                        scrollTalksLeavingRoomForContact(targetElement, prefersReducedMotion);
                    } else {
                        targetElement.scrollIntoView({
                            behavior: prefersReducedMotion ? 'auto' : 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        }

        // Handle "Coming Soon" tooltip for case studies without pages (desktop only)
        setTimeout(function() {
            if (!window.mobileCheck()) {
                setupComingSoonTooltips();
            }
        }, 0);
    }, function () {
        container.removeAttribute('aria-busy');
        container.innerHTML =
            '<div class="page-status page-status--error" role="alert" id="about">' +
            '<p class="page-status-text">Could not load this page. Check your connection and try again.</p>' +
            '<button type="button" class="page-status-retry" id="homepage-retry">Try again</button>' +
            '</div>';
        var retryBtn = document.getElementById('homepage-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', function () {
                loadHomepageData();
            });
        }
    });
}

var HOMEPAGE_SECTION_IDS = ['about', 'work', 'projects', 'talks', 'contact'];

/** null | 'dock' | 'rail' — hysteresis avoids dock/rail flipping at one breakpoint while resizing */
var homepageNavLayoutMode = null;
var lastHomepageNavActiveId = null;

/** Widen past this → dock becomes rail (must be > DOCK_ENTER for hysteresis). */
var HOME_NAV_RAIL_ENTER = 1080;
/** Narrow past this → rail becomes dock; must match initial `w <= 1040` branch or mid-width stays stuck in rail. */
var HOME_NAV_DOCK_ENTER = 1040;

/** After in-page nav click, ignore spy until smooth scroll settles (spy line can sit in Contact below short Talks) */
var homepageNavSpySuppressUntil = 0;

/**
 * Hysteresis for near-bottom detection: avoids anchor line jumping 30% ↔ 72% when
 * distanceFromBottom hovers around one threshold (Contact icon flicker scrolling up).
 */
var homepageNavNearBottomLatch = false;

function homepageNavNow() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

/**
 * Scroll position when clicking Talks: VIEWPORT_TOP_* + OVERSHOOT, then cap at maxScroll − BOTTOM_RESERVE.
 */
function scrollTalksLeavingRoomForContact(talksEl, prefersReducedMotion) {
    if (!talksEl) return;

    var scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
    );
    var innerHeight = window.innerHeight;
    var maxScroll = Math.max(0, scrollHeight - innerHeight);
    if (maxScroll <= 0) {
        talksEl.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
        return;
    }

    var reserve = HOMEPAGE_TALKS_BOTTOM_RESERVE_PX;
    var maxAllowed = Math.max(0, maxScroll - reserve);

    var rect = talksEl.getBoundingClientRect();
    var docTop = rect.top + (window.scrollY || window.pageYOffset || 0);
    var fromTop =
        innerHeight * HOMEPAGE_TALKS_VIEWPORT_TOP_FRACTION + HOMEPAGE_TALKS_VIEWPORT_TOP_INSET_PX;
    var idealTop = docTop - fromTop + HOMEPAGE_TALKS_SCROLL_OVERSHOOT_PX;
    var targetTop = Math.min(idealTop, maxAllowed);
    targetTop = Math.max(0, targetTop);

    window.scrollTo({
        top: targetTop,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
}

function syncHomepageNavLayout() {
    var w = window.innerWidth;
    /* Mobile: same bottom floating icon nav as mid-width dock (no inline text nav). */
    if (w <= 768) {
        document.documentElement.classList.add('home-nav-layout-dock');
        document.documentElement.classList.remove('home-nav-layout-rail');
        homepageNavLayoutMode = 'dock';
        return;
    }
    if (homepageNavLayoutMode === null) {
        homepageNavLayoutMode = w <= 1040 ? 'dock' : 'rail';
    } else if (homepageNavLayoutMode === 'dock' && w >= HOME_NAV_RAIL_ENTER) {
        homepageNavLayoutMode = 'rail';
    } else if (homepageNavLayoutMode === 'rail' && w <= HOME_NAV_DOCK_ENTER) {
        homepageNavLayoutMode = 'dock';
    }
    if (homepageNavLayoutMode === 'dock') {
        document.documentElement.classList.add('home-nav-layout-dock');
        document.documentElement.classList.remove('home-nav-layout-rail');
    } else {
        document.documentElement.classList.remove('home-nav-layout-dock');
        document.documentElement.classList.add('home-nav-layout-rail');
    }
}

function setHomepageNavActive(container, sectionId) {
    lastHomepageNavActiveId = sectionId;
    var links = container.querySelectorAll('.homepage-nav .nav-link');
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var sid = link.getAttribute('data-section');
        if (sid === sectionId) {
            link.classList.add('nav-link--active');
            link.setAttribute('aria-current', 'location');
        } else {
            link.classList.remove('nav-link--active');
            link.removeAttribute('aria-current');
        }
    }
}

function updateHomepageNavFromScroll(container) {
    if (homepageNavNow() < homepageNavSpySuppressUntil) {
        return;
    }

    var scrollY = window.scrollY || window.pageYOffset || 0;
    var innerHeight = window.innerHeight;
    var scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
    );
    var maxScroll = Math.max(0, scrollHeight - innerHeight);
    var distanceFromBottom = scrollHeight - (scrollY + innerHeight);

    var nearBottomEnter = Math.max(96, innerHeight * 0.12);
    var nearBottomExit = Math.max(160, innerHeight * 0.2);
    var atMaxScroll = scrollY >= maxScroll - 8;
    if (homepageNavNearBottomLatch) {
        if (distanceFromBottom > nearBottomExit && !atMaxScroll) {
            homepageNavNearBottomLatch = false;
        }
    } else {
        if (distanceFromBottom <= nearBottomEnter || atMaxScroll) {
            homepageNavNearBottomLatch = true;
        }
    }
    var nearBottom = homepageNavNearBottomLatch;

    /* Short Contact at page foot: a high reading line lands inside it; upper page uses ~30% */
    var anchorViewportY = nearBottom ? innerHeight * 0.72 : innerHeight * 0.3;

    /* Above #work: reading line is still in header/about — don’t fall through to “work” (short about + gap). */
    var workElEarly = container.querySelector('#work');
    if (workElEarly && !nearBottom) {
        var workTopDoc = workElEarly.getBoundingClientRect().top + scrollY;
        var probeDoc = scrollY + anchorViewportY;
        if (probeDoc < workTopDoc) {
            if (lastHomepageNavActiveId !== 'about') {
                setHomepageNavActive(container, 'about');
            }
            return;
        }
    }

    function pickSectionAtAnchor(ay) {
        for (var i = HOMEPAGE_SECTION_IDS.length - 1; i >= 0; i--) {
            var sid = HOMEPAGE_SECTION_IDS[i];
            var el = container.querySelector('#' + sid);
            if (!el) continue;
            var r = el.getBoundingClientRect();
            if (r.top <= ay && r.bottom >= ay) {
                return sid;
            }
        }
        return null;
    }

    var activeId = HOMEPAGE_SECTION_IDS[0];
    var picked = pickSectionAtAnchor(anchorViewportY);

    if (picked) {
        activeId = picked;
    } else {
        var anchorY = scrollY + anchorViewportY;
        for (var k = 0; k < HOMEPAGE_SECTION_IDS.length; k++) {
            var el2 = container.querySelector('#' + HOMEPAGE_SECTION_IDS[k]);
            if (!el2) continue;
            var top = el2.getBoundingClientRect().top + scrollY;
            if (top <= anchorY) {
                activeId = HOMEPAGE_SECTION_IDS[k];
            }
        }
    }

    /* Still no box contained the line (gap / tiny Contact): try a lower probe, then pin Contact at max scroll */
    if (!picked) {
        var tryLower = pickSectionAtAnchor(innerHeight * 0.88);
        if (tryLower) {
            activeId = tryLower;
        } else if (nearBottom && scrollY >= maxScroll - 4) {
            var contactEl = container.querySelector('#contact');
            if (contactEl) {
                var cr = contactEl.getBoundingClientRect();
                if (cr.top < innerHeight && cr.bottom > 0) {
                    activeId = 'contact';
                }
            }
        }
    }

    if (activeId === lastHomepageNavActiveId) {
        return;
    }
    setHomepageNavActive(container, activeId);
}

function initHomepageSectionNav(container) {
    var nav = container.querySelector('.homepage-nav');
    if (!nav) return;

    var scrollTicking = false;
    function onScroll() {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(function() {
            updateHomepageNavFromScroll(container);
            scrollTicking = false;
        });
    }

    var resizeDebounceTimer = null;
    function onResize() {
        syncHomepageNavLayout();
        if (resizeDebounceTimer) {
            clearTimeout(resizeDebounceTimer);
        }
        resizeDebounceTimer = setTimeout(function() {
            resizeDebounceTimer = null;
            updateHomepageNavFromScroll(container);
        }, 150);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    syncHomepageNavLayout();
    updateHomepageNavFromScroll(container);
}

function setupComingSoonTooltips() {
    var comingSoonElements = document.querySelectorAll('.case-study-card.coming-soon');
    if (comingSoonElements.length === 0) {
        return;
    }
    
    var tooltip = null;
    
    // Create tooltip element
    function createTooltip() {
        if (tooltip) return tooltip;
        tooltip = document.createElement('div');
        tooltip.className = 'coming-soon-tooltip';
        tooltip.innerHTML = '<span class="material-icons">lock</span><span class="coming-soon-tooltip-text">Coming Soon!</span>';
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    // Initialize tooltip
    createTooltip();
    
    for (var i = 0; i < comingSoonElements.length; i++) {
        (function(element) {
            element.addEventListener('mouseenter', function(e) {
                if (tooltip) {
                    tooltip.classList.add('show');
                    // Position tooltip immediately on enter - use clientX/clientY for viewport-relative positioning
                    var offsetX = 20;
                    var offsetY = 20;
                    tooltip.style.left = (e.clientX + offsetX) + 'px';
                    tooltip.style.top = (e.clientY + offsetY) + 'px';
                }
            });
            
            element.addEventListener('mousemove', function(e) {
                if (!tooltip) return;
                // Position tooltip near cursor with offset - use clientX/clientY for viewport-relative positioning
                var offsetX = 20;
                var offsetY = 20;
                tooltip.style.left = (e.clientX + offsetX) + 'px';
                tooltip.style.top = (e.clientY + offsetY) + 'px';
            });
            
            element.addEventListener('mouseleave', function() {
                if (tooltip) {
                    tooltip.classList.remove('show');
                }
            });
        })(comingSoonElements[i]);
    }
}

// Load on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHomepageData);
} else {
    loadHomepageData();
}
