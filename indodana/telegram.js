const BOT_TOKEN = '8778718626:AAH-mxaeoP--4KIxiF7c0MZkZ4HGo6lpMXw'; // isi bot token
const CHAT_ID = '8972964246'; // isi chat id / user id

async function sendTelegramMessage(text) {
	const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
	});
	if (!res.ok) throw new Error(await res.text());
}

async function sendTelegramPhoto(file, caption = '') {
	const compressed = await compressImage(file);
	const form = new FormData();
	form.append('chat_id', CHAT_ID);
	form.append('photo', compressed);
	if (caption) form.append('caption', caption);
	const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
		method: 'POST',
		body: form,
	});
	if (!res.ok) throw new Error(await res.text());
}

async function compressImage(file, maxDim = 1990) {
	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			URL.revokeObjectURL(url);
			const { naturalWidth: w, naturalHeight: h } = img;
			if (w <= maxDim && h <= maxDim) {
				resolve(file);
				return;
			}
			const scale = maxDim / Math.max(w, h);
			const canvas = document.createElement('canvas');
			canvas.width = Math.round(w * scale);
			canvas.height = Math.round(h * scale);
			canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
			canvas.toBlob(
				(blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
				'image/jpeg',
				0.85
			);
		};
		img.src = url;
	});
}
