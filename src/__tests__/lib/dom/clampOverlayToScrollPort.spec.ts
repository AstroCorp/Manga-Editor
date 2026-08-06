import { describe, expect, it } from 'vitest';
import { computeOverlayScrollClamp } from '@/lib/dom/clampOverlayToScrollPort';

describe('computeOverlayScrollClamp', () => {
	it('shifts left when the overlay overflows the right edge', () => {
		const shift = computeOverlayScrollClamp({
			anchorLeft: 380,
			anchorTop: 40,
			overlayWidth: 320,
			overlayHeight: 44,
			placement: 'above',
			stageRect: { left: 100, top: 50 },
			portRect: { left: 0, top: 0, right: 400, bottom: 300 },
			padding: 8,
		});

		// center = 100+380 = 480; maxCenter = 400-8-160 = 232 → x = 232-480
		expect(shift.x).toBe(232 - 480);
		expect(shift.y).toBe(0);
	});

	it('shifts right when the overlay overflows the left edge', () => {
		const shift = computeOverlayScrollClamp({
			anchorLeft: 20,
			anchorTop: 40,
			overlayWidth: 320,
			overlayHeight: 44,
			placement: 'above',
			stageRect: { left: 0, top: 50 },
			portRect: { left: 0, top: 0, right: 400, bottom: 300 },
			padding: 8,
		});

		// center = 20; minCenter = 8+160 = 168 → x = 148
		expect(shift.x).toBe(148);
	});

	it('pins to the left when wider than the scrollport', () => {
		const shift = computeOverlayScrollClamp({
			anchorLeft: 200,
			anchorTop: 40,
			overlayWidth: 500,
			overlayHeight: 44,
			placement: 'above',
			stageRect: { left: 0, top: 50 },
			portRect: { left: 0, top: 0, right: 400, bottom: 300 },
			padding: 8,
		});

		// portLeft + halfW - center = 8 + 250 - 200
		expect(shift.x).toBe(58);
	});

	it('pushes an above overlay down when it would leave the top', () => {
		const shift = computeOverlayScrollClamp({
			anchorLeft: 100,
			anchorTop: 10,
			overlayWidth: 100,
			overlayHeight: 40,
			placement: 'above',
			stageRect: { left: 0, top: 0 },
			portRect: { left: 0, top: 0, right: 400, bottom: 300 },
			padding: 8,
		});

		// top = 10-40 = -30; portTop = 8 → y = 38
		expect(shift.y).toBe(38);
		expect(shift.x).toBe(0);
	});
});
