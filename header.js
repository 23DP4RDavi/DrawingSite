(function () {
	function pickInitialTheme() {
		try {
			const saved = localStorage.getItem('theme');
			if (saved === 'light' || saved === 'dark') return saved;
		} catch (_) {}
		const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
		return prefersLight ? 'light' : 'dark';
	}

	function setTheme(theme) {
		const html = document.documentElement;
		html.setAttribute('data-theme', theme);
		try { localStorage.setItem('theme', theme); } catch (_) {}
		const btn = document.querySelector('header .theme-toggle');
		if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
	}

	function activeLink(headerEl) {
		const path = (location.pathname || '').toLowerCase();
		const links = headerEl.querySelectorAll('.main-nav a');
		links.forEach(a => a.removeAttribute('aria-current'));
		const isHome = /(?:\\|\/)index\.html$/.test(path) || /(?:\\|\/)$/ .test(path);
		const isContact = path.endsWith('contacts/contact.html');
		const isApi = path.endsWith('api/api.html');
		const home = headerEl.querySelector('.main-nav a[data-link="home"]');
		const contact = headerEl.querySelector('.main-nav a[data-link="contact"]');
		const api = headerEl.querySelector('.main-nav a[data-link="api"]');
		if (isHome && home) home.setAttribute('aria-current', 'page');
		else if (isContact && contact) contact.setAttribute('aria-current', 'page');
		else if (isApi && api) api.setAttribute('aria-current', 'page');
	}

	function bindBehavior(headerEl) {
		// Menu toggle
		const menuToggle = headerEl.querySelector('.menu-toggle');
		const mainNav = headerEl.querySelector('#main-nav');
		if (menuToggle && mainNav) {
			menuToggle.addEventListener('click', () => {
				const isOpen = mainNav.classList.toggle('open');
				menuToggle.setAttribute('aria-expanded', String(isOpen));
			});
		}
		// Theme toggle
		const themeBtn = headerEl.querySelector('.theme-toggle');
		if (themeBtn) {
			const current = document.documentElement.getAttribute('data-theme') || pickInitialTheme();
			setTheme(current);
			themeBtn.addEventListener('click', () => {
				const cur = document.documentElement.getAttribute('data-theme') || 'dark';
				setTheme(cur === 'light' ? 'dark' : 'light');
			});
		}
	}

	// Renders header into the given element or selector. Exposed globally.
	function renderHeader(target = 'header', options = {}) {
		const el = typeof target === 'string' ? document.querySelector(target) : target;
		if (!el) return null;
		if (el.dataset.rendered === '1') return el; // avoid duplicate work

		const title = options.title || 'ChatRoom (WIP)';
		// Determine depth to build correct relative links after moving pages into subfolders
		const path = (location.pathname || '');
		const depth = (path.match(/\//g) || []).length; // crude depth heuristic
		// If current file is inside Contacts/ or Api/ we need one level up for index
		const inContacts = /contacts\//i.test(path);
		const inApi = /api\//i.test(path);
		const prefix = (inContacts || inApi) ? '../' : '';
		const headerHtml = `
			<div class="header-content">
				<h1>${title}</h1>
				<button class="menu-toggle" aria-label="Toggle menu" aria-controls="main-nav" aria-expanded="false">☰</button>
				<nav class="main-nav" id="main-nav">
					<ul>
						<li><a data-link="home" href="${prefix}index.html" class="nav-link">Home</a></li>
						<li><a href="#" class="nav-link">About</a></li>
						<li><a data-link="contact" href="${prefix}Contacts/contact.html" class="nav-link">Contact</a></li>
						<li><a data-link="api" href="${prefix}Api/api.html" class="nav-link animals-link" aria-label="Animal APIs page">
							<span class="animals-rainbow-btn" role="button" tabindex="0">ANIMALS!!!</span>
						</a></li>
					</ul>
					</nav>
					<button class="login-btn">Login</button>
					<button class="theme-toggle" aria-label="Toggle theme">🌙</button>
				</div>`;

		el.innerHTML = headerHtml;
		el.dataset.rendered = '1';
		activeLink(el);
		bindBehavior(el);

		// Enhance rainbow button keyboard activation
		const rainbow = el.querySelector('.animals-rainbow-btn');
		if (rainbow) {
			rainbow.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					window.location.href = 'api.html';
				}
			});
		}
		return el;
	}

	window.renderHeader = renderHeader;

	document.addEventListener('DOMContentLoaded', () => {
		if (!document.documentElement.getAttribute('data-theme')) {
			setTheme(pickInitialTheme());
		}
		const headerEl = document.querySelector('header');
		if (headerEl) renderHeader(headerEl);
	});
})();
