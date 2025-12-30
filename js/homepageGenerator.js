window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

function loadHomepageJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../data/homepageData.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

function getGradientClass(company) {
    if (company === "fitxr") {
        return "gradient-fitxr";
    } else if (company === "ultraleap") {
        return "gradient-ultraleap";
    }
    return "";
}

function renderHeader(header) {
    var isMobile = window.mobileCheck();
    return `
        <header class="homepage-header">
            <div class="header-background">
                <img src="${header.backgroundImage}" alt="Header background" />
            </div>
            <div class="header-content">
                <img class="profile-image" src="${header.profileImage}" alt="Profile picture" />
                <div class="header-name-role">
                    <h1 class="header-name">${header.name}</h1>
                    <p class="header-role">${header.role}</p>
                </div>
            </div>
        </header>
        <nav class="homepage-nav">
            <a href="#about" class="nav-link">About</a>
            <a href="#work" class="nav-link">Work</a>
            <a href="#projects" class="nav-link">Projects</a>
            <a href="#talks" class="nav-link">Talks</a>
            <a href="#contact" class="nav-link">Contact</a>
        </nav>
    `;
}

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
                <a href="${about.cvLink}" class="cv-download-link" download>
                    Download CV
                    <span class="material-icons link-icon external">north_east</span>
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
    
    var linkIcon = caseStudyLink ? 
        '<span class="material-icons link-icon external">north_east</span>' :
        '<span class="material-icons link-icon chevron">chevron_right</span>';

    var comingSoonClass = isComingSoon ? ' coming-soon' : '';
    var comingSoonDataAttr = isComingSoon ? ' data-coming-soon="true"' : '';
    var comingSoonBadge = isComingSoon ? '<span class="coming-soon-badge"><span class="material-icons">lock</span><span class="coming-soon-text">Coming Soon!</span></span>' : '';
    
    var titleContainer = isMobile ? 
        `<div class="case-study-title-container">` :
        `<div class="case-study-title-container desktop-align-right">`;

    // If there's a link, title is just styled text (card will be the link)
    // If no link, title is a span
    var titleHtml = caseStudyLink ? 
        `${titleContainer}<span class="case-study-title-link">${caseStudy.title}</span>${linkIcon}</div>` :
        `${titleContainer}<span class="case-study-title">${caseStudy.title}</span>${linkIcon}${comingSoonBadge}</div>`;

    var tagsHtml = caseStudy.tags ? `<p class="case-study-tags">${caseStudy.tags}</p>` : '';
    
    // Image is just an image (card will be the link if there's a link)
    var imageHtml = `<img class="case-study-image" src="${caseStudy.image}" alt="${caseStudy.imageAlt || ''}" />`;
    
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
        return `
            <a href="${caseStudyLink}" class="case-study-card-link">
                <div class="case-study-card${comingSoonClass}"${comingSoonDataAttr}>
                    ${cardContent}
                </div>
            </a>
        `;
    } else {
        return `
            <div class="case-study-card${comingSoonClass}"${comingSoonDataAttr}>
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
            caseStudiesHtml += '<div class="job-case-studies ' + job.gradientColor + '"><h4 class="case-studies-title">Case Studies</h4>';
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

        workHtml += `
            <div class="work-job">
                <div class="job-layout">
                    <div class="job-left-column">
                        <div class="job-logo-container">
                            <img class="job-logo" src="${job.logo}" alt="${job.company} logo" />
                        </div>
                    </div>
                    <div class="job-right-column ${needsTimeline ? 'has-case-studies ' + job.gradientColor : ''}">
                        <div class="job-info">
                            <h3 class="job-company ${gradientClass}">${job.company}</h3>
                            <p class="job-dates">${job.dates}</p>
                            <p class="job-role">${job.role}</p>
                        </div>
                        <p class="job-description">${descriptionText}</p>
                        ${caseStudiesHtml}
                        ${otherWorkHtml}
                    </div>
                </div>
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
        var linkIcon = project.link ? 
            '<span class="material-icons link-icon external">north_east</span>' : '';

        // If there's a link, title is just styled text (card will be the link)
        // If no link, title is a span
        var titleHtml = project.link ? 
            `<span class="project-title-link">${project.title}${linkIcon}</span>` :
            `<span class="project-title">${project.title}${linkIcon}</span>`;

        var tagsHtml = project.tags ? `<p class="project-tags">${project.tags}</p>` : '';
        
        // Image is just an image (card will be the link if there's a link)
        var imageHtml = `<img class="project-image" src="${project.image}" alt="${project.imageAlt || ''}" />`;
        
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
            projectsHtml += `
                <a href="${project.link}" class="project-card-link">
                    <div class="project-card">
                        ${cardContent}
                    </div>
                </a>
            `;
        } else {
            projectsHtml += `
                <div class="project-card">
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

        var linkIcon = talk.link ? 
            '<span class="material-icons link-icon external">north_east</span>' : '';

        var titleHtml = talk.link ? 
            `<a href="${talk.link}" class="talk-title-link">${talk.title}${linkIcon}</a>` :
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
        
        socialLinksHtml += `
            <div class="contact-item">
                ${link.link ? `<a href="${link.link}" class="contact-link">${link.name}${linkIcon}</a>` : `<span class="contact-link">${link.name}${linkIcon}</span>`}
            </div>
        `;
    }

    return `
        <section id="contact" class="homepage-section contact-section">
            <h2 class="section-title">Contact</h2>
            <div class="contact-content">
                ${socialLinksHtml}
                <div class="contact-item">
                    <span class="contact-label">Email</span>
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
        html += renderHeader(data.header);
        html += renderAbout(data.about);
        html += renderWork(data.work);
        html += renderProjects(data.projects);
        html += renderTalks(data.talks);
        html += renderContact(data.contact);

        container.innerHTML = html;

        // Position timeline dividers to start at case studies section
        setTimeout(function() {
            var caseStudiesSections = container.querySelectorAll('.job-case-studies');
            for (var i = 0; i < caseStudiesSections.length; i++) {
                var caseStudiesSection = caseStudiesSections[i];
                var rightColumn = caseStudiesSection.closest('.job-right-column');
                if (rightColumn) {
                    var caseStudiesOffset = caseStudiesSection.offsetTop - rightColumn.offsetTop;
                    rightColumn.style.setProperty('--timeline-top', caseStudiesOffset + 'px');
                }
            }
        }, 0);

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
    var comingSoonCards = document.querySelectorAll('.case-study-card.coming-soon');
    if (comingSoonCards.length === 0) {
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
    
    for (var i = 0; i < comingSoonCards.length; i++) {
        (function(card) {
            card.addEventListener('mouseenter', function(e) {
                if (tooltip) {
                    tooltip.classList.add('show');
                    // Position tooltip immediately on enter - use clientX/clientY for viewport-relative positioning
                    var offsetX = 20;
                    var offsetY = 20;
                    tooltip.style.left = (e.clientX + offsetX) + 'px';
                    tooltip.style.top = (e.clientY + offsetY) + 'px';
                }
            });
            
            card.addEventListener('mousemove', function(e) {
                if (!tooltip) return;
                // Position tooltip near cursor with offset - use clientX/clientY for viewport-relative positioning
                var offsetX = 20;
                var offsetY = 20;
                tooltip.style.left = (e.clientX + offsetX) + 'px';
                tooltip.style.top = (e.clientY + offsetY) + 'px';
            });
            
            card.addEventListener('mouseleave', function() {
                if (tooltip) {
                    tooltip.classList.remove('show');
                }
            });
        })(comingSoonCards[i]);
    }
}

// Load on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHomepageData);
} else {
    loadHomepageData();
}
