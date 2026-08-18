import { describe, expect, it } from 'vitest';
import { HISTORY_LABEL, historyLabelForPage } from '@/lib/history/historyEnums';

describe('historyLabelForPage', () => {
	it('appends the page name to the action', () => {
		expect(historyLabelForPage(HISTORY_LABEL.AddPanel, 'Cover')).toBe(
			'Add panel · Cover',
		);
	});

	it('keeps the action when the page name is empty', () => {
		expect(historyLabelForPage(HISTORY_LABEL.ReorderPages, '  ')).toBe(
			HISTORY_LABEL.ReorderPages,
		);
	});
});
