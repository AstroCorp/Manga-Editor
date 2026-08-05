import { createId } from '@/lib/id';
import {
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
	clampPageSize,
} from '@/lib/page/pageLimits';
import { rotatePageMargins } from '@/lib/page/rotatePageMargins';
import { findUniqueName, isDuplicateName } from '@/lib/ui/uniqueName';
import { DEFAULT_LAYER_NAME, Layer } from '@/models/Layer';
import type { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';
import type { LayoutJSON } from '@/types/layouts';
import type {
	PageMargins,
	PageRotateDirection,
	PageValue,
	ResetLayerOptions,
} from '@/types/page';

export class Page {
	public readonly id: string;
	public name: string;
	public width: number;
	public height: number;
	public layers: Layer[];
	public activeLayerId: string;

	constructor(value: PageValue) {
		this.id = value.id;
		this.name = value.name;
		this.width = clampPageSize(value.width);
		this.height = clampPageSize(value.height);

		if (value.layers && value.layers.length > 0) {
			this.layers = value.layers;
			const activeExists = value.activeLayerId
				? this.layers.some((layer) => {
						return layer.id === value.activeLayerId;
					})
				: false;

			this.activeLayerId = activeExists
				? value.activeLayerId!
				: this.layers[0]!.id;
		} else {
			const layer = Layer.createDefault(1);

			layer.applyDefaultMargins(this.width, this.height);
			this.layers = [layer];
			this.activeLayerId = layer.id;
		}
	}

	/** Página vacía numerada; hereda tamaño de otra página si se indica. */
	static createBlank(index: number, width?: number, height?: number): Page {
		return new Page({
			id: createId(),
			name: `Page ${index}`,
			width: width ?? DEFAULT_PAGE_WIDTH,
			height: height ?? DEFAULT_PAGE_HEIGHT,
		});
	}

	get defaultLayer(): Layer {
		return this.layers[0]!;
	}

	getActiveLayer(): Layer {
		return (
			this.layers.find((layer) => {
				return layer.id === this.activeLayerId;
			}) ?? this.defaultLayer
		);
	}

	/** Shapes de capas visibles, de abajo a arriba (flatten preview/export). */
	getVisibleShapes(): Shape[] {
		return this.layers
			.filter((layer) => {
				return layer.visible;
			})
			.flatMap((layer) => {
				return layer.shapes;
			});
	}

	hasDrawing(): boolean {
		return this.layers.some((layer) => {
			return layer.shapes.length > 0;
		});
	}

	hasHiddenLayers(): boolean {
		return this.layers.some((layer) => {
			return !layer.visible;
		});
	}

	visibleLayerIds(): string[] {
		return this.layers
			.filter((layer) => {
				return layer.visible;
			})
			.map((layer) => {
				return layer.id;
			});
	}

	/**
	 * Deja solo la capa default (limpia shapes; config opcional).
	 * Usado al cambiar tamaño / rotar / clear página.
	 */
	resetToDefaultLayer(options?: ResetLayerOptions) {
		const defaultLayer = this.defaultLayer;

		defaultLayer.clearShapes();
		defaultLayer.visible = true;
		defaultLayer.name = DEFAULT_LAYER_NAME;

		if (options?.gridCols != null && options.gridRows != null) {
			defaultLayer.setGrid(options.gridCols, options.gridRows);
		}

		if (options?.strokeWidth != null) {
			defaultLayer.strokeWidth = options.strokeWidth;
		}

		if (options?.margins) {
			defaultLayer.setMargins(options.margins, this.width, this.height);
		} else {
			defaultLayer.setMargins(
				{
					marginTop: defaultLayer.marginTop,
					marginRight: defaultLayer.marginRight,
					marginBottom: defaultLayer.marginBottom,
					marginLeft: defaultLayer.marginLeft,
				},
				this.width,
				this.height,
			);
		}

		this.layers = [defaultLayer];
		this.activeLayerId = defaultLayer.id;
	}

	/** Al cambiar tamaño se resetea a la capa default (márgenes re-clamp). */
	setSize(width: number, height: number) {
		this.width = clampPageSize(width);
		this.height = clampPageSize(height);
		this.resetToDefaultLayer();
	}

	/**
	 * Portrait ↔ landscape: width↔height; grid/margins de default ciclan.
	 * Otras capas se eliminan.
	 */
	rotateOrientation(direction: PageRotateDirection) {
		const layer = this.defaultLayer;
		const nextMargins = rotatePageMargins(
			{
				marginTop: layer.marginTop,
				marginRight: layer.marginRight,
				marginBottom: layer.marginBottom,
				marginLeft: layer.marginLeft,
			},
			direction,
		);
		const nextWidth = this.height;
		const nextHeight = this.width;
		const nextCols = layer.gridRows;
		const nextRows = layer.gridCols;
		const strokeWidth = layer.strokeWidth;

		this.width = clampPageSize(nextWidth);
		this.height = clampPageSize(nextHeight);
		this.resetToDefaultLayer({
			gridCols: nextCols,
			gridRows: nextRows,
			margins: nextMargins,
			strokeWidth,
		});
	}

	selectLayer(layerId: string): boolean {
		const exists = this.layers.some((layer) => {
			return layer.id === layerId;
		});

		if (!exists) {
			return false;
		}

		this.activeLayerId = layerId;

		return true;
	}

	addLayer(): Layer {
		const taken = this.layers.map((layer) => {
			return layer.name;
		});
		const layer = Layer.createDefault(this.layers.length + 1);

		layer.name = findUniqueName(layer.name, taken);
		layer.applyDefaultMargins(this.width, this.height);
		this.layers = [...this.layers, layer];
		this.activeLayerId = layer.id;

		return layer;
	}

	removeLayer(layerId: string): boolean {
		if (this.layers.length <= 1) {
			return false;
		}

		const index = this.layers.findIndex((layer) => {
			return layer.id === layerId;
		});

		if (index === -1) {
			return false;
		}

		const next = this.layers.filter((layer) => {
			return layer.id !== layerId;
		});

		this.layers = next;

		if (this.activeLayerId === layerId) {
			this.activeLayerId = next[Math.min(index, next.length - 1)]!.id;
		}

		return true;
	}

	reorderLayers(fromIndex: number, toIndex: number) {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= this.layers.length ||
			toIndex >= this.layers.length
		) {
			return;
		}

		const next = this.layers.slice();
		const [layer] = next.splice(fromIndex, 1);

		if (!layer) {
			return;
		}

		next.splice(toIndex, 0, layer);
		this.layers = next;
	}

	renameLayer(layerId: string, name: string): boolean {
		const trimmed = name.trim();
		const layer = this.layers.find((item) => {
			return item.id === layerId;
		});

		if (!layer || !trimmed || trimmed === layer.name) {
			return false;
		}

		const taken = this.layers.map((item) => {
			return item.name;
		});

		if (isDuplicateName(trimmed, taken, layer.name)) {
			return false;
		}

		layer.name = trimmed;

		return true;
	}

	setLayerVisible(layerId: string, visible: boolean): boolean {
		const layer = this.layers.find((item) => {
			return item.id === layerId;
		});

		if (!layer) {
			return false;
		}

		layer.visible = visible;

		return true;
	}

	setActiveLayerGrid(cols: number, rows: number) {
		const layer = this.getActiveLayer();

		layer.setGrid(cols, rows);
		layer.clearShapes();
	}

	setActiveLayerMargins(margins: PageMargins) {
		const layer = this.getActiveLayer();

		layer.setMargins(margins, this.width, this.height);
		layer.clearShapes();
	}

	setActiveLayerStrokeWidth(width: number) {
		this.getActiveLayer().setStrokeWidth(width);
	}

	addShape(shape: Shape) {
		this.getActiveLayer().addShape(shape);
	}

	removeShape(shapeId: string): boolean {
		return this.getActiveLayer().removeShape(shapeId);
	}

	setShapeImage(shapeId: string, image: ShapeImage | null): boolean {
		return this.getActiveLayer().setShapeImage(shapeId, image);
	}

	/**
	 * Si el tamaño del layout difiere, resetea a default y aplica ahí.
	 * Si no, sustituye contenido de la capa activa.
	 */
	applyLayout(data: LayoutJSON) {
		const sizeChanged =
			clampPageSize(data.width) !== this.width ||
			clampPageSize(data.height) !== this.height;

		if (sizeChanged) {
			this.width = clampPageSize(data.width);
			this.height = clampPageSize(data.height);
			this.resetToDefaultLayer();
		}

		this.getActiveLayer().applyLayoutContent(
			{
				...data,
				shapes: data.shapes ?? [],
			},
			this.width,
			this.height,
		);
	}

	/** Layout exportable de la capa activa (+ tamaño de página). Sin imágenes. */
	toLayoutJSON(): LayoutJSON {
		const layer = this.getActiveLayer();

		return {
			width: this.width,
			height: this.height,
			...layer.toLayoutFields(),
		};
	}
}
