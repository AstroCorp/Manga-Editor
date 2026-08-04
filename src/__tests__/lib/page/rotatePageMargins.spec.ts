import { describe, expect, it } from 'vitest';
import { rotatePageMargins } from '@/lib/page/rotatePageMargins';

describe('rotatePageMargins', () => {
	const margins = {
		marginTop: 10,
		marginRight: 20,
		marginBottom: 30,
		marginLeft: 40,
	};

	it('cycles top→right→bottom→left clockwise', () => {
		expect(rotatePageMargins(margins, 'clockwise')).toEqual({
			marginTop: 40,
			marginRight: 10,
			marginBottom: 20,
			marginLeft: 30,
		});
	});

	it('cycles the opposite way counterclockwise', () => {
		expect(rotatePageMargins(margins, 'counterclockwise')).toEqual({
			marginTop: 20,
			marginRight: 30,
			marginBottom: 40,
			marginLeft: 10,
		});
	});

	it('round-trips with opposite directions', () => {
		const clockwise = rotatePageMargins(margins, 'clockwise');

		expect(rotatePageMargins(clockwise, 'counterclockwise')).toEqual(margins);
	});
});
