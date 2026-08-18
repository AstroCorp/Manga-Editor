import { exportImageExtension } from '@/lib/editor/editorEnums';
import type { ExportImageFormat } from '@/types/editor';

const slugifyFilePart = (value: string): string => {
	return value.replace(/\s+/g, '-').toLowerCase();
};

export const exportTitleSlug = (title: string): string => {
	return slugifyFilePart(title);
};

/** Nombre de archivo seguro a partir del título del cómic y la página. */
export const exportFileBaseName = (
	title: string,
	pageName: string | undefined,
): string => {
	return `${exportTitleSlug(title)}-${slugifyFilePart(pageName ?? 'page')}`;
};

export const exportImageFilename = (
	title: string,
	pageName: string | undefined,
	format: ExportImageFormat,
): string => {
	return `${exportFileBaseName(title, pageName)}.${exportImageExtension(format)}`;
};

export const exportZipFilename = (
	title: string,
	format: ExportImageFormat,
): string => {
	return `${exportTitleSlug(title)}-${exportImageExtension(format)}.zip`;
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
