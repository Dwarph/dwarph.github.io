// Mobile detection is now in utils.js

function loadHomepageJSON(callback) {
    fetch('data/homepageData.json')
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

function loadCaseStudiesJSON(callback) {
    fetch('data/caseStudiesData.json')
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
            console.error('Error loading case studies data:', error);
        });
}

function loadMarkdownFile(key, callback) {
    fetch('data/casestudies/' + key + '.md')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(function(text) {
            callback(text);
        })
        .catch(function(error) {
            console.error('Error loading markdown file:', error);
        });
}

// Header is now rendered using window.renderHeader from header.js

function renderBreadcrumb(caseStudyTitle) {
    return `
        <nav class="breadcrumb-nav" role="navigation" aria-label="Breadcrumb">
            <a href="index.html" class="breadcrumb-link" aria-label="Go to homepage">Home</a>
            <span class="breadcrumb-separator" aria-hidden="true">></span>
            <span class="breadcrumb-current" aria-current="page">${caseStudyTitle}</span>
        </nav>
    `;
}

function renderCaseStudyContent(caseStudy, markdown) {
    var converter = new showdown.Converter();
    var htmlContent = converter.makeHtml(markdown);
    
    // Fix image paths in markdown - they're relative to data/casestudies/ so we need to adjust
    // Handle ./images/casestudies/ -> images/casestudies/
    htmlContent = htmlContent.replace(/src="\.\/images\/casestudies\//g, 'src="images/casestudies/');
    // Handle ./data/casestudies/images/ -> data/casestudies/images/
    htmlContent = htmlContent.replace(/src="\.\/data\/casestudies\/images\//g, 'src="data/casestudies/images/');
    // Handle href for image links too
    htmlContent = htmlContent.replace(/href="\.\/images\/casestudies\//g, 'href="images/casestudies/');
    htmlContent = htmlContent.replace(/href="\.\/data\/casestudies\/images\//g, 'href="data/casestudies/images/');
    
    // Add intro paragraph for Hyperion Showcase case study
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

function loadCaseStudyPage() {
    // Get the case study key from the URL (e.g., prosho.html -> prosho)
    var pathParts = window.location.pathname.split('/');
    var fileName = pathParts[pathParts.length - 1];
    var caseStudyKey = fileName.replace('.html', '');
    
    // Load homepage data for header
    loadHomepageJSON(function (homepageData) {
        var container = document.getElementById('case-study-container');
        if (!container) return;
        
        var html = '';
        html += window.renderHeader(homepageData.header, { homeLink: 'index.html' });
        
        // Load case studies data to find the matching case study
        loadCaseStudiesJSON(function (caseStudies) {
            var caseStudy = null;
            for (var i = 0; i < caseStudies.length; i++) {
                if (caseStudies[i].key === caseStudyKey) {
                    caseStudy = caseStudies[i];
                    break;
                }
            }
            
            if (!caseStudy) {
                container.innerHTML = html + '<section class="homepage-section"><p>Case study not found</p></section>';
                return;
            }
            
            // Set page title
            document.title = `Pip Turner - ${caseStudy.title}`;
            
            // Load markdown file
            loadMarkdownFile(caseStudyKey, function (markdown) {
                html += renderBreadcrumb(caseStudy.title);
                html += renderCaseStudyContent(caseStudy, markdown);
                container.innerHTML = html;
            });
        });
    });
}

// Load on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCaseStudyPage);
} else {
    loadCaseStudyPage();
}

