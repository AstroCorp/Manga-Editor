/** dropEffect = move para reordenar listas por drag. */
export const setDragMoveEffect = (event: DragEvent) => {
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move';
	}
};
