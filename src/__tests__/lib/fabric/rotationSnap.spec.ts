import { describe, expect, it, vi } from 'vitest';
import {
	rotationWithShiftSnap,
	snapRotationAngle,
} from '@/lib/fabric/rotationSnap';
import type { TPointerEvent, Transform } from 'fabric';

const PIVOT = { x: 50, y: 50 };

const pointAtDegrees = (degrees: number, radius = 40) => {
	const radians = (degrees * Math.PI) / 180;

	return {
		x: PIVOT.x + Math.cos(radians) * radius,
		y: PIVOT.y + Math.sin(radians) * radius,
	};
};

const createTarget = (angle = 0, lockRotation = false) => {
	return {
		angle,
		lockRotation,
		fire: vi.fn(),
		getPositionByOrigin: () => {
			return { ...PIVOT };
		},
		setPositionByOrigin: vi.fn(),
	};
};

const rotateFromRight = (
	target: ReturnType<typeof createTarget>,
	degrees: number,
	shiftKey: boolean,
) => {
	const start = pointAtDegrees(0);
	const next = pointAtDegrees(degrees);
	const transform = {
		target,
		ex: start.x,
		ey: start.y,
		theta: 0,
		originX: 'center',
		originY: 'center',
	} as unknown as Transform;

	return rotationWithShiftSnap(
		{ shiftKey } as TPointerEvent,
		transform,
		next.x,
		next.y,
	);
};

describe('snapRotationAngle', () => {
	it('snaps to 22.5 degree steps', () => {
		expect(snapRotationAngle(0)).toBe(0);
		expect(snapRotationAngle(11)).toBe(0);
		expect(snapRotationAngle(11.25)).toBe(22.5);
		expect(snapRotationAngle(20)).toBe(22.5);
		expect(snapRotationAngle(45)).toBe(45);
		expect(snapRotationAngle(348.75)).toBe(0);
		expect(snapRotationAngle(-11.3)).toBe(337.5);
	});

	it('returns 0 for invalid values', () => {
		expect(snapRotationAngle(Number.NaN)).toBe(0);
		expect(snapRotationAngle(Number.POSITIVE_INFINITY)).toBe(0);
	});
});

describe('rotationWithShiftSnap', () => {
	it('rotates freely without Shift', () => {
		const target = createTarget();

		expect(rotateFromRight(target, 20, false)).toBe(true);
		expect(target.angle).toBeCloseTo(20);
	});

	it('snaps to 22.5 degrees while Shift is held', () => {
		const target = createTarget();

		expect(rotateFromRight(target, 20, true)).toBe(true);
		expect(target.angle).toBe(22.5);
		expect(target.setPositionByOrigin).toHaveBeenCalled();
	});

	it('is a no-op when rotation is locked', () => {
		const target = createTarget(10, true);

		expect(rotateFromRight(target, 20, true)).toBe(false);
		expect(target.angle).toBe(10);
	});

	it('wraps negative free rotation into 0-360', () => {
		const target = createTarget();

		expect(rotateFromRight(target, -20, false)).toBe(true);
		expect(target.angle).toBeCloseTo(340);
	});

	it('does not report a change when Shift keeps the same snapped angle', () => {
		const target = createTarget(22.5);

		expect(rotateFromRight(target, 20, true)).toBe(false);
		expect(target.angle).toBe(22.5);
	});
});
