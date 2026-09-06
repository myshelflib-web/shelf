/** Table edit helpers for research Docs (contentEditable). */

export function findParentTable(node: Node | null): HTMLTableElement | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof HTMLTableElement) return cur;
    cur = cur.parentNode;
  }
  return null;
}

export function addTableRow(table: HTMLTableElement, afterRow?: HTMLTableRowElement) {
  const body = table.tBodies[0] || table.createTBody();
  const cols =
    table.rows[0]?.cells.length ||
    table.querySelectorAll("thead th").length ||
    2;
  const row = body.insertRow(
    afterRow ? Array.from(body.rows).indexOf(afterRow) + 1 : -1
  );
  for (let i = 0; i < cols; i++) {
    const cell = row.insertCell();
    cell.innerHTML = "<br>";
  }
  return row;
}

export function addTableColumn(table: HTMLTableElement, afterIndex?: number) {
  const insertAt =
    afterIndex == null
      ? (table.rows[0]?.cells.length ?? 0)
      : afterIndex + 1;
  for (const row of Array.from(table.rows)) {
    const isHead = row.parentElement?.tagName === "THEAD";
    const cell = document.createElement(isHead ? "th" : "td");
    cell.innerHTML = isHead ? "Column" : "<br>";
    const ref = row.cells[insertAt] ?? null;
    row.insertBefore(cell, ref);
  }
}

export function removeTableRow(table: HTMLTableElement, row: HTMLTableRowElement) {
  const body = row.parentElement;
  if (!(body instanceof HTMLTableSectionElement)) return;
  if (body.tagName === "THEAD") return;
  if (body.rows.length <= 1) return;
  row.remove();
}

export function removeTableColumn(table: HTMLTableElement, colIndex: number) {
  if (colIndex < 0) return;
  const width = table.rows[0]?.cells.length ?? 0;
  if (width <= 1) return;
  for (const row of Array.from(table.rows)) {
    if (row.cells[colIndex]) row.deleteCell(colIndex);
  }
}

export function activeCellIndex(table: HTMLTableElement): {
  row: HTMLTableRowElement | null;
  colIndex: number;
} {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { row: null, colIndex: -1 };
  let node: Node | null = sel.anchorNode;
  while (node && node !== table) {
    if (node instanceof HTMLTableCellElement) {
      const row = node.parentElement as HTMLTableRowElement | null;
      return { row, colIndex: node.cellIndex };
    }
    node = node.parentNode;
  }
  return { row: null, colIndex: -1 };
}
