// Mobile detection is now in utils.js

function loadHomepageJSON(callback) {
    fetch('../data/homepageData.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(function(data) {
            callback(data);
        })
        .catch(function(error) {
            console.error('Error loading homepage data:', error);
        });
}

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
        var linkIcon = '<span class="material-icons link-icon external">north_east</span>';
        
        var linkAriaLabel = `Visit ${link.name} profile`;
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
    loadHomepageJSON(function (data) {
        var container = document.getElementById('homepage-container');
        if (!container) return;

        var html = '';
        // Use shared header function with homepage option, then add navigation
        html += window.renderHeader(data.header, { isHomepage: true });
        html += `
            <nav class="homepage-nav" role="navigation" aria-label="Main navigation">
                <a href="#about" class="nav-link" aria-label="Navigate to About section">About</a>
                <a href="#work" class="nav-link" aria-label="Navigate to Work section">Work</a>
                <a href="#projects" class="nav-link" aria-label="Navigate to Projects section">Projects</a>
                <a href="#talks" class="nav-link" aria-label="Navigate to Talks section">Talks</a>
                <a href="#contact" class="nav-link" aria-label="Navigate to Contact section">Contact</a>
            </nav>
        `;
        html += renderAbout(data.about);
        html += renderWork(data.work);
        html += renderProjects(data.projects);
        html += renderTalks(data.talks);
        html += renderContact(data.contact);

        container.innerHTML = html;

        // Position timeline dividers to start at case studies section
        function updateTimelinePositions() {
            // Only find desktop case studies (direct children of .job-right-column, not in mobile containers)
            var rightColumns = container.querySelectorAll('.job-right-column.has-case-studies');
            for (var i = 0; i < rightColumns.length; i++) {
                var rightColumn = rightColumns[i];
                // Find the first case studies section that's a direct child (desktop layout)
                var caseStudiesSection = rightColumn.querySelector(':scope > .job-case-studies');
                if (caseStudiesSection) {
                    var caseStudiesRect = caseStudiesSection.getBoundingClientRect();
                    var rightColumnRect = rightColumn.getBoundingClientRect();
                    var caseStudiesOffset = caseStudiesRect.top - rightColumnRect.top;
                    rightColumn.style.setProperty('--timeline-top', caseStudiesOffset + 'px');
                }
            }
        }

        // Wait for layout to settle using requestAnimationFrame
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                updateTimelinePositions();
                
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

        // Handle smooth scrolling for navigation links
        var navLinks = document.querySelectorAll('.nav-link');
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].addEventListener('click', function(e) {
                e.preventDefault();
                var targetId = this.getAttribute('href').substring(1);
                var targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        // Handle "Coming Soon" tooltip for case studies without pages (desktop only)
        setTimeout(function() {
            if (!window.mobileCheck()) {
                setupComingSoonTooltips();
            }
        }, 0);
    });
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
