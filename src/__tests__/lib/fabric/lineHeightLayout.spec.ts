import { FabricText } from 'fabric';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	resolveLineHeightMultiplier,
	setupPerCharLineHeight,
} from '@/lib/fabric/lineHeightLayout';

const createTextStub = (options: {
	lineHeight: number;
	lines: string[][];
	styles?: Record<number, Record<number, { lineHeight?: number }>>;
}) => {
	return {
		lineHeight: options.lineHeight,
		_textLines: options.lines,
		_getStyleDeclaration: (lineIndex: number, charIndex: number) => {
			return options.styles?.[lineIndex]?.[charIndex] ?? {};
		},
	} as unknown as FabricText;
};

describe('lineHeightLayout', () => {
	const originalGetContext = HTMLCanvasElement.prototype.getContext;

	beforeAll(() => {
		setupPerCharLineHeight();
	});

	beforeEach(() => {
		HTMLCanvasElement.prototype.getContext = vi.fn(() => {
			return {
				clearRect: vi.fn(),
				save: vi.fn(),
				restore: vi.fn(),
				beginPath: vi.fn(),
				moveTo: vi.fn(),
				lineTo: vi.fn(),
				stroke: vi.fn(),
				fill: vi.fn(),
				fillText: vi.fn(),
				strokeText: vi.fn(),
				measureText: vi.fn(() => {
					return { width: 10 };
				}),
				scale: vi.fn(),
				translate: vi.fn(),
				rotate: vi.fn(),
				rect: vi.fn(),
				fillRect: vi.fn(),
				clip: vi.fn(),
				arc: vi.fn(),
				closePath: vi.fn(),
				drawImage: vi.fn(),
				createLinearGradient: vi.fn(() => {
					return { addColorStop: vi.fn() };
				}),
				font: '',
				fillStyle: '',
				strokeStyle: '',
				lineWidth: 1,
				lineCap: '',
				lineJoin: '',
				textAlign: '',
				textBaseline: '',
				direction: '',
				globalAlpha: 1,
				canvas: document.createElement('canvas'),
			};
		}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	});

	afterEach(() => {
		HTMLCanvasElement.prototype.getContext = originalGetContext;
	});

	it('resolveLineHeightMultiplier uses object value without char styles', () => {
		const text = createTextStub({
			lineHeight: 1.5,
			lines: [
				['a', 'b'],
				['c', 'd'],
			],
		});

		expect(resolveLineHeightMultiplier(text, 0)).toBe(1.5);
		expect(resolveLineHeightMultiplier(text, 1)).toBe(1.5);
	});

	it('resolveLineHeightMultiplier prefers styled char lineHeight on a line', () => {
		const text = createTextStub({
			lineHeight: 1.16,
			lines: [['a', 'b', 'c', 'd']],
			styles: {
				0: {
					0: { lineHeight: 0.8 },
					1: { lineHeight: 0.8 },
				},
			},
		});

		expect(resolveLineHeightMultiplier(text, 0)).toBe(0.8);
	});

	it('getHeightOfLine respects per-char lineHeight after setup', () => {
		const plain = new FabricText('hello', {
			fontSize: 40,
			lineHeight: 1.16,
		});
		const tight = new FabricText('hello', {
			fontSize: 40,
			lineHeight: 1.16,
		});

		tight.setSelectionStyles({ lineHeight: 0.8 }, 0, 5);

		expect(tight.getHeightOfLine(0)).toBeLessThan(plain.getHeightOfLine(0));
		expect(tight.lineHeight).toBe(1.16);
	});
});
