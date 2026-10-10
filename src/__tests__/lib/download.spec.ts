import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	downloadBlob,
	downloadDataUrl,
	downloadText,
	exportFileBaseName,
	exportImageFilename,
	exportPageNumberLabel,
	exportTitleSlug,
	exportZipFilename,
} from '@/lib/download';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';

describe('download helpers', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('export filenames use the project name and padded page numbers', () => {
		expect(exportTitleSlug('Mi Proyecto')).toBe('mi_proyecto');
		expect(exportTitleSlug('   ')).toBe('untitled');
		expect(exportPageNumberLabel(1, 9)).toBe('1');
		expect(exportPageNumberLabel(9, 9)).toBe('9');
		expect(exportPageNumberLabel(1, 10)).toBe('01');
		expect(exportPageNumberLabel(10, 10)).toBe('10');
		expect(exportPageNumberLabel(2, 100)).toBe('002');
		expect(exportFileBaseName('Mi Proyecto', 1, 12)).toBe('mi_proyecto_01');
		expect(
			exportImageFilename('Mi Proyecto', 1, 12, EXPORT_IMAGE_FORMAT.Png),
		).toBe('mi_proyecto_01.png');
		expect(
			exportImageFilename('Mi Proyecto', 4, 9, EXPORT_IMAGE_FORMAT.Jpeg),
		).toBe('mi_proyecto_4.jpg');
		expect(exportZipFilename('Mi Proyecto', EXPORT_IMAGE_FORMAT.Png)).toBe(
			'mi_proyecto_png.zip',
		);
	});

	it('downloadDataUrl clicks a temporary anchor', () => {
		const click = vi.fn();
		const remove = vi.fn();
		const link = {
			href: '',
			download: '',
			rel: '',
			click,
			remove,
		} as unknown as HTMLAnchorElement;

		vi.spyOn(document, 'createElement').mockReturnValue(link);
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			return node;
		});

		downloadDataUrl('data:image/png;base64,abc', 'page.png');

		expect(link.href).toBe('data:image/png;base64,abc');
		expect(link.download).toBe('page.png');
		expect(click).toHaveBeenCalledOnce();
		expect(remove).toHaveBeenCalledOnce();
	});

	it('downloadText creates a blob url and revokes it', () => {
		const createObjectURL = vi.fn(() => 'blob:mock');
		const revokeObjectURL = vi.fn();

		vi.stubGlobal('URL', {
			createObjectURL,
			revokeObjectURL,
		});

		const click = vi.fn();
		const remove = vi.fn();
		const link = {
			href: '',
			download: '',
			rel: '',
			click,
			remove,
		} as unknown as HTMLAnchorElement;

		vi.spyOn(document, 'createElement').mockReturnValue(link);
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			return node;
		});

		downloadText('{"ok":true}', 'layout.json');

		expect(createObjectURL).toHaveBeenCalledOnce();
		expect(link.download).toBe('layout.json');
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
	});

	it('downloadBlob creates a blob url and revokes it', () => {
		const createObjectURL = vi.fn(() => 'blob:zip');
		const revokeObjectURL = vi.fn();

		vi.stubGlobal('URL', {
			createObjectURL,
			revokeObjectURL,
		});

		const click = vi.fn();
		const remove = vi.fn();
		const link = {
			href: '',
			download: '',
			rel: '',
			click,
			remove,
		} as unknown as HTMLAnchorElement;

		vi.spyOn(document, 'createElement').mockReturnValue(link);
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			return node;
		});

		downloadBlob(new Blob(['zip']), 'untitled-png.zip');

		expect(createObjectURL).toHaveBeenCalledOnce();
		expect(link.download).toBe('untitled-png.zip');
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:zip');
	});
});
