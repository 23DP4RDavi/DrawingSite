window.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('draw-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	let drawing = false;
	let lastX = 0, lastY = 0;

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
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 3;
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
