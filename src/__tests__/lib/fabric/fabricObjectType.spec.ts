import { describe, expect, it } from 'vitest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';

describe('FABRIC_OBJECT_TYPE', () => {
	it('names the canvas object kinds', () => {
		expect(FABRIC_OBJECT_TYPE).toEqual({
			Panel: 'panel',
			PanelImage: 'panelImage',
			Text: 'text',
		});
	});
});
