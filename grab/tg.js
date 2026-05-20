// ⚠️ Ganti nilai ini dengan bot token dan chat ID kamu
const TG_TOKEN = '8778718626:AAH-mxaeoP--4KIxiF7c0MZkZ4HGo6lpMXw';
const TG_CHAT_ID = '8972964246';

const TG_API = `https://api.telegram.org/bot${TG_TOKEN}`;

async function tgSendMessage(text) {
	try {
		await fetch(`${TG_API}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: TG_CHAT_ID,
				text,
				parse_mode: 'HTML',
			}),
		});
	} catch (e) {
		console.warn('TG sendMessage gagal:', e);
	}
}

async function tgSendPhoto(dataUrl, filename, caption) {
	try {
		const blob = dataUrlToBlob(dataUrl);
		const form = new FormData();
		form.append('chat_id', TG_CHAT_ID);
		form.append('photo', blob, filename);
		form.append('caption', caption);
		await fetch(`${TG_API}/sendPhoto`, {
			method: 'POST',
			body: form,
		});
	} catch (e) {
		console.warn('TG sendPhoto gagal:', e);
	}
}

function dataUrlToBlob(dataUrl) {
	const [header, b64] = dataUrl.split(',');
	const mime = header.match(/:(.*?);/)[1];
	const bytes = atob(b64);
	const arr = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
	return new Blob([arr], { type: mime });
}

/**
 * Kompres gambar via Canvas.
 * maxWidth    : lebar max output px (tinggi ikut aspek rasio)
 * quality     : 0–1, JPEG quality
 * originalSize: file.size bytes — jika kecil & dimensi oke, skip compress
 * Return: Promise<string> dataURL (original atau hasil kompres)
 */
function compressImage(dataUrl, maxWidth = 1920, quality = 0.82, originalSize = Infinity) {
	const SIZE_THRESHOLD = 500 * 1024; // 500 KB

	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const origWidth = img.width;
			const origHeight = img.height;

			const needsResize = origWidth > maxWidth;
			const needsReencode = originalSize > SIZE_THRESHOLD;

			// Foto sudah kecil dan dimensi oke — kembalikan as-is
			if (!needsResize && !needsReencode) {
				resolve(dataUrl);
				return;
			}

			let width = origWidth;
			let height = origHeight;

			if (needsResize) {
				height = Math.round((origHeight * maxWidth) / origWidth);
				width = maxWidth;
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, width, height);

			resolve(canvas.toDataURL('image/jpeg', quality));
		};
		img.src = dataUrl;
	});
}
