const TELEGRAM_BOT_TOKEN = '';
const TELEGRAM_CHAT_ID = '';

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const MAX_DIMENSION = 1920;
const COMPRESS_THRESHOLD_BYTES = 512 * 1024; // skip compress if < 512KB

async function tgSendText(text) {
	await fetch(`${TELEGRAM_API}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
	});
}

async function tgSendPhoto(file, caption = '') {
	const blob = await maybeCompress(file);
	const form = new FormData();
	form.append('chat_id', TELEGRAM_CHAT_ID);
	form.append('photo', blob, file.name || 'photo.jpg');
	if (caption) form.append('caption', caption);
	await fetch(`${TELEGRAM_API}/sendPhoto`, { method: 'POST', body: form });
}

async function maybeCompress(file) {
	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			URL.revokeObjectURL(url);
			const { naturalWidth: w, naturalHeight: h } = img;
			const needsResize = w > MAX_DIMENSION || h > MAX_DIMENSION;
			const needsCompress = file.size > COMPRESS_THRESHOLD_BYTES;

			if (!needsResize && !needsCompress) {
				resolve(file);
				return;
			}

			let tw = w, th = h;
			if (needsResize) {
				if (w >= h) { tw = MAX_DIMENSION; th = Math.round(h * MAX_DIMENSION / w); }
				else { th = MAX_DIMENSION; tw = Math.round(w * MAX_DIMENSION / h); }
			}

			const canvas = document.createElement('canvas');
			canvas.width = tw;
			canvas.height = th;
			canvas.getContext('2d').drawImage(img, 0, 0, tw, th);
			canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
		};
		img.src = url;
	});
}
