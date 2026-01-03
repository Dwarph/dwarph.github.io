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
        `<img class="profile-image" src="${header.profileImage}" alt="Profile picture" loading="eager" width="170" height="170" />` :
        `<a href="${homeLink}" aria-label="Go to homepage"><img class="profile-image" src="${header.profileImage}" alt="Profile picture" loading="eager" width="170" height="170" /></a>`;
    
    // Always wrap name/role in a link for consistent structure
    // On homepage, link points to # (current page) so it's effectively non-functional
    var nameRoleLink = isHomepage ? '#' : homeLink;
    var nameRoleHtml = `<div class="header-name-role">
            <a href="${nameRoleLink}" class="header-link">
                <h1 class="header-name">${header.name}</h1>
                <p class="header-role">${header.role}</p>
            </a>
        </div>`;
    
    return `
        <header class="homepage-header" role="banner">
            <div class="header-background">
                <img src="${header.backgroundImage}" alt="Header background" loading="eager" width="1920" height="400" />
            </div>
            <div class="header-content">
                ${profileImageHtml}
                ${nameRoleHtml}
            </div>
        </header>
    `;
};

