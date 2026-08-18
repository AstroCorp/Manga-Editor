import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { exportPageToDataUrl } from '@/lib/fabric/exportPageToDataUrl';
import { Page } from '@/models/Page';
import { StaticCanvas } from 'fabric';

vi.mock('fabric', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fabric')>();

	return {
		...actual,
		StaticCanvas: vi.fn(),
	};
});

vi.mock('@/lib/fabric/shapeFabric', () => {
	return {
		hydrateCanvasFromPage: vi.fn(),
	};
});

vi.mock('@/lib/fabric/exportCanvasDataUrl', () => {
	return {
		exportCanvasDataUrl: vi.fn(() => 'data:image/png;base64,abc'),
	};
});

describe('exportPageToDataUrl', () => {
	beforeEach(() => {
		vi.mocked(StaticCanvas).mockClear();
		vi.mocked(StaticCanvas).mockImplementation(function MockStaticCanvas(
			this: { dispose: ReturnType<typeof vi.fn> },
		) {
			this.dispose = vi.fn(async () => {
				return true;
			});
		});
	});
	it('hydrates an offscreen canvas, exports it and disposes it', async () => {
		const { hydrateCanvasFromPage } = await import(
			'@/lib/fabric/shapeFabric'
		);
		const { exportCanvasDataUrl } = await import(
			'@/lib/fabric/exportCanvasDataUrl'
		);

		vi.mocked(hydrateCanvasFromPage).mockResolvedValue(undefined);

		const page = Page.createBlank(1);
		const result = await exportPageToDataUrl(
			page,
			EXPORT_IMAGE_FORMAT.Png,
		);
		const canvas = vi.mocked(StaticCanvas).mock.results[0]?.value as {
			dispose: ReturnType<typeof vi.fn>;
		};

		expect(result).toBe('data:image/png;base64,abc');
		expect(hydrateCanvasFromPage).toHaveBeenCalledExactlyOnceWith(
			canvas,
			page,
		);
		expect(exportCanvasDataUrl).toHaveBeenCalledExactlyOnceWith(
			canvas,
			EXPORT_IMAGE_FORMAT.Png,
		);
		expect(canvas.dispose).toHaveBeenCalledOnce();
	});

	it('disposes the canvas if hydration fails', async () => {
		const { hydrateCanvasFromPage } = await import(
			'@/lib/fabric/shapeFabric'
		);

		vi.mocked(hydrateCanvasFromPage).mockRejectedValue(
			new Error('hydrate failed'),
		);

		await expect(
			exportPageToDataUrl(Page.createBlank(1), EXPORT_IMAGE_FORMAT.Jpeg),
		).rejects.toThrow('hydrate failed');

		const canvas = vi.mocked(StaticCanvas).mock.results[0]?.value as {
			dispose: ReturnType<typeof vi.fn>;
		};

		expect(canvas.dispose).toHaveBeenCalledOnce();
	});
});
