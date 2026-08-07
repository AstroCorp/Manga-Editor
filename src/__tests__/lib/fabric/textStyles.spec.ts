import { describe, expect, it, vi } from 'vitest';
import {
	applyTextFontSize,
	applyTextLineHeight,
	applyTextStrokeWidth,
	applyTextStyle,
	collectTextColors,
	collectTextFormat,
	collectTextStrokeColors,
	colorSwatchBackground,
	fitTextboxWidthToContent,
	hasTextSelectionRange,
	normalizeFontSize,
	normalizeFontStyle,
	normalizeFontWeight,
	normalizeLineHeight,
	normalizeStrokeWidth,
	parseFontSizeInput,
	parseLineHeightInput,
	parseStrokeWidthInput,
	stylesFromFabric,
	stylesToFabric,
	textAlignIconName,
	toHexColor,
	toStrokeColor,
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

		expect(normalizeStrokeWidth(2.4)).toBe(2);
		expect(normalizeStrokeWidth(-1)).toBe(0);
		expect(normalizeStrokeWidth(99)).toBe(99);
		expect(normalizeStrokeWidth('nope')).toBeNull();

		expect(parseStrokeWidthInput('4')).toBe(4);
		expect(parseStrokeWidthInput('0')).toBe(0);
		expect(parseStrokeWidthInput('21')).toBe(21);
		expect(parseStrokeWidthInput('-1')).toBeNull();
		expect(toStrokeColor('')).toBeNull();
		expect(toStrokeColor('transparent')).toBeNull();
		expect(toStrokeColor('#AbC')).toBe('#aabbcc');

		expect(normalizeLineHeight(1.166)).toBe(1.17);
		expect(normalizeLineHeight(0.1)).toBe(0.5);
		expect(normalizeLineHeight(9)).toBe(5);
		expect(normalizeLineHeight('nope')).toBeNull();
		expect(parseLineHeightInput('1.5')).toBe(1.5);
		expect(parseLineHeightInput('0.2')).toBeNull();
		expect(parseLineHeightInput('')).toBeNull();
	});

	it('maps textAlign values to toolbar icons', () => {
		expect(textAlignIconName('left')).toBe('fluent:text-align-left-24-regular');
		expect(textAlignIconName('center')).toBe(
			'fluent:text-align-center-24-regular',
		);
		expect(textAlignIconName('right')).toBe('fluent:text-align-right-24-regular');
		expect(textAlignIconName('justify-left')).toBe(
			'fluent:text-align-justify-24-regular',
		);
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
			fontFamily: 'Roboto',
			dominantFontFamily: 'Roboto',
			strokeWidth: 0,
			dominantStrokeWidth: 0,
			lineHeight: 1.16,
			dominantLineHeight: 1.16,
			textAlign: 'left',
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
			fontFamily: 'Roboto',
			dominantFontFamily: 'Roboto',
			strokeWidth: 0,
			dominantStrokeWidth: 0,
			lineHeight: 1.16,
			dominantLineHeight: 1.16,
			textAlign: 'left',
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
			fontFamily: 'Roboto',
			dominantFontFamily: 'Roboto',
			strokeWidth: 0,
			dominantStrokeWidth: 0,
			lineHeight: 1.16,
			dominantLineHeight: 1.16,
			textAlign: 'left',
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
		let width = 200;
		const textbox = {
			isEditing: false,
			text: 'abcd',
			get width() {
				return width;
			},
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				calls.push({ key, value });

				if (key === 'width' && typeof value === 'number') {
					width = value;
				}
			},
			removeStyle: (property: string) => {
				calls.push({ remove: property });
			},
			setSelectionStyles: () => undefined,
			calcTextWidth: () => {
				return width >= 1_000_000 ? 120 : width;
			},
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
			{ key: 'width', value: 1_000_000 },
			'dims',
			{ key: 'width', value: 200 },
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
			width: 200,
			getSelectionStyles: () => [],
			set: () => undefined,
			removeStyle: () => undefined,
			calcTextWidth: () => 80,
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

	it('fitTextboxWidthToContent keeps width when content still fits', () => {
		const widths: number[] = [];
		let width = 200;
		const textbox = {
			text: 'Hello',
			get width() {
				return width;
			},
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				if (key === 'width' && typeof value === 'number') {
					width = value;
					widths.push(value);
				}
			},
			setSelectionStyles: () => undefined,
			removeStyle: () => undefined,
			calcTextWidth: () => {
				return width >= 1_000_000 ? 120 : width;
			},
			initDimensions: () => undefined,
			setCoords: () => undefined,
		};

		fitTextboxWidthToContent(textbox);

		expect(widths).toEqual([1_000_000, 200]);
	});

	it('fitTextboxWidthToContent expands width when content needs more space', () => {
		const widths: number[] = [];
		let width = 50;
		const textbox = {
			text: 'Hello',
			get width() {
				return width;
			},
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				if (key === 'width' && typeof value === 'number') {
					width = value;
					widths.push(value);
				}
			},
			setSelectionStyles: () => undefined,
			removeStyle: () => undefined,
			calcTextWidth: () => {
				return width >= 1_000_000 ? 144.2 : width;
			},
			initDimensions: () => undefined,
			setCoords: () => undefined,
		};

		fitTextboxWidthToContent(textbox);

		expect(widths).toEqual([1_000_000, 145]);
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
		let width = 200;
		const whole = {
			isEditing: false,
			text: 'abcd',
			get width() {
				return width;
			},
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				if (typeof key === 'object') {
					wholeCalls.push(key);

					return;
				}

				if (key === 'width' && typeof value === 'number') {
					width = value;
				}
			},
			removeStyle: (property: string) => {
				removed.push(property);
			},
			setSelectionStyles: () => undefined,
			calcTextWidth: () => {
				return width >= 1_000_000 ? 90 : width;
			},
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
		expect(layoutCalls).toEqual(['dims', 'dims', 'coords']);
		expect(width).toBe(200);
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

	it('collectTextStrokeColors returns unique stroke fills', () => {
		const colors = collectTextStrokeColors({
			text: 'Hi',
			stroke: '#112233',
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			getSelectionStyles: () => {
				return [{ stroke: '#ff0000' }, { stroke: '#00ff00' }];
			},
		});

		expect(colors).toEqual(['#ff0000', '#00ff00']);
	});

	it('collectTextFormat reports mixed stroke widths', () => {
		const flags = collectTextFormat({
			text: 'ab',
			strokeWidth: 1,
			fontSize: 24,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			getSelectionStyles: () => {
				return [{ strokeWidth: 1 }, { strokeWidth: 4 }];
			},
		});

		expect(flags.strokeWidth).toBeNull();
		expect(flags.dominantStrokeWidth).toBe(1);
	});

	it('applyTextStrokeWidth sets width and default stroke color when needed', () => {
		const removed: string[] = [];
		const sets: unknown[] = [];
		const textbox = {
			isEditing: false,
			text: 'ab',
			stroke: null,
			strokeWidth: 0,
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				sets.push(typeof key === 'object' ? key : { [key]: value });
			},
			removeStyle: (property: string) => {
				removed.push(property);
			},
			setSelectionStyles: () => undefined,
			initDimensions: () => undefined,
			setCoords: () => undefined,
		};

		applyTextStrokeWidth(textbox, 3);

		expect(removed).toEqual(['strokeWidth', 'stroke']);
		expect(sets).toEqual([
			{ stroke: '#000000', strokeWidth: 3 },
			{
				strokeLineJoin: 'round',
				strokeLineCap: 'round',
				paintFirst: 'stroke',
			},
		]);
	});

	it('applyTextLineHeight targets the selection range', () => {
		const selectionCalls: unknown[] = [];
		const sets: unknown[] = [];
		const textbox = {
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			text: 'ab',
			lineHeight: 1.16,
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				sets.push(typeof key === 'object' ? key : { [key]: value });
			},
			removeStyle: () => undefined,
			setSelectionStyles: (
				styles: Record<string, unknown>,
				start?: number,
				end?: number,
			) => {
				selectionCalls.push({ styles, start, end });
			},
			initDimensions: vi.fn(),
			setCoords: vi.fn(),
		};

		applyTextLineHeight(textbox, 1.8);

		expect(selectionCalls).toEqual([
			{ styles: { lineHeight: 1.8 }, start: 0, end: 2 },
		]);
		expect(sets).toEqual([]);
		expect(textbox.initDimensions).toHaveBeenCalled();
		expect(textbox.setCoords).toHaveBeenCalled();
	});

	it('applyTextLineHeight updates the whole text when nothing is selected', () => {
		const calls: unknown[] = [];
		const textbox = {
			isEditing: false,
			text: 'ab',
			lineHeight: 1.16,
			getSelectionStyles: () => [],
			set: (key: string | Record<string, unknown>, value?: unknown) => {
				calls.push(typeof key === 'object' ? key : { [key]: value });
			},
			removeStyle: (property: string) => {
				calls.push({ remove: property });
			},
			setSelectionStyles: () => undefined,
			initDimensions: vi.fn(),
			setCoords: vi.fn(),
		};

		applyTextLineHeight(textbox, 1.8);

		expect(calls).toEqual([
			{ remove: 'lineHeight' },
			{ lineHeight: 1.8 },
		]);
		expect(textbox.initDimensions).toHaveBeenCalled();
		expect(textbox.setCoords).toHaveBeenCalled();
	});

	it('collectTextFormat samples lineHeight from selection styles', () => {
		const mixed = collectTextFormat({
			text: 'ab',
			fontSize: 24,
			lineHeight: 1.16,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			getSelectionStyles: () => {
				return [{ lineHeight: 1.5 }, { lineHeight: 2 }];
			},
		});

		expect(mixed.lineHeight).toBeNull();
		expect(mixed.dominantLineHeight).toBe(1.5);

		const uniform = collectTextFormat({
			text: 'ab',
			fontSize: 24,
			lineHeight: 1.16,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			getSelectionStyles: () => {
				return [{ lineHeight: 2 }, { lineHeight: 2 }];
			},
		});

		expect(uniform.lineHeight).toBe(2);
		expect(uniform.dominantLineHeight).toBe(2);
	});

	it('collectTextFormat reads object lineHeight', () => {
		const flags = collectTextFormat({
			text: 'ab',
			fontSize: 24,
			lineHeight: 2,
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			isEditing: false,
			getSelectionStyles: () => {
				return [{}, {}];
			},
		});

		expect(flags.lineHeight).toBe(2);
		expect(flags.dominantLineHeight).toBe(2);
	});

	it('stylesFromFabric round-trips char lineHeight', () => {
		const domain = stylesFromFabric({
			0: { 0: { lineHeight: 1.8, fill: '#ff0000' } },
		});

		expect(domain).toEqual({
			0: { 0: { lineHeight: 1.8, fill: '#ff0000' } },
		});
		expect(stylesToFabric(domain)).toEqual({
			0: { 0: { lineHeight: 1.8, fill: '#ff0000' } },
		});
	});
});
