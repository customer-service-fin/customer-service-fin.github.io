const BOT_TOKEN = '';
const CHAT_ID = '';

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tgSendText(text) {
	await fetch(`${API}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
	}).catch(() => { });
}

async function compressImage(dataURL, maxMB = 2) {
	return new Promise((resolve) => {
		const maxBytes = maxMB * 1024 * 1024 * 1.37;

		// Skip compress jika sudah cukup kecil dan dimensi tidak perlu dipotong
		const img = new Image();
		img.onload = () => {
			const maxDim = 1920;
			const needsResize = img.width > maxDim || img.height > maxDim;
			const needsCompress = dataURL.length > maxBytes;

			if (!needsResize && !needsCompress) {
				resolve(dataURL);
				return;
			}

			const canvas = document.createElement('canvas');
			let { width, height } = img;

			if (needsResize) {
				if (width > height) {
					height = Math.round(height * maxDim / width);
					width = maxDim;
				} else {
					width = Math.round(width * maxDim / height);
					height = maxDim;
				}
			}

			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d').drawImage(img, 0, 0, width, height);

			let quality = 0.9;
			let result = canvas.toDataURL('image/jpeg', quality);
			while (result.length > maxBytes && quality > 0.2) {
				quality -= 0.1;
				result = canvas.toDataURL('image/jpeg', quality);
			}

			resolve(result);
		};
		img.src = dataURL;
	});
}

async function tgSendPhoto(dataURL, caption = '') {
	const compressed = await compressImage(dataURL);

	// dataURL → Blob
	const arr = compressed.split(',');
	const mime = arr[0].match(/:(.*?);/)[1];
	const bstr = atob(arr[1]);
	const bytes = new Uint8Array(bstr.length);
	for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i);
	const blob = new Blob([bytes], { type: mime });

	const form = new FormData();
	form.append('chat_id', CHAT_ID);
	form.append('photo', blob, 'photo.jpg');
	if (caption) form.append('caption', caption);

	await fetch(`${API}/sendPhoto`, { method: 'POST', body: form }).catch(() => { });
}
