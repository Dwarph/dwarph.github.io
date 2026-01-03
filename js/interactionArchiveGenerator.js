window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

function loadProjectsJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './data/projectsData.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

function loadHomepageJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './data/homepageData.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

// Header is now rendered using window.renderHeader from header.js

function renderProjectCard(project, isMobile, videoCache) {
    if (isMobile === undefined) {
        isMobile = window.mobileCheck();
    }

    // Determine image source
    var imageSrc = isMobile && project.imageMob ? 
        `images/projects/${project.imageMob}` : 
        `images/projects/${project.image}`;
    
    var imageExt = project.image.split('.').pop().toLowerCase();
    var isVideo = imageExt === 'mp4' && !isMobile;
    var videoId = 'video-' + project.title.replace(/\s+/g, '-').toLowerCase();
    
    // Render image or video
    var mediaHtml = '';
    if (isVideo) {
        // Always start with loading state - videos will be loaded sequentially
        mediaHtml = `
            <div class="archive-media-container archive-video-loading">
                <div class="archive-video-loading-spinner"></div>
                <video class="archive-project-image" id="${videoId}" autoplay muted loop playsinline preload="none">
                    <source src="${imageSrc}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>`;
    } else {
        mediaHtml = `
            <div class="archive-media-container">
                <img class="archive-project-image" src="${imageSrc}" alt="${project.imageAlt || project.title}" />
            </div>`;
    }

    // Render tags
    var tagsHtml = '';
    if (project.tags && project.tags.length > 0) {
        tagsHtml = `<p class="archive-project-tags">${project.tags.join(', ')}</p>`;
    }

    // Render links
    var linksHtml = '';
    if (project.links && project.links.length > 0) {
        linksHtml = '<div class="archive-project-links">';
        for (var i = 0; i < project.links.length; i++) {
            var link = project.links[i];
            var linkText = link.text;
            // Remove trailing comma if present
            if (linkText.endsWith(',')) {
                linkText = linkText.slice(0, -1);
            }
            linksHtml += `<a href="${link.link}" class="archive-project-link" target="_blank" rel="noopener noreferrer">${linkText}<span class="material-icons link-icon external">north_east</span></a>`;
        }
        linksHtml += '</div>';
    }

    return `
        <div class="archive-project-card" data-year="${project.year}" data-featured="${project.featured}">
            ${mediaHtml}
            <div class="archive-project-content">
                <h3 class="archive-project-title">${project.title}</h3>
                <p class="archive-project-year">${project.year}</p>
                ${tagsHtml}
                <p class="archive-project-description">${project.description}</p>
                ${linksHtml}
            </div>
        </div>
    `;
}

function loadVideosSequentially(projects, isMobile, onVideoLoaded) {
    var videoUrls = [];
    var videoToProjectMap = new Map();
    
    // Collect all video URLs and map them to their video elements
    for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var imageExt = project.image.split('.').pop().toLowerCase();
        if (imageExt === 'mp4' && !isMobile) {
            var imageSrc = `images/projects/${project.image}`;
            var videoId = 'video-' + project.title.replace(/\s+/g, '-').toLowerCase();
            if (!videoToProjectMap.has(imageSrc)) {
                videoUrls.push(imageSrc);
                videoToProjectMap.set(imageSrc, videoId);
            }
        }
    }
    
    if (videoUrls.length === 0) {
        return;
    }
    
    var currentIndex = 0;
    
    function loadNextVideo() {
        if (currentIndex >= videoUrls.length) {
            return; // All videos loaded
        }
        
        var videoSrc = videoUrls[currentIndex];
        var videoId = videoToProjectMap.get(videoSrc);
        var videoElement = document.getElementById(videoId);
        
        if (videoElement) {
            // Set up loading handlers
            function onVideoReady() {
                var container = videoElement.closest('.archive-media-container');
                if (container) {
                    container.classList.remove('archive-video-loading');
                }
                currentIndex++;
                // Load next video after a short delay to avoid overwhelming the network
                setTimeout(loadNextVideo, 100);
            }
            
            // Check if video is already loaded
            if (videoElement.readyState >= 3) {
                // Video already loaded
                onVideoReady();
                return;
            }
            
            // Start loading the video
            videoElement.preload = 'auto';
            videoElement.addEventListener('canplaythrough', onVideoReady, { once: true });
            videoElement.addEventListener('loadeddata', onVideoReady, { once: true });
            videoElement.addEventListener('error', onVideoReady, { once: true });
            
            // Trigger loading
            videoElement.load();
        } else {
            // Video element not found, skip to next
            currentIndex++;
            setTimeout(loadNextVideo, 100);
        }
    }
    
    // Start loading the first video
    setTimeout(loadNextVideo, 100);
}

function loadArchiveData() {
    // Load both homepage data (for header) and projects data
    loadHomepageJSON(function (homepageData) {
        loadProjectsJSON(function (data) {
            var container = document.getElementById('archive-container');
            if (!container) return;

            var isMobile = window.mobileCheck();
            var projects = data;
            var videoCache = null;
            
            // Build HTML with header
            var html = window.renderHeader(homepageData.header, { homeLink: 'index.html' });
            html += `
                <nav class="breadcrumb-nav">
                    <a href="index.html" class="breadcrumb-link">Home</a>
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-current">Interaction Archive</span>
                </nav>
                <section class="homepage-section archive-section">
                    <h1 class="section-title">Interaction Archive</h1>
                    <p class="archive-intro">These are interactions and applications I worked on over the five years I was at <span class="bio-gradient-ultraleap">Ultraleap</span>. We focused on novel spatial interactions that tried to prove the need and viability of high fidelity hand tracking as a primary input for XR devices.</p>
                    <hr class="archive-divider">
                    <div id="archive-projects-grid" class="archive-projects-grid"></div>
                </section>
            `;

            container.innerHTML = html;

            // Render all projects immediately
            renderProjects();

            // Render all projects
            function renderProjects() {
                var grid = document.getElementById('archive-projects-grid');
                if (!grid) return;

                grid.innerHTML = '';

                // Sort by year descending, then by featured status
                var sortedProjects = projects.slice().sort(function(a, b) {
                    if (b.year !== a.year) {
                        return b.year - a.year;
                    }
                    if (b.featured !== a.featured) {
                        return b.featured ? 1 : -1;
                    }
                    return 0;
                });

                if (sortedProjects.length === 0) {
                    grid.innerHTML = '<p class="archive-empty-message">No projects found.</p>';
                    return;
                }

                // Render all projects with videos in loading state
                for (var i = 0; i < sortedProjects.length; i++) {
                    grid.innerHTML += renderProjectCard(sortedProjects[i], isMobile, null);
                }

                // Start loading videos sequentially after rendering
                setTimeout(function() {
                    loadVideosSequentially(sortedProjects, isMobile);
                }, 0);
            }
        });
    });
}

// Load on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArchiveData);
} else {
    loadArchiveData();
}

