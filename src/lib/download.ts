/** Nombre de archivo seguro a partir del título del cómic y la página. */
export const exportFileBaseName = (title: string, pageName: string | undefined): string => {
	return `${title}-${pageName ?? 'page'}`.replace(/\s+/g, '-').toLowerCase();
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

export const downloadText = (content: string, filename: string, mimeType = 'application/json') => {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	downloadDataUrl(url, filename);
	URL.revokeObjectURL(url);
};
