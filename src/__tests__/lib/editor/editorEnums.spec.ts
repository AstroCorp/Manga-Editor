import { describe, it, expect } from 'vitest';
import {
	EXPORT_IMAGE_FORMAT,
	SIDEBAR_TAB,
	exportImageExtension,
} from '@/lib/editor/editorEnums';

describe('editorEnums', () => {
	it('maps export formats to file extensions', () => {
		expect(exportImageExtension(EXPORT_IMAGE_FORMAT.Png)).toBe('png');
		expect(exportImageExtension(EXPORT_IMAGE_FORMAT.Jpeg)).toBe('jpg');
	});

	it('exposes the texts sidebar tab', () => {
		expect(SIDEBAR_TAB.Texts).toBe('texts');
	});
});
