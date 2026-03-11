function fallbackMedia(node) {
	var link = document.createElement("a");
	link.className = "tweet-media-load-error tweet-url";

	var src = node.getAttribute("src");
	link.setAttribute("href", src);
	link.innerText = src;

	var toReplace = node.tagName === "VIDEO" ? node : node.parentNode;
	toReplace.parentNode.replaceChild(link, toReplace);
}

window.fallbackMedia = fallbackMedia;

// Theme toggle for archive
(function () {
	var BODY_CLASS_TWITTER = 'theme-twitter';
	var BODY_CLASS_PORTFOLIO = 'theme-portfolio';
	var STORAGE_KEY = 'twitterArchiveTheme';

	function applyTheme(theme) {
		var body = document.body;
		if (!body) return;

		if (theme === 'portfolio') {
			body.classList.add(BODY_CLASS_PORTFOLIO);
			body.classList.remove(BODY_CLASS_TWITTER);
		} else {
			body.classList.add(BODY_CLASS_TWITTER);
			body.classList.remove(BODY_CLASS_PORTFOLIO);
		}
	}

	function initTheme() {
		var stored = null;
		try {
			stored = window.localStorage.getItem(STORAGE_KEY);
		} catch (e) {}
		var theme = stored === 'portfolio' ? 'portfolio' : 'twitter';
		applyTheme(theme);
		return theme;
	}

	function updateToggleLabel(button, theme) {
		if (!button) return;
		button.textContent = theme === 'portfolio' ? 'Portfolio theme' : 'Twitter theme';
	}

	if (typeof window !== 'undefined') {
		document.addEventListener('DOMContentLoaded', function () {
			var currentTheme = initTheme();
			var toggles = document.querySelectorAll('#archive-theme-toggle');
			for (var i = 0; i < toggles.length; i++) {
				(function (btn) {
					updateToggleLabel(btn, currentTheme);
					btn.addEventListener('click', function () {
						currentTheme = currentTheme === 'portfolio' ? 'twitter' : 'portfolio';
						applyTheme(currentTheme);
						updateToggleLabel(btn, currentTheme);
						try {
							window.localStorage.setItem(STORAGE_KEY, currentTheme);
						} catch (e) {}
					});
				})(toggles[i]);
			}
		});
	}