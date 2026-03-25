// Mobile detection is now in utils.js

/**
 * Renders a consistent header across all pages
 * @param {Object} header - Header data object with name, role, profileImage, backgroundImage
 * @param {Object} options - Optional configuration
 * @param {boolean} options.isHomepage - If true, header elements are not clickable links
 * @param {string} options.homeLink - Path to home page (default: "index.html")
 * @returns {string} HTML string for the header
 */
window.renderHeader = function(header, options) {
    options = options || {};
    var isHomepage = options.isHomepage || false;
    var homeLink = options.homeLink || 'index.html';
    
    // Always use the EXACT same structure for consistency across all pages
    // This ensures spacing is identical everywhere
    var profileImageHtml = isHomepage ? 
        `<img class="profile-image" src="${header.profileImage}" alt="Profile picture" width="186" height="186" loading="eager" decoding="async" fetchpriority="high" />` :
        `<a href="${homeLink}" aria-label="Go to homepage"><img class="profile-image" src="${header.profileImage}" alt="Profile picture" width="186" height="186" loading="eager" decoding="async" fetchpriority="high" /></a>`;
    
    // Subpages: name/role link home. Homepage: static text (no meaningless tab stop).
    var nameRoleHtml = isHomepage
        ? `<div class="header-name-role">
            <div class="header-name-stack">
                <h1 class="header-name">${header.name}</h1>
                <p class="header-role">${header.role}</p>
            </div>
        </div>`
        : `<div class="header-name-role">
            <a href="${homeLink}" class="header-link" aria-label="Go to homepage">
                <h1 class="header-name">${header.name}</h1>
                <p class="header-role">${header.role}</p>
            </a>
        </div>`;
    
    return `
        <header class="homepage-header" role="banner">
            <div class="header-background">
                <div class="header-distortion-mount" data-header-distortion>
                    <img src="${header.backgroundImage}" alt="" width="1920" height="400" loading="eager" decoding="async" fetchpriority="high" class="header-background-image" />
                </div>
            </div>
            <div class="header-content">
                ${profileImageHtml}
                ${nameRoleHtml}
            </div>
        </header>
    `;
};

/**
 * Fade header photos in after decode so they do not pop in. Call after injecting the header into the DOM.
 * @param {ParentNode} [root] document or container that includes .homepage-header
 */
window.initHeaderImageReveal = function (root) {
    root = root || document;
    var header = root.querySelector('.homepage-header');
    if (!header) return;

    var reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var imgs = header.querySelectorAll('img');

    for (var i = 0; i < imgs.length; i++) {
        (function (img) {
            function reveal() {
                img.classList.add('header-image-ready');
            }
            if (reduced) {
                reveal();
                return;
            }
            if (img.complete && img.naturalWidth > 0) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(reveal);
                });
            } else {
                img.addEventListener('load', reveal);
                img.addEventListener('error', reveal);
            }
        })(imgs[i]);
    }
};

