import { exportImageExtension } from '@/lib/editor/editorEnums';
import type { ExportImageFormat } from '@/types/editor';

const slugifyFilePart = (value: string): string => {
	const slug = value.trim().replace(/\s+/g, '_').toLowerCase();

	return slug.length > 0 ? slug : 'untitled';
};

export const exportTitleSlug = (title: string): string => {
	return slugifyFilePart(title);
};

/** Cifras del total: 9 → "1", 10 → "01", 100 → "001". */
export const exportPageNumberLabel = (
	pageNumber: number,
	pageCount: number,
): string => {
	const count = Math.max(1, Math.trunc(pageCount));
	const digits = String(count).length;
	const number = Math.min(count, Math.max(1, Math.trunc(pageNumber)));

	return String(number).padStart(digits, '0');
};

/** `mi_proyecto_01` */
export const exportFileBaseName = (
	title: string,
	pageNumber: number,
	pageCount: number,
): string => {
	return `${exportTitleSlug(title)}_${exportPageNumberLabel(pageNumber, pageCount)}`;
};

export const exportImageFilename = (
	title: string,
	pageNumber: number,
	pageCount: number,
	format: ExportImageFormat,
): string => {
	return `${exportFileBaseName(title, pageNumber, pageCount)}.${exportImageExtension(format)}`;
};

export const exportZipFilename = (
	title: string,
	format: ExportImageFormat,
): string => {
	return `${exportTitleSlug(title)}_${exportImageExtension(format)}.zip`;
};

export const downloadDataUrl = (dataUrl: string, filename: string) => {
	const link = document.createElement('a');

	link.href = dataUrl;
	link.download = filename;
	link.rel = 'noopener';
	document.body.appendChild(link);
	link.click();
	link.remove();
};

export const downloadBlob = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob);

	downloadDataUrl(url, filename);
	URL.revokeObjectURL(url);
};

export const downloadText = (content: string, filename: string, mimeType = 'application/json') => {
	const blob = new Blob([content], { type: mimeType });

	downloadBlob(blob, filename);
};
