const TELEGRAM_BOT_TOKEN = '';
const TELEGRAM_CHAT_ID = '';

const TG_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const COMPRESS_MAX_SIZE = 1920;   // px — resize jika dimensi melebihi ini
const COMPRESS_QUALITY = 0.82;   // JPEG quality
const COMPRESS_SKIP_BYTE = 1.5 * 1024 * 1024; // skip jika file < 1.5 MB

// Compress image via Canvas. Skip jika file sudah kecil untuk jaga kualitas asli.
function compressImage(file) {
	// File kecil → kembalikan langsung, tidak re-encode
	if (file.size <= COMPRESS_SKIP_BYTE) return Promise.resolve(file);

	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);

			let { width, height } = img;

			// Hanya resize jika dimensi melebihi batas
			if (width > COMPRESS_MAX_SIZE || height > COMPRESS_MAX_SIZE) {
				if (width > height) {
					height = Math.round((height * COMPRESS_MAX_SIZE) / width);
					width = COMPRESS_MAX_SIZE;
				} else {
					width = Math.round((width * COMPRESS_MAX_SIZE) / height);
					height = COMPRESS_MAX_SIZE;
				}
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d').drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
				'image/jpeg',
				COMPRESS_QUALITY
			);
		};

		img.src = url;
	});
}

async function tgSendMessage(text) {
	const res = await fetch(`${TG_API}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: TELEGRAM_CHAT_ID,
			text,
			parse_mode: 'HTML',
		}),
	});
	return res.json();
}

async function tgSendPhoto(file, caption = '') {
	const form = new FormData();
	form.append('chat_id', TELEGRAM_CHAT_ID);
	form.append('photo', file);
	if (caption) form.append('caption', caption);
	form.append('parse_mode', 'HTML');

	const res = await fetch(`${TG_API}/sendPhoto`, {
		method: 'POST',
		body: form,
	});
	return res.json();
}
