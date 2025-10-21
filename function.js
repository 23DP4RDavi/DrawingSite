window.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('draw-canvas');
	const size = document.querySelector('#brush-range');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	let drawing = false;
	let lastX = 0, lastY = 0;
	let strokeColor = '#000';
	let strokeWidth = size ? Number(size.value) : 3;
	if (size) {
		size.addEventListener('input', () => {
			strokeWidth = Number(size.value);
		});
	}
	let eraserMode = false;

	// wire up color picker if present
	const colorPicker = document.getElementById('color-picker');
	if (colorPicker) {
		strokeColor = colorPicker.value || strokeColor;
		colorPicker.addEventListener('input', () => {
			eraserMode = false;
			strokeColor = colorPicker.value;
		});
	}

	// preset swatches
	const swatches = document.querySelectorAll('.color-swatch');
	swatches.forEach(btn => {
		btn.addEventListener('click', () => {
			eraserMode = false;
			const color = btn.getAttribute('data-color');
			if (color) {
				strokeColor = color;
				if (colorPicker) colorPicker.value = color;
			}
		});
	});

	// eraser
	const eraserBtn = document.getElementById('eraser-btn');
	if (eraserBtn) {
		eraserBtn.addEventListener('click', () => {
			eraserMode = !eraserMode;
			eraserBtn.setAttribute('aria-pressed', String(eraserMode));
		});
	}

	function getPos(e) {
		if (e.touches) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top
			};
		} else {
			return {
				x: e.offsetX,
				y: e.offsetY
			};
		}
	}

	function startDraw(e) {
		drawing = true;
		const pos = getPos(e);
		lastX = pos.x;
		lastY = pos.y;
	}
	function draw(e) {
		if (!drawing) return;
		e.preventDefault();
		const pos = getPos(e);
	ctx.strokeStyle = eraserMode ? '#ffffff' : strokeColor;
	ctx.lineWidth = eraserMode ? 16 : strokeWidth;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		lastX = pos.x;
		lastY = pos.y;
	}
	function endDraw() {
		drawing = false;
	}

	// Mouse events
	canvas.addEventListener('mousedown', startDraw);
	canvas.addEventListener('mousemove', draw);
	canvas.addEventListener('mouseup', endDraw);
	canvas.addEventListener('mouseleave', endDraw);
	// Touch events
	canvas.addEventListener('touchstart', startDraw, { passive: false });
	canvas.addEventListener('touchmove', draw, { passive: false });
	canvas.addEventListener('touchend', endDraw);

	// High-DPI scaling for crisp lines
	function resizeCanvas() {
		// Logical CSS size
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.max(1, window.devicePixelRatio || 1);
		canvas.width = Math.floor(rect.width * dpr);
		canvas.height = Math.floor(rect.height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
});

// Search / Filter functionality
window.addEventListener('DOMContentLoaded', function() {
	const search = document.getElementById('card-search');
	const grid = document.getElementById('card-list');
	if (search && grid) {
		const cards = Array.from(grid.querySelectorAll('.card'));
		const empty = grid.querySelector('.no-results');
		const filter = () => {
			const q = search.value.toLowerCase();
			let shown = 0;
			cards.forEach(card => {
				const text = (card.querySelector('.card-title')?.textContent + ' ' + card.querySelector('.card-text')?.textContent).toLowerCase();
				const match = q.trim() === '' || text.includes(q);
				card.style.display = match ? '' : 'none';
				if (match) shown++;
			});
			if (empty) empty.hidden = shown !== 0;
		};
		search.addEventListener('input', filter);
		filter();
	}
});

// Contact form validation
window.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('contact-form');
	if (!form) return;
	const nameEl = form.querySelector('#name');
	const emailEl = form.querySelector('#email');
	const msgEl = form.querySelector('#message');
	const statusEl = form.querySelector('.form-message');

	const setError = (input, msg) => {
		input.classList.add('error');
		const small = input.closest('.form-row').querySelector('.error-text');
		if (small) small.textContent = msg || '';
	};
	const clearError = (input) => {
		input.classList.remove('error');
		const small = input.closest('.form-row').querySelector('.error-text');
		if (small) small.textContent = '';
	};
	const validEmail = (value) => {
		// Simple RFC5322-inspired pattern, good enough for client-side
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
	};

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		let ok = true;
		// Name
		if (!nameEl.value.trim()) { setError(nameEl, 'Name is required'); ok = false; } else { clearError(nameEl); }
		// Email
		if (!emailEl.value.trim()) { setError(emailEl, 'Email is required'); ok = false; }
		else if (!validEmail(emailEl.value.trim())) { setError(emailEl, 'Enter a valid email'); ok = false; }
		else { clearError(emailEl); }
		// Message
		if (!msgEl.value.trim()) { setError(msgEl, 'Message is required'); ok = false; } else { clearError(msgEl); }

		if (!ok) {
			statusEl.textContent = '';
			return;
		}
		// Success
		statusEl.textContent = 'Form submitted successfully!';
		form.reset();
	});
});

// Theme toggle functionality
function toggleTheme() {
	const html = document.documentElement;
	const themeToggle = document.querySelector('.theme-toggle');
	const currentTheme = html.getAttribute('data-theme');
	
	if (currentTheme === 'light') {
		html.setAttribute('data-theme', 'dark');
		themeToggle.textContent = '🌙';
		localStorage.setItem('theme', 'dark');
	} else {
		html.setAttribute('data-theme', 'light');
		themeToggle.textContent = '☀️';
		localStorage.setItem('theme', 'light');
	}
}

// Load saved theme on page load
window.addEventListener('DOMContentLoaded', function() {
	const savedTheme = localStorage.getItem('theme');
	const themeToggle = document.querySelector('.theme-toggle');
	const menuToggle = document.querySelector('.menu-toggle');
	const mainNav = document.getElementById('main-nav');
	
	if (savedTheme) {
		document.documentElement.setAttribute('data-theme', savedTheme);
		if (savedTheme === 'light') {
			themeToggle.textContent = '☀️';
		} else {
			themeToggle.textContent = '🌙';
		}
	}

	// Mobile menu toggle
	if (menuToggle && mainNav) {
		menuToggle.addEventListener('click', () => {
			const isOpen = mainNav.classList.toggle('open');
			menuToggle.setAttribute('aria-expanded', String(isOpen));
		});
	}
});
