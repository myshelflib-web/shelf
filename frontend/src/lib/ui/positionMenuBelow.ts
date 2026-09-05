/** Position a fixed menu below (or above) an anchor, matching trigger width. */
export function positionMenuBelow(
  menu: HTMLElement,
  anchor: HTMLElement,
  opts?: { gap?: number; edge?: number; minWidth?: number; width?: number }
) {
  const gap = opts?.gap ?? 4;
  const edge = opts?.edge ?? 8;
  const anchorRect = anchor.getBoundingClientRect();
  const fixedWidth = opts?.width;
  const minWidth = fixedWidth ?? opts?.minWidth ?? anchorRect.width;

  menu.style.minWidth = `${minWidth}px`;
  menu.style.width = `${fixedWidth ?? Math.max(minWidth, anchorRect.width)}px`;

  const menuRect = menu.getBoundingClientRect();
  const roomBelow = window.innerHeight - anchorRect.bottom;
  const roomAbove = anchorRect.top;

  let left = anchorRect.left;
  if (left + menuRect.width > window.innerWidth - edge) {
    left = window.innerWidth - menuRect.width - edge;
  }
  if (left < edge) left = edge;

  let top: number;
  if (roomBelow >= menuRect.height + gap) {
    top = anchorRect.bottom + gap;
  } else if (roomAbove >= menuRect.height + gap) {
    top = anchorRect.top - menuRect.height - gap;
  } else {
    top = Math.max(edge, window.innerHeight - menuRect.height - edge);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}
