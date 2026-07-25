import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	downloadDataUrl,
	downloadText,
	exportFileBaseName,
} from '@/lib/download';

describe('download helpers', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('exportFileBaseName slugifies title and page name', () => {
		expect(exportFileBaseName('My Manga', 'Page 1')).toBe(
			'my-manga-page-1',
		);
		expect(exportFileBaseName('Untitled', undefined)).toBe(
			'untitled-page',
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
});
