// Generic drag-and-drop for "drag a tile into a slot" interactions, built on
// Pointer Events rather than the native HTML5 Drag and Drop API. Native DnD
// does not work on touch devices, which is a dealbreaker for a tablet-first
// app — Pointer Events give us one code path for mouse, touch, and pen.
//
// Usage: makeSortable({ tiles, slots, onChange }) where `tiles` are the
// draggable elements (already placed somewhere, e.g. in a tray) and `slots`
// are drop targets. Dropping a tile onto an occupied slot swaps the
// occupant back to wherever the dragged tile came from.

export function makeSortable({ tiles, slots, onChange }) {
  let dragEl = null;
  let startParent = null;
  let startNext = null;
  let offsetX = 0;
  let offsetY = 0;

  function onPointerDown(e, tile) {
    // Ignore the speaker button etc. inside a tile.
    if (e.target.closest('button') && e.target.closest('button') !== tile) return;
    e.preventDefault();

    dragEl = tile;
    startParent = tile.parentElement;
    startNext = tile.nextSibling;

    const rect = tile.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    tile.classList.add('dragging');
    tile.style.width = rect.width + 'px';
    tile.style.height = rect.height + 'px';
    document.body.appendChild(tile);
    tile.style.position = 'fixed';
    tile.style.zIndex = 1000;
    movePointer(e);

    tile.setPointerCapture && tile.setPointerCapture(e.pointerId);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    movePointer(e);
  }

  function movePointer(e) {
    if (!dragEl) return;
    dragEl.style.left = e.clientX - offsetX + 'px';
    dragEl.style.top = e.clientY - offsetY + 'px';
  }

  function onPointerUp(e) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    if (!dragEl) return;

    const tile = dragEl;
    tile.style.position = '';
    tile.style.left = '';
    tile.style.top = '';
    tile.style.width = '';
    tile.style.height = '';
    tile.style.zIndex = '';
    tile.classList.remove('dragging');

    // Find what's under the pointer, ignoring the tile being dragged.
    tile.style.visibility = 'hidden';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    tile.style.visibility = '';
    const slot = under ? under.closest('.slot') : null;

    if (slot && slots.includes(slot) && slot !== tile.parentElement) {
      const occupant = slot.firstElementChild;
      if (occupant && occupant !== tile) {
        // Bump whatever was already in the slot back to where this tile came from.
        startParent.insertBefore(occupant, startNext);
      }
      slot.appendChild(tile);
    } else if (!slot) {
      startParent.insertBefore(tile, startNext);
    } else {
      // Dropped back on its own slot, or an invalid target: snap back.
      startParent.insertBefore(tile, startNext);
    }

    dragEl = null;
    onChange && onChange();
  }

  tiles.forEach((tile) => {
    tile.addEventListener('pointerdown', (e) => onPointerDown(e, tile));
  });
}
