import { describe, expect, it } from 'vitest';
import {
	buildStyledPreviewLines,
	plainPreviewLines,
} from '@/lib/page/previewTextRuns';
import type { PreviewTextBaseStyle } from '@/types/page';

const base: PreviewTextBaseStyle = {
	fill: '#111111',
	fontSize: 18,
	fontFamily: 'Noto Sans',
	fontWeight: 'normal',
	fontStyle: 'normal',
	underline: false,
	linethrough: false,
	stroke: null,
	strokeWidth: 0,
};

describe('previewTextRuns', () => {
	it('keeps a single run when there are no character styles', () => {
		const lines = buildStyledPreviewLines(['Hello'], base, null);

		expect(lines).toEqual([
			[
				{
					...base,
					text: 'Hello',
				},
			],
		]);
		expect(plainPreviewLines(lines)).toEqual(['Hello']);
	});

	it('splits runs when character styles change mid-line', () => {
		const lines = buildStyledPreviewLines(['Abc'], base, {
			'0': {
				'0': { fontWeight: 'bold' },
				'1': { fontWeight: 'bold' },
				'2': { fill: '#ff0000' },
			},
		});

		expect(lines).toEqual([
			[
				{ ...base, text: 'Ab', fontWeight: 'bold' },
				{ ...base, text: 'c', fill: '#ff0000' },
			],
		]);
	});

	it('applies styles per visual line index', () => {
		const lines = buildStyledPreviewLines(['Hi', 'Yo'], base, {
			'1': {
				'0': { underline: true },
				'1': { underline: true },
			},
		});

		expect(lines[0]).toEqual([{ ...base, text: 'Hi' }]);
		expect(lines[1]).toEqual([
			{ ...base, text: 'Yo', underline: true },
		]);
	});

	it('keeps an empty-line placeholder run', () => {
		expect(buildStyledPreviewLines([''], base, null)).toEqual([
			[{ ...base, text: '' }],
		]);
	});

	it('inherits block stroke when char style omits it', () => {
		const lines = buildStyledPreviewLines(['X'], {
			...base,
			stroke: '#00ff00',
			strokeWidth: 2,
		}, {
			'0': {
				'0': { fontWeight: 'bold' },
			},
		});

		expect(lines[0]?.[0]).toMatchObject({
			text: 'X',
			fontWeight: 'bold',
			stroke: '#00ff00',
			strokeWidth: 2,
		});
	});
});
