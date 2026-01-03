// Mobile detection is now in utils.js

function loadProjectsJSON(callback) {
    fetch('./data/projectsData.json')
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
            console.error('Error loading projects data:', error);
        });
}

function loadHomepageJSON(callback) {
    fetch('./data/homepageData.json')
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
                <img class="archive-project-image" src="${imageSrc}" alt="${project.imageAlt || project.title}" loading="lazy" width="400" height="300" />
            </div>`;
    }

    // Render tags
    var tagsHtml = '';
    if (project.tags && project.tags.length > 0) {
        tagsHtml = `<p class="archive-project-tags">${project.tags.join(', ')}</p>`;
    }

    // Render links
    var linksHtml = '';
    var firstLink = null;
    if (project.links && project.links.length > 0) {
        firstLink = project.links[0];
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

    // Wrap media in link if first link exists
    var wrappedMediaHtml = mediaHtml;
    if (firstLink) {
        wrappedMediaHtml = `<a href="${firstLink.link}" class="archive-media-link" target="_blank" rel="noopener noreferrer">${mediaHtml}</a>`;
    }

    return `
        <div class="archive-project-card" data-year="${project.year}" data-featured="${project.featured}">
            ${wrappedMediaHtml}
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
    // Use Intersection Observer for viewport-based video loading
    if (!('IntersectionObserver' in window)) {
        // Fallback for browsers without Intersection Observer
        console.warn('IntersectionObserver not supported, using sequential loading');
        loadVideosSequentiallyFallback(projects, isMobile);
        return;
    }
    
    var videoElements = [];
    
    // Collect all video elements
    for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var imageExt = project.image.split('.').pop().toLowerCase();
        if (imageExt === 'mp4' && !isMobile) {
            var videoId = 'video-' + project.title.replace(/\s+/g, '-').toLowerCase();
            var videoElement = document.getElementById(videoId);
            if (videoElement) {
                videoElements.push(videoElement);
            }
        }
    }
    
    if (videoElements.length === 0) {
        return;
    }
    
    // Create Intersection Observer to load videos when they enter viewport
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var videoElement = entry.target;
                var container = videoElement.closest('.archive-media-container');
                
                // Load the video
                function onVideoReady() {
                    if (container) {
                        container.classList.remove('archive-video-loading');
                    }
                    videoElement.removeEventListener('canplaythrough', onVideoReady);
                    videoElement.removeEventListener('loadeddata', onVideoReady);
                    videoElement.removeEventListener('error', onVideoError);
                }
                
                function onVideoError() {
                    console.warn('Failed to load video:', videoElement.src);
                    onVideoReady();
                }
                
                // Check if video is already loaded
                if (videoElement.readyState >= 3) {
                    onVideoReady();
                    observer.unobserve(videoElement);
                    return;
                }
                
                // Ensure source is set correctly
                var sourceElement = videoElement.querySelector('source');
                if (sourceElement) {
                    var videoSrc = sourceElement.src;
                    if (!videoSrc || videoSrc === window.location.href) {
                        // Source not set, get from project
                        var projectTitle = videoElement.id.replace('video-', '').replace(/-/g, ' ');
                        for (var j = 0; j < projects.length; j++) {
                            if (projects[j].title.toLowerCase() === projectTitle.toLowerCase()) {
                                sourceElement.src = 'images/projects/' + projects[j].image;
                                break;
                            }
                        }
                    }
                }
                
                // Start loading the video
                videoElement.preload = 'auto';
                videoElement.addEventListener('canplaythrough', onVideoReady, { once: true });
                videoElement.addEventListener('loadeddata', onVideoReady, { once: true });
                videoElement.addEventListener('error', onVideoError, { once: true });
                
                try {
                    videoElement.load();
                } catch (e) {
                    console.error('Error loading video:', e);
                    onVideoError();
                }
                
                // Stop observing this video
                observer.unobserve(videoElement);
            }
        });
    }, {
        rootMargin: '50px' // Start loading 50px before entering viewport
    });
    
    // Observe all video elements
    for (var k = 0; k < videoElements.length; k++) {
        observer.observe(videoElements[k]);
    }
}

// Fallback for browsers without Intersection Observer
function loadVideosSequentiallyFallback(projects, isMobile) {
    var videoUrls = [];
    var videoToProjectMap = new Map();
    
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
            return;
        }
        
        var videoSrc = videoUrls[currentIndex];
        var videoId = videoToProjectMap.get(videoSrc);
        var videoElement = document.getElementById(videoId);
        
        if (!videoElement) {
            currentIndex++;
            setTimeout(loadNextVideo, 100);
            return;
        }
        
        var container = videoElement.closest('.archive-media-container');
        
        function onVideoReady() {
            if (container) {
                container.classList.remove('archive-video-loading');
            }
            currentIndex++;
            setTimeout(loadNextVideo, 100);
        }
        
        function onVideoError() {
            console.warn('Failed to load video:', videoSrc);
            onVideoReady();
        }
        
        if (videoElement.readyState >= 3) {
            onVideoReady();
            return;
        }
        
        var sourceElement = videoElement.querySelector('source');
        if (sourceElement && sourceElement.src !== videoSrc) {
            sourceElement.src = videoSrc;
        } else if (!sourceElement) {
            var newSource = document.createElement('source');
            newSource.src = videoSrc;
            newSource.type = 'video/mp4';
            videoElement.appendChild(newSource);
        }
        
        videoElement.preload = 'auto';
        videoElement.addEventListener('canplaythrough', onVideoReady, { once: true });
        videoElement.addEventListener('loadeddata', onVideoReady, { once: true });
        videoElement.addEventListener('error', onVideoError, { once: true });
        
        try {
            videoElement.load();
        } catch (e) {
            console.error('Error loading video:', videoSrc, e);
            onVideoError();
        }
    }
    
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
                // Use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(function() {
                    setTimeout(function() {
                        loadVideosSequentially(sortedProjects, isMobile);
                    }, 100);
                });
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

