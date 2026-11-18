// A deliberately chunky pixel outline of India on a 1° grid, for the map on the Contact page.
// Each row is a latitude (north to south); spans are inclusive longitude ranges that are land.
export const MAP_TOP = 36; // latitude of the first row
export const MAP_LEFT = 68; // longitude of the first column

export const indiaRows: [number, [number, number][]][] = [
	[36, [[74, 76]]],
	[35, [[74, 78]]],
	[34, [[73, 79]]],
	[33, [[73, 78]]],
	[32, [[74, 78]]],
	[31, [[74, 78]]],
	[30, [[73, 80]]],
	[29, [[71, 80], [93, 96]]],
	[28, [[70, 80], [88, 88], [91, 96]]],
	[27, [[70, 84], [88, 88], [92, 96]]],
	[26, [[69, 88], [89, 95]]],
	[25, [[70, 88], [90, 94]]],
	[24, [[69, 88], [91, 94]]],
	[23, [[68, 88], [91, 93]]],
	[22, [[69, 88], [92, 93]]],
	[21, [[70, 87]]],
	[20, [[72, 86]]],
	[19, [[72, 85]]],
	[18, [[73, 84]]],
	[17, [[73, 83]]],
	[16, [[73, 82]]],
	[15, [[74, 81]]],
	[14, [[74, 80]]],
	[13, [[74, 80]]],
	[12, [[75, 80]]],
	[11, [[75, 79]]],
	[10, [[76, 79]]],
	[9, [[76, 78]]],
	[8, [[77, 77]]],
];
