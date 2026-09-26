export const MAX_HISTORY_MOVEMENTS = 100;

const HISTORY_LABEL_SEPARATOR = ' · ';

export const HISTORY_LABEL = {
	Start: 'Start',
	AddPanel: 'Add panel',
	DeletePanel: 'Delete panel',
	AddText: 'Add text',
	DeleteText: 'Delete text',
	EditText: 'Edit text',
	MoveText: 'Move text',
	RotateText: 'Rotate text',
	ScaleText: 'Scale text',
	FormatText: 'Format text',
	PlaceImage: 'Place image',
	RemoveImage: 'Remove image',
	MoveImage: 'Move image',
	RotateImage: 'Rotate image',
	ScaleImage: 'Scale image',
	FlipImage: 'Flip image',
	GrayscaleImage: 'Grayscale image',
	FillPanel: 'Fill panel',
	ChangePanelFill: 'Change panel fill',
	ClearPanelFill: 'Clear panel fill',
	AddPage: 'Add page',
	DeletePage: 'Delete page',
	RenamePage: 'Rename page',
	ReorderPages: 'Reorder pages',
	AddLayer: 'Add layer',
	DeleteLayer: 'Delete layer',
	RenameLayer: 'Rename layer',
	ReorderLayers: 'Reorder layers',
	HideLayer: 'Hide layer',
	ShowLayer: 'Show layer',
	ChangePageSize: 'Change page size',
	RotatePage: 'Rotate page',
	ChangePageBackground: 'Change page background',
	ChangeGrid: 'Change grid',
	ChangeMargins: 'Change margins',
	ChangeStroke: 'Change stroke',
	ChangeStrokeColor: 'Change stroke color',
	ApplyPageStroke: 'Apply stroke to page',
	ChangeEdgeWidth: 'Change edge width',
	ChangeEdgeColor: 'Change edge color',
	ApplyLayout: 'Apply layout',
	ClearPage: 'Clear page',
} as const;

/** `Add panel · Page 1`. Sin página si el nombre está vacío. */
export const historyLabelForPage = (
	action: string,
	pageName: string,
): string => {
	const name = pageName.trim();

	if (!name) {
		return action;
	}

	return `${action}${HISTORY_LABEL_SEPARATOR}${name}`;
};
