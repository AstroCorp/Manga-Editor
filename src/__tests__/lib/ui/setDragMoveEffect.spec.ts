import { describe, expect, it } from 'vitest';
import { setDragMoveEffect } from '@/lib/ui/setDragMoveEffect';

describe('setDragMoveEffect', () => {
	it('marks the drag as a move when a dataTransfer exists', () => {
		const dataTransfer = { dropEffect: 'none' } as DataTransfer;

		setDragMoveEffect({ dataTransfer } as DragEvent);
		expect(dataTransfer.dropEffect).toBe('move');

		setDragMoveEffect({ dataTransfer: null } as DragEvent);
	});
});
