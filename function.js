window.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('draw-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	let drawing = false;
	let lastX = 0, lastY = 0;
	let strokeColor = '#ffffff';
	let strokeWidth = 3;
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
	// if erasing, draw with background color and a thicker line
	ctx.strokeStyle = eraserMode ? '#181a1b' : strokeColor;
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
	canvas.addEventListener('touchstart', startDraw);
	canvas.addEventListener('touchmove', draw);
	canvas.addEventListener('touchend', endDraw);
});
