/**
 * Shared label colors for both frontend and backend.
 * These are used instead of database-backed label colors.
 */
export const LABEL_COLORS = [
    { id: 'purple', name: 'Purple', colorHex: '#e362e3', position: 0 },
    { id: 'blue', name: 'Blue', colorHex: '#7a6ff0', position: 1 },
    { id: 'teal', name: 'Teal', colorHex: '#37c5ab', position: 2 },
    { id: 'pink', name: 'Pink', colorHex: '#aa62e3', position: 3 },
    { id: 'red', name: 'Red', colorHex: '#e8384f', position: 4 },
    { id: 'orange', name: 'Orange', colorHex: '#ff8c00', position: 5 },
    { id: 'green', name: 'Green', colorHex: '#28a745', position: 6 },
    { id: 'yellow', name: 'Yellow', colorHex: '#ffc107', position: 7 },
];

export type LabelColorId = typeof LABEL_COLORS[number]['id'];

export const getLabelColorById = (id: string) => {
    return LABEL_COLORS.find(color => color.id === id);
};
