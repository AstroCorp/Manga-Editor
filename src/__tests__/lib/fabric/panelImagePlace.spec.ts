import { describe, it, expect } from 'vitest';
import { isImageFile } from '@/lib/fabric/panelImagePlace';

describe('panelImagePlace', () => {
	it('isImageFile accepts image MIME types only', () => {
		expect(isImageFile(new File([], 'a.png', { type: 'image/png' }))).toBe(
			true,
		);
		expect(isImageFile(new File([], 'a.jpg', { type: 'image/jpeg' }))).toBe(
			true,
		);
		expect(
			isImageFile(new File([], 'a.txt', { type: 'text/plain' })),
		).toBe(false);
		expect(isImageFile(new File([], 'a.bin', { type: '' }))).toBe(false);
	});
});
