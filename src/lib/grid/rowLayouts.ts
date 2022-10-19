type gridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ColumnLayout {
  xs: gridSize;
  sm?: gridSize;
  md?: gridSize;
  lg?: gridSize;
}

export class RowLayout {
  public readonly cols: Required<ColumnLayout>[];
  constructor(cols: ColumnLayout[]) {
    this.cols = cols.map((col) => {
      const xs = col.xs;
      const sm = col.sm || xs;
      const md = col.md || sm;
      const lg = col.lg || md;
      return { xs, sm, md, lg };
    });
  }
}

export const rowTemplates = {
  // Equal Widths
  "1": new RowLayout([{ xs: 12 }]),
  "1/2 + 1/2": new RowLayout([{ xs: 6 }, { xs: 6 }]),
  "1/3 + 1/3 + 1/3": new RowLayout([
    { xs: 4, md: 12 },
    { xs: 4, md: 12 },
    { xs: 4, md: 12 },
  ]),
  "1/4 + 1/4 + 1/4 + 1/4": new RowLayout([
    { xs: 3, md: 6 },
    { xs: 3, md: 6 },
    { xs: 3, md: 6 },
    { xs: 3, md: 6 },
  ]),
  // "Sidebar + Content"
  "1/3 + 2/3": new RowLayout([
    { xs: 4, md: 6 },
    { xs: 8, md: 6 },
  ]),
  "2/3 + 1/3": new RowLayout([
    { xs: 8, md: 6 },
    { xs: 4, md: 6 },
  ]),
  "1/4 + 3/4": new RowLayout([
    { xs: 3, md: 6 },
    { xs: 9, md: 6 },
  ]),
  "3/4 + 1/4": new RowLayout([
    { xs: 9, md: 6 },
    { xs: 3, md: 6 },
  ]),
  // "Sidebar + Content + Sidebar"
  "1/4 + 1/2 + 1/4": new RowLayout([
    { xs: 3, md: 12 },
    { xs: 6, md: 12 },
    { xs: 3, md: 12 },
  ]),
  // "Small + Small + Large"
  "1/4 + 1/4 + 1/2": new RowLayout([
    { xs: 3, md: 12 },
    { xs: 3, md: 12 },
    { xs: 6, md: 12 },
  ]),
  "1/2 + 1/4 + 1/4": new RowLayout([
    { xs: 6, md: 12 },
    { xs: 3, md: 12 },
    { xs: 3, md: 12 },
  ]),
};
