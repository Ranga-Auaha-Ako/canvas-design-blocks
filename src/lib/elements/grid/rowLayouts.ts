export type gridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ColumnLayout {
  xs: gridSize;
  sm?: gridSize;
  md?: gridSize;
  lg?: gridSize;
}

export class RowLayout {
  public readonly cols: Required<ColumnLayout>[];
  public get id(): string {
    return this.cols
      .map((col) => `${col.xs}/${col.sm}/${col.md}/${col.lg}`)
      .join("-");
  }

  constructor(cols: ColumnLayout[]) {
    this.cols = cols.map((col) => {
      //== (uncomment the next 3 lines to fully rely on rowTemplates)==
      // const xs = col.xs;
      // const sm = col.sm || xs;
      // const md = col.md || sm;

      //== (Overwrites rowTemplates on xs, sm, md)==
      // Force xs, sm to always be 12 (100% width, i.e. col stacking in small screen) ===========
      const xs = 12;
      const sm = 12;
      const md = col.md || col.sm || col.xs || 12;
      //==============================================
      const lg = col.lg || md;
      return { xs, sm, md, lg };
    });
  }
  public static getLayout(columnNodes: Element[]): RowLayout {
    const cols = columnNodes.map((node) => {
      const sizes = ["xs", "sm", "md", "lg"];
      return sizes.reduce((acc, size) => {
        const className = Array.from(node.classList).find((c) =>
          c.startsWith(`col-${size}-`)
        );
        if (size === "xs" && !className)
          throw new Error("Can't determine col size");
        if (className)
          acc[size as keyof ColumnLayout] = parseInt(
            className.split("-")[2]
          ) as gridSize;
        return acc;
      }, {} as ColumnLayout);
    });
    return new RowLayout(cols);
  }
}

export const rowTemplates = {
  // Equal Widths
  "1": new RowLayout([{ xs: 12 }]),
  "1/2 + 1/2": new RowLayout([
    { sm: 6, xs: 12 },
    { sm: 6, xs: 12 },
  ]),
  "1/3 + 1/3 + 1/3": new RowLayout([
    { md: 4, xs: 12 },
    { md: 4, xs: 12 },
    { md: 4, xs: 12 },
  ]),
  "1/4 + 1/4 + 1/4 + 1/4": new RowLayout([
    { md: 3, xs: 6 },
    { md: 3, xs: 6 },
    { md: 3, xs: 6 },
    { md: 3, xs: 6 },
  ]),
  // "Sidebar + Content"
  "1/3 + 2/3": new RowLayout([
    { md: 4, xs: 6 },
    { md: 8, xs: 6 },
  ]),
  "2/3 + 1/3": new RowLayout([
    { md: 8, xs: 6 },
    { md: 4, xs: 6 },
  ]),
  "1/4 + 3/4": new RowLayout([
    { md: 3, xs: 6 },
    { md: 9, xs: 6 },
  ]),
  "3/4 + 1/4": new RowLayout([
    { md: 9, xs: 6 },
    { md: 3, xs: 6 },
  ]),
  // "Sidebar + Content + Sidebar"
  "1/4 + 1/2 + 1/4": new RowLayout([
    { md: 3, xs: 12 },
    { md: 6, xs: 12 },
    { md: 3, xs: 12 },
  ]),
  // "Small + Small + Large"
  "1/4 + 1/4 + 1/2": new RowLayout([
    { md: 3, xs: 12 },
    { md: 3, xs: 12 },
    { md: 6, xs: 12 },
  ]),
  "1/2 + 1/4 + 1/4": new RowLayout([
    { md: 6, xs: 12 },
    { md: 3, xs: 12 },
    { md: 3, xs: 12 },
  ]),
};
