import { describe, expect, it } from 'vitest';
import {
	applyTextFontSize,
	applyTextStyle,
	collectTextColors,
	collectTextFormat,
	colorSwatchBackground,
	hasTextSelectionRange,
	normalizeFontSize,
	normalizeFontStyle,
	normalizeFontWeight,
	parseFontSizeInput,
	stylesFromFabric,
	stylesToFabric,
	toHexColor,
} from '@/lib/fabric/textStyles';

describe('textStyles', () => {
	it('toHexColor normalizes hex and rgb', () => {
		expect(toHexColor('#AbC')).toBe('#aabbcc');
		expect(toHexColor('#ff0000')).toBe('#ff0000');
		expect(toHexColor('rgb(255, 0, 128)')).toBe('#ff0080');
		expect(toHexColor('rgba(10, 20, 30, 0.5)')).toBe('#0a141e');
		expect(toHexColor('nope', '#111111')).toBe('#111111');
	});

	it('normalizes font size, weight and style', () => {
		expect(normalizeFontSize(18.6)).toBe(19);
		expect(normalizeFontSize(2)).toBe(8);
		expect(normalizeFontSize(999)).toBe(200);
		expect(normalizeFontSize('nope')).toBeNull();

		expect(parseFontSizeInput('36')).toBe(36);
		expect(parseFontSizeInput('3')).toBeNull();
		expect(parseFontSizeInput('')).toBeNull();

		expect(normalizeFontWeight('bold')).toBe('bold');
		expect(normalizeFontWeight('700')).toBe('bold');
		expect(normalizeFontWeight(700)).toBe('bold');
		expect(normalizeFontWeight(400)).toBe('normal');
		expect(normalizeFontWeight('nope')).toBeNull();

		expect(normalizeFontStyle('oblique')).toBe('italic');
		expect(normalizeFontStyle('normal')).toBe('normal');
		expect(normalizeFontStyle('nope')).toBeNull();
	});

	it('round-trips format styles between fabric and domain', () => {
		const fabricStyles = {
			0: {
				0: { fill: '#ff0000', fontWeight: 'bold' },
				1: {
					fill: '#00ff00',
					fontSize: 20,
					fontStyle: 'italic',
					underline: true,
				},
			},
			1: {
				0: { linethrough: true },
			},
		};
		const domain = stylesFromFabric(fabricStyles);

		expect(domain).toEqual({
			'0': {
				'0': { fill: '#ff0000', fontWeight: 'bold' },
				'1': {
					fill: '#00ff00',
					fontSize: 20,
					fontStyle: 'italic',
					underline: true,
				},
			},
			'1': {
				'0': { linethrough: true },
			},
		});

		expect(stylesToFabric(domain)).toEqual({
			0: {
				0: { fill: '#ff0000', fontWeight: 'bold' },
				1: {
					fill: '#00ff00',
					fontSize: 20,
					fontStyle: 'italic',
					underline: true,
				},
			},
			1: {
				0: { linethrough: true },
			},
		});
	});

	it('returns undefined for empty styles', () => {
		expect(stylesFromFabric({})).toBeUndefined();
		expect(stylesFromFabric({ 0: { 0: {} } })).toBeUndefined();
		expect(stylesToFabric(undefined)).toBeUndefined();
		expect(
			stylesToFabric({
				nope: { '0': { fill: '#ff0000' } },
				'0': {},
			}),
		).toBeUndefined();
	});

	it('collectTextColors uses the whole text when not editing', () => {
		const colors = collectTextColors({
			text: 'Hi',
			fill: '#112233',
			isEditing: false,
			getSelectionStyles: (start, end) => {
				expect(start).toBe(0);
				expect(end).toBe(2);

				return [{ fill: '#ff0000' }, { fill: '#00ff00' }];
			},
		});

		expect(colors).toEqual(['#ff0000', '#00ff00']);
	});

	it('collectTextFormat uses whole-text samples when not editing', () => {
		const flags = collectTextFormat({
			text: 'Hi',
			fontSize: 20,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: false,
			getSelectionStyles: () => {
				return [{ fontWeight: 'bold' }, { fontWeight: 'bold' }];
			},
		});

		expect(flags.bold).toBe(true);
		expect(flags.fontSize).toBe(20);
	});

	it('collectTextColors returns unique fills from a selection', () => {
		const textbox = {
			text: 'abcd',
			fill: '#000000',
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 4,
			getSelectionStyles: () => {
				return [
					{ fill: '#ff0000' },
					{ fill: '#00ff00' },
					{ fill: '#ff0000' },
					{},
				];
			},
		};

		expect(collectTextColors(textbox)).toEqual([
			'#ff0000',
			'#00ff00',
			'#000000',
		]);
	});

	it('collectTextFormat reports mixed and uniform values', () => {
		const mixed = {
			text: 'ab',
			fill: '#000000',
			fontSize: 24,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			getSelectionStyles: () => {
				return [
					{ fontWeight: 'bold', fontSize: 18 },
					{ fontWeight: 'normal', fontSize: 24, underline: true },
				];
			},
		};

		expect(collectTextFormat(mixed)).toEqual({
			bold: true,
			italic: false,
			underline: true,
			linethrough: false,
			fontSize: null,
			dominantFontSize: 18,
		});

		const uniform = {
			...mixed,
			getSelectionStyles: () => {
				return [
					{ fontWeight: 'bold', fontStyle: 'italic', fontSize: 20 },
					{ fontWeight: 'bold', fontStyle: 'italic', fontSize: 20 },
				];
			},
		};

		expect(collectTextFormat(uniform)).toEqual({
			bold: true,
			italic: true,
			underline: false,
			linethrough: false,
			fontSize: 20,
			dominantFontSize: 20,
		});
	});

	it('collectTextFormat picks the most frequent font size as dominant', () => {
		const textbox = {
			text: 'abc',
			fontSize: 24,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 3,
			getSelectionStyles: () => {
				return [{ fontSize: 18 }, { fontSize: 18 }, { fontSize: 30 }];
			},
		};

		expect(collectTextFormat(textbox)).toEqual({
			bold: false,
			italic: false,
			underline: false,
			linethrough: false,
			fontSize: null,
			dominantFontSize: 18,
		});
	});

	it('hasTextSelectionRange detects editing ranges', () => {
		expect(
			hasTextSelectionRange({
				isEditing: true,
				selectionStart: 1,
				selectionEnd: 4,
				getSelectionStyles: () => [],
			}),
		).toBe(true);

		expect(
			hasTextSelectionRange({
				isEditing: true,
				selectionStart: 2,
				selectionEnd: 2,
				getSelectionStyles: () => [],
			}),
		).toBe(false);
	});

	it('applyTextFontSize uses set(key, value) for whole text', () => {
		const calls: unknown[] = [];
		const textbox = {
			isEditing: false,
			text: 'abcd',
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				calls.push({ key, value });
			},
			removeStyle: (property: string) => {
				calls.push({ remove: property });
			},
			setSelectionStyles: () => undefined,
			initDimensions: () => {
				calls.push('dims');
			},
			setCoords: () => {
				calls.push('coords');
			},
		};

		applyTextFontSize(textbox, 36);

		expect(calls).toEqual([
			{ remove: 'fontSize' },
			{ key: 'fontSize', value: 36 },
			'dims',
			'coords',
		]);
	});

	it('applyTextFontSize targets the selection range', () => {
		const selectionCalls: unknown[] = [];
		const textbox = {
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			text: 'abcd',
			getSelectionStyles: () => [],
			set: () => undefined,
			removeStyle: () => undefined,
			setSelectionStyles: (
				styles: Record<string, unknown>,
				start?: number,
				end?: number,
			) => {
				selectionCalls.push({ styles, start, end });
			},
			initDimensions: () => undefined,
			setCoords: () => undefined,
		};

		applyTextFontSize(textbox, 42);

		expect(selectionCalls).toEqual([
			{ styles: { fontSize: 42 }, start: 0, end: 2 },
		]);
	});

	it('applyTextStyle targets selection or whole text', () => {
		const selectionCalls: unknown[] = [];
		const selected = {
			isEditing: true,
			selectionStart: 1,
			selectionEnd: 3,
			text: 'abcd',
			getSelectionStyles: () => [],
			setSelectionStyles: (
				styles: Record<string, unknown>,
				start?: number,
				end?: number,
			) => {
				selectionCalls.push({ styles, start, end });
			},
			set: () => undefined,
			removeStyle: () => undefined,
			initDimensions: () => undefined,
			setCoords: () => undefined,
		};

		applyTextStyle(selected, { fontWeight: 'bold' });
		expect(selectionCalls).toEqual([
			{ styles: { fontWeight: 'bold' }, start: 1, end: 3 },
		]);

		const wholeCalls: Array<Record<string, unknown>> = [];
		const removed: string[] = [];
		const layoutCalls: string[] = [];
		const whole = {
			isEditing: false,
			text: 'abcd',
			getSelectionStyles: () => [],
			set: (styles: Record<string, unknown>) => {
				wholeCalls.push(styles);
			},
			removeStyle: (property: string) => {
				removed.push(property);
			},
			setSelectionStyles: () => undefined,
			initDimensions: () => {
				layoutCalls.push('dims');
			},
			setCoords: () => {
				layoutCalls.push('coords');
			},
		};

		applyTextStyle(whole, { underline: true, fontSize: 18 });
		expect(wholeCalls).toEqual([{ underline: true, fontSize: 18 }]);
		expect(removed).toEqual(['underline', 'fontSize']);
		expect(layoutCalls).toEqual(['dims', 'coords']);
	});

	it('applyTextStyle does not refresh layout for fill-only changes', () => {
		const layoutCalls: string[] = [];
		const textbox = {
			isEditing: false,
			text: 'abcd',
			getSelectionStyles: () => [],
			set: () => undefined,
			removeStyle: () => undefined,
			setSelectionStyles: () => undefined,
			initDimensions: () => {
				layoutCalls.push('dims');
			},
			setCoords: () => {
				layoutCalls.push('coords');
			},
		};

		applyTextStyle(textbox, { fill: '#ff0000' });

		expect(layoutCalls).toEqual([]);
	});

	it('colorSwatchBackground builds a solid or conic fill', () => {
		expect(colorSwatchBackground([])).toBe('#000000');
		expect(colorSwatchBackground(['#112233'])).toBe('#112233');
		expect(colorSwatchBackground(['#ff0000', '#00ff00'])).toBe(
			'conic-gradient(#ff0000 0deg 180deg, #00ff00 180deg 360deg)',
		);
	});
});
