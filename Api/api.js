(() => {
	const grid = document.getElementById('api-grid');
	const refreshAllBtn = document.getElementById('refresh-all');
	const clearCacheBtn = document.getElementById('clear-cache');
	if (!grid) return;

	// Cache TTL (5 minutes)
	const CACHE_TTL = 5 * 60 * 1000;

	// Remove caches for deprecated tiles (duck, shibe, zoo)
	['animal-tile-duck','animal-tile-shibe','animal-tile-zoo'].forEach(k => { try { localStorage.removeItem(k); } catch(_){} });

	// Utility: safe fetch with timeout & structured result
	async function safeJson(url, options = {}) {
		const maxAttempts = (options.retries ?? 2) + 1; // retries = extra attempts after first
		let lastErr = null;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const controller = new AbortController();
			const to = setTimeout(() => controller.abort(), options.timeout || 8000);
			try {
				const res = await fetch(url, { ...options, signal: controller.signal });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				return { ok: true, data };
			} catch (err) {
				lastErr = err;
				// Exponential backoff (skip sleep after final attempt)
				if (attempt < maxAttempts - 1) {
					const delay = 300 * (2 ** attempt);
					await new Promise(r => setTimeout(r, delay));
				}
			} finally {
				clearTimeout(to);
			}
		}
		return { ok: false, error: String(lastErr) };
	}

	// Tile definitions (updated: replaced duck, shibe, zoo with raccoon, shiba, redpanda)
	const tiles = [
		{
			id: 'dog',
			title: 'Random Dog',
			fetcher: async () => {
				const r = await safeJson('https://dog.ceo/api/breeds/image/random');
				if (!r.ok) return { error: r.error };
				return { image: r.data.message, text: 'Dog CEO API' };
			}
		},
		{
			id: 'catfact',
			title: 'Cat Fact + Image',
			fetcher: async () => {
				const [fact, img] = await Promise.all([
					safeJson('https://catfact.ninja/fact'),
					safeJson('https://api.thecatapi.com/v1/images/search')
				]);
				if (!fact.ok) return { error: fact.error };
				const imgUrl = img.ok && Array.isArray(img.data) && img.data[0]?.url ? img.data[0].url : null;
				return { image: imgUrl, text: fact.data.fact };
			}
		},
		{
			id: 'kangaroo',
			title: 'Kangaroo Fact',
			fetcher: async () => {
				const r = await safeJson('https://some-random-api.com/animal/kangaroo');
				if (!r.ok) return { error: r.error };
				return { image: r.data.image, text: r.data.fact };
			}
		},
		{
			id: 'shiba',
			title: 'Shiba Dog',
			fetcher: async () => {
				const dog = await safeJson('https://api.thedogapi.com/v1/images/search');
				if (dog.ok && Array.isArray(dog.data) && dog.data[0]?.url) {
					return { image: dog.data[0].url, text: 'Random Dog (Shiba-ish)' };
				}
				const r = await safeJson('https://dog.ceo/api/breeds/image/random');
				if (r.ok) return { image: r.data.message, text: 'Dog CEO fallback' };
				return { error: dog.error || r.error || 'Dog fetch failed' };
			}
		},
		{
			id: 'redpanda',
			title: 'Red Panda Fact',
			fetcher: async () => {
				const r = await safeJson('https://some-random-api.com/animal/panda');
				if (!r.ok) return { error: r.error };
				return { image: r.data.image, text: 'Red Panda (panda fact proxy): ' + r.data.fact };
			}
		},
		{
			id: 'fox',
			title: 'Random Fox',
			fetcher: async () => {
				const r = await safeJson('https://randomfox.ca/floof/');
				if (!r.ok) return { error: r.error };
				return { image: r.data.image, text: 'Floofy fox' };
			}
		},
		{
			id: 'panda',
			title: 'Panda Fact',
			fetcher: async () => {
				const r = await safeJson('https://some-random-api.com/animal/panda');
				if (!r.ok) return { error: r.error };
				return { image: r.data.image, text: r.data.fact };
			}
		},
		{
			id: 'koala',
			title: 'Koala Fact',
			fetcher: async () => {
				const r = await safeJson('https://some-random-api.com/animal/koala');
				if (!r.ok) return { error: r.error };
				return { image: r.data.image, text: r.data.fact };
			}
		},
		{
			id: 'bird',
			title: 'Bird Fact',
			fetcher: async () => {
				const r = await safeJson('https://some-random-api.com/animal/bird');
				if (!r.ok) return { error: r.error };
				return { image: r.data.image, text: r.data.fact };
			}
		},
	];

	function createTile(def) {
		const div = document.createElement('div');
		div.className = 'api-tile';
		div.id = `tile-${def.id}`;
		div.innerHTML = `
			<div class="tile-header">
				<h3 class="tile-title">${def.title}</h3>
				<div class="tile-header-actions">
					<button type="button" class="refresh-btn" aria-label="Refresh ${def.title}">↻</button>
					<button type="button" class="copy-btn" aria-label="Copy ${def.title} text" title="Copy fact">📋</button>
				</div>
			</div>
			<div class="tile-body">
				<div class="tile-loading">Loading…</div>
			</div>
		`;
		const btn = div.querySelector('.refresh-btn');
		btn.addEventListener('click', () => loadTile(def, div));
		const copyBtn = div.querySelector('.copy-btn');
		copyBtn.addEventListener('click', () => copyFact(div));
		return div;
	}

	async function loadTile(def, el, useCache = true) {
		const body = el.querySelector('.tile-body');
		if (!body) return;
		body.innerHTML = '<div class="tile-loading">Loading…</div>';
		const cacheKey = `animal-tile-${def.id}`;
		if (useCache) {
			try {
				const cachedRaw = localStorage.getItem(cacheKey);
				if (cachedRaw) {
					let parsed;
					try { parsed = JSON.parse(cachedRaw); } catch { parsed = null; }
					if (parsed) {
						const isWrapped = parsed && typeof parsed.ts === 'number' && parsed.data;
						const payload = isWrapped ? parsed.data : parsed; // backward compatibility
						const age = isWrapped ? Date.now() - parsed.ts : CACHE_TTL + 1; // treat old format as expired
						body.innerHTML = cachedMarkup(payload, def) + (age > CACHE_TTL ? '<div class="stale-badge" title="Stale (auto refreshing)">Stale</div>' : '');
						attachImageFallbacks(body);
						// Always refresh if stale
						if (age > CACHE_TTL) {
							refreshTile(def, el, cacheKey);
							return;
						} else {
							// gentle background refresh after short delay
							setTimeout(() => refreshTile(def, el, cacheKey), 200);
							return;
						}
					}
				}
			} catch (_) {}
		}
		const result = await def.fetcher();
		if (result.error) {
			body.innerHTML = `<div class="tile-error" role="alert">Error: ${escapeHtml(result.error)} <button type="button" class="retry-btn">Retry</button></div>`;
			const retry = body.querySelector('.retry-btn');
			retry?.addEventListener('click', () => loadTile(def, el));
			return;
		}
		body.innerHTML = buildMarkup(result, def);
		attachImageFallbacks(body);
		try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result })); } catch (_) {}
	}

	async function refreshTile(def, el, cacheKey) {
		const result = await def.fetcher();
		const body = el.querySelector('.tile-body');
		if (!body) return;
		if (result.error) return; // keep cached data
		body.innerHTML = buildMarkup(result, def);
		attachImageFallbacks(body);
		try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result })); } catch (_) {}
		setStatus('Updated ' + def.title);
		setTimeout(() => setStatus(''), 1500);
	}

	function buildMarkup(result, def) {
		const imgHtml = result.image ? `<img class="animal-img" data-tile="${escapeAttr(def.id)}" src="${escapeAttr(result.image)}" alt="${escapeAttr(def.title)} image" loading="lazy"/>` : '';
		return `${imgHtml}<p class="tile-text" data-fact="${escapeAttr(result.text || '')}">${escapeHtml(result.text || '')}</p>`;
	}
	function cachedMarkup(result, def) {
		return buildMarkup(result, def) + '<div class="cached-badge" title="Cached">Cached</div>';
	}

	function attachImageFallbacks(scopeEl) {
		const imgs = scopeEl.querySelectorAll('img.animal-img');
		imgs.forEach(img => {
			img.addEventListener('error', () => {
				const tileId = img.getAttribute('data-tile');
				const fallback = selectFallback(tileId);
				if (fallback) {
					img.src = fallback;
					img.onerror = () => { // second failure -> replace with text
						const div = document.createElement('div');
						div.className = 'fallback-image';
						div.textContent = 'Image unavailable';
						img.replaceWith(div);
					};
				} else {
					const div = document.createElement('div');
					div.className = 'fallback-image';
					div.textContent = 'Image unavailable';
					img.replaceWith(div);
				}
			}, { once: true });
		});
	}

	function selectFallback(tileId) {
		switch (tileId) {
			case 'kangaroo': return 'https://placehold.co/300x200?text=Kangaroo';
			case 'redpanda': return 'https://placehold.co/300x200?text=Red+Panda';
			case 'shiba': return 'https://placehold.co/300x200?text=Dog';
			case 'fox': return 'https://placehold.co/300x200?text=Fox';
			case 'panda': return 'https://placehold.co/300x200?text=Panda';
			case 'koala': return 'https://placehold.co/300x200?text=Koala';
			case 'bird': return 'https://placehold.co/300x200?text=Bird';
			case 'dog': return 'https://placehold.co/300x200?text=Dog';
			case 'catfact': return 'https://placehold.co/300x200?text=Cat';
			default: return 'https://placehold.co/300x200?text=Animal';
		}
	}

	function copyFact(tileEl) {
		const factEl = tileEl.querySelector('.tile-text');
		if (!factEl) return;
		const text = factEl.getAttribute('data-fact') || factEl.textContent || '';
		navigator.clipboard.writeText(text).then(() => {
			setStatus('Copied fact');
			setTimeout(() => setStatus(''), 1200);
		}).catch(() => {
			setStatus('Copy failed');
			setTimeout(() => setStatus(''), 1200);
		});
	}

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
	}
	function escapeAttr(s) {
		return escapeHtml(s).replace(/"/g, '&quot;');
	}

	// Status helper (bug fix: previously referenced without definition)
	function setStatus(msg = '', opts = {}) {
		const el = document.getElementById('api-status');
		if (!el) return; // silently ignore if missing
		el.textContent = msg;
		el.className = 'api-status' + (opts.type ? ' status-' + opts.type : '');
		if (msg) el.setAttribute('aria-live', 'polite');
	}

	// Initial render all tiles then load sequentially to avoid hammering simultaneously (or could Promise.all)
	const frag = document.createDocumentFragment();
	tiles.forEach(t => frag.appendChild(createTile(t)));
	grid.appendChild(frag);
	attachImageFallbacks(grid);

	// Progressive loading with small stagger using cache first
	(async () => {
		for (let i = 0; i < tiles.length; i++) {
			const def = tiles[i];
			const el = document.getElementById(`tile-${def.id}`);
			if (el) loadTile(def, el, true);
			await new Promise(r => setTimeout(r, 120));
		}
	})();

	if (refreshAllBtn) {
		refreshAllBtn.addEventListener('click', async () => {
			if (refreshAllBtn.disabled) return;
			refreshAllBtn.disabled = true;
			setStatus('Refreshing all…');
			for (const def of tiles) {
				const el = document.getElementById(`tile-${def.id}`);
				if (el) await loadTile(def, el, false);
				await new Promise(r => setTimeout(r, 80)); // mild stagger
			}
			setStatus('All refreshed');
			setTimeout(() => setStatus(''), 1500);
			refreshAllBtn.disabled = false;
		});
	}

	if (clearCacheBtn) {
		clearCacheBtn.addEventListener('click', () => {
			tiles.forEach(def => {
				try { localStorage.removeItem(`animal-tile-${def.id}`); } catch (_) {}
			});
			setStatus('Cache cleared');
			setTimeout(() => setStatus(''), 1500);
		});
	}
})();

