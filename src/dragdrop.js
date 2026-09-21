// Generic drag-and-drop for "drag a tile into a slot" interactions, built on
// Pointer Events rather than the native HTML5 Drag and Drop API. Native DnD
// does not work on touch devices, which is a dealbreaker for a tablet-first
// app — Pointer Events give us one code path for mouse, touch, and pen.
//
// It also supports a quick-place shortcut: double-clicking/double-tapping a
// tile that's still in the tray drops it into the first empty slot, and
// double-clicking/double-tapping a tile that's already in a slot sends it
// back to the tray. This is detected from pointer timing/movement rather
// than the native `dblclick` event, so it behaves the same on a touchscreen
// tablet as it does with a mouse during desktop testing.
//
// Usage: makeSortable({ tiles, slots, onChange }) where `tiles` are the
// draggable elements (already placed somewhere, e.g. in a tray) and `slots`
// are drop targets. Dropping (or quick-placing) a tile onto an occupied
// slot swaps the occupant back to wherever the dragged tile came from.

const TAP_MOVE_THRESHOLD_PX = 8;
const TAP_MAX_DURATION_MS = 600;
const DOUBLE_TAP_WINDOW_MS = 350;

export function makeSortable({ tiles, slots, onChange }) {
  let dragEl = null;
  let startParent = null;
  let startNext = null;
  let offsetX = 0;
  let offsetY = 0;
  let downX = 0;
  let downY = 0;
  let downTime = 0;
  let moved = false;

  // Where a tile "lives" when it's not in a slot — captured once up front
  // since all tiles start out in the same tray container.
  const homeContainer = tiles.length > 0 ? tiles[0].parentElement : null;
  const lastTapAt = new WeakMap();

  function onPointerDown(e, tile) {
    // Ignore the speaker button etc. inside a tile.
    if (e.target.closest('button') && e.target.closest('button') !== tile) return;
    e.preventDefault();

    dragEl = tile;
    startParent = tile.parentElement;
    startNext = tile.nextSibling;
    downX = e.clientX;
    downY = e.clientY;
    downTime = Date.now();
    moved = false;

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
    if (
      Math.abs(e.clientX - downX) > TAP_MOVE_THRESHOLD_PX ||
      Math.abs(e.clientY - downY) > TAP_MOVE_THRESHOLD_PX
    ) {
      moved = true;
    }
    movePointer(e);
  }

  function movePointer(e) {
    if (!dragEl) return;
    dragEl.style.left = e.clientX - offsetX + 'px';
    dragEl.style.top = e.clientY - offsetY + 'px';
  }

  function restoreInlineStyles(tile) {
    tile.style.position = '';
    tile.style.left = '';
    tile.style.top = '';
    tile.style.width = '';
    tile.style.height = '';
    tile.style.zIndex = '';
    tile.classList.remove('dragging');
  }

  function isInASlot(tile) {
    return !!tile.parentElement && slots.includes(tile.parentElement);
  }

  function firstEmptySlot() {
    return slots.find((s) => !s.firstElementChild) || null;
  }

  // Quick-place: the double-tap/double-click shortcut.
  function quickMove(tile) {
    if (isInASlot(tile)) {
      if (homeContainer) homeContainer.appendChild(tile);
    } else {
      const slot = firstEmptySlot();
      if (!slot) return; // no room — no-op rather than displacing another tile
      slot.appendChild(tile);
    }
    onChange && onChange();
  }

  function onPointerUp(e) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    if (!dragEl) return;

    const tile = dragEl;
    restoreInlineStyles(tile);

    const wasTap = !moved && Date.now() - downTime < TAP_MAX_DURATION_MS;

    if (wasTap) {
      // Not a drag — put the tile back exactly where it was, then check
      // whether this tap arrived quickly enough after a previous one on
      // the same tile to count as a double-tap.
      startParent.insertBefore(tile, startNext);
      dragEl = null;

      const now = Date.now();
      const prevTap = lastTapAt.get(tile) || 0;
      lastTapAt.set(tile, now);
      if (now - prevTap < DOUBLE_TAP_WINDOW_MS) {
        lastTapAt.set(tile, 0); // consume it, so a third tap starts fresh
        quickMove(tile);
      }
      return;
    }

    // A real drag: find what's under the pointer, ignoring the tile itself.
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
