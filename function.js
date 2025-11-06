window.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('draw-canvas');
	const size = document.querySelector('#brush-range');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	let drawing = false;
	let lastX = 0, lastY = 0;
	let strokeColor = '#000';
	let strokeWidth = size ? Number(size.value) : 3;
	// track if canvas has any user stroke
	canvas.dataset.dirty = '';
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
		// mark that user has drawn something
		canvas.dataset.dirty = '1';
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

// Cards (create, edit, delete) + integrate drawing submission
window.addEventListener('DOMContentLoaded', function() {
	const STORAGE_KEY = 'cards-v1';
	const list = document.getElementById('card-list');
	if (!list) return; // only run where cards UI exists
	const createBtn = document.getElementById('create-card-btn');
	const form = document.getElementById('draw-form');
	const canvas = document.getElementById('draw-canvas');

	function load() {
		try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (_) { return []; }
	}
	function save() {
		try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); } catch (_) {}
	}
	function formatTime(ts) {
		try { return new Date(ts).toLocaleString(); } catch (_) { return String(ts); }
	}
	function escapeHtml(s) {
		return String(s).replace(/[&<>\"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
	}

	function render() {
		const empty = list.querySelector('.no-results');
		list.querySelectorAll('.card').forEach(n => n.remove());
		if (!cards.length) {
			if (empty) empty.hidden = false;
			return;
		}
		if (empty) empty.hidden = true;
		const frag = document.createDocumentFragment();
		cards.forEach(c => {
			const div = document.createElement('div');
			div.className = 'card';
			div.dataset.id = String(c.id);
			const media = c.image ? `<img src="${c.image}" alt="Zīmējums" style="width:100%;height:auto;border-radius:8px;margin-bottom:8px;"/>` : '';
			div.innerHTML = `
				${media}
				<h3 class="card-title">${escapeHtml(c.title || '')}</h3>
				<p class="card-text">${escapeHtml(c.text || '')}</p>
				<div class="card-actions" style="display:flex;gap:8px;margin-top:8px;">
					<button type="button" class="card-edit tool-btn">Labot</button>
					<button type="button" class="card-delete tool-btn">Dzēst</button>
				</div>`;
			frag.appendChild(div);
		});
		list.appendChild(frag);
	}

	function addCard(data) {
		const now = Date.now();
		const card = {
			id: now + Math.floor(Math.random() * 1000),
			title: data.title ?? 'Zīmējums',
			text: data.text ?? `Pievienots: ${formatTime(now)}`,
			image: data.image ?? null,
			createdAt: now
		};
		cards.unshift(card);
		save();
		render();
	}

	function getCanvasDataURLWhiteBG(cv) {
		if (!cv || !cv.width || !cv.height) return null;
		const off = document.createElement('canvas');
		off.width = cv.width;
		off.height = cv.height;
		const octx = off.getContext('2d');
		octx.fillStyle = '#ffffff';
		octx.fillRect(0, 0, off.width, off.height);
		octx.drawImage(cv, 0, 0);
		return off.toDataURL('image/png');
	}

	function clearCanvas(cv) {
		const ctx = cv?.getContext('2d');
		if (!cv || !ctx) return;
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, cv.width, cv.height);
		ctx.restore();
		cv.dataset.dirty = '';
	}

	// state
	let cards = load();
	render();

	// Create empty card
	if (createBtn) {
		createBtn.addEventListener('click', () => {
			const title = prompt('Virsraksts kartiņai:', 'Jauna kartiņa') ?? '';
			const text = prompt('Apraksts (nav obligāti):', '') ?? '';
			addCard({ title: title.trim() || 'Jauna kartiņa', text: text.trim() });
		});
	}

	// Send drawing -> card
	if (form && canvas) {
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			if (canvas.dataset.dirty !== '1') {
				alert('Uzzīmē kaut ko vispirms.');
				return;
			}
			const img = getCanvasDataURLWhiteBG(canvas);
			if (!img) return;
			addCard({ image: img, title: 'Zīmējums', text: `Pievienots: ${formatTime(Date.now())}` });
			clearCanvas(canvas);
		});
	}

	// Edit/Delete handlers (delegation)
	list.addEventListener('click', (e) => {
		const btn = e.target.closest('button');
		if (!btn) return;
		const cardEl = btn.closest('.card');
		if (!cardEl) return;
		const id = Number(cardEl.dataset.id);
		const idx = cards.findIndex(c => c.id === id);
		if (idx === -1) return;

		if (btn.classList.contains('card-delete')) {
			cards.splice(idx, 1);
			save();
			render();
			return;
		}

		if (btn.classList.contains('card-edit')) {
			const c = cards[idx];
			cardEl.innerHTML = `
				${c.image ? `<img src="${c.image}" alt="Zīmējums" style=\"width:100%;height:auto;border-radius:8px;margin-bottom:8px;\"/>` : ''}
				<label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Virsraksts</label>
				<input type="text" class="edit-title" value="${escapeHtml(c.title || '')}" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);" />
				<label style="display:block;font-size:12px;color:var(--text-secondary);margin:8px 0 4px;">Apraksts</label>
				<textarea class="edit-text" rows="3" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);">${escapeHtml(c.text || '')}</textarea>
				<div style="display:flex;gap:8px;margin-top:8px;">
					<button type="button" class="card-save send-under-size">Saglabāt</button>
					<button type="button" class="card-cancel tool-btn">Atcelt</button>
					<button type="button" class="card-delete tool-btn" style="margin-left:auto;">Dzēst</button>
				</div>`;
			return;
		}

		if (btn.classList.contains('card-cancel')) {
			render();
			return;
		}

		if (btn.classList.contains('card-save')) {
			const titleEl = cardEl.querySelector('.edit-title');
			const textEl = cardEl.querySelector('.edit-text');
			const newTitle = (titleEl?.value || '').trim();
			const newText = (textEl?.value || '').trim();
			cards[idx].title = newTitle || 'Kartiņa';
			cards[idx].text = newText;
			save();
			render();
			return;
		}
	});
});