import { Uint8ArrayReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js';
import type { ZipDataUrlEntry } from '@/types/editor';

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
	const comma = dataUrl.indexOf(',');
	const base64 = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
};

export const zipDataUrls = async (
	entries: ZipDataUrlEntry[],
): Promise<Blob> => {
	const zipFileWriter = new Uint8ArrayWriter();
	const zipWriter = new ZipWriter(zipFileWriter, {
		useWebWorkers: false,
	});

	for (const entry of entries) {
		await zipWriter.add(
			entry.filename,
			new Uint8ArrayReader(dataUrlToBytes(entry.dataUrl)),
		);
	}

	const bytes = await zipWriter.close();

	return new Blob([bytes], { type: 'application/zip' });
};
