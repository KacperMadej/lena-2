// A small in-app English keyboard. We deliberately don't rely on the
// device's own keyboard: on a Polish tablet it defaults to a Polish layout
// with autocorrect that fights an 8-year-old trying to type plain English
// letters. This keyboard only ever produces A-Z, so there's nothing to
// autocorrect and nothing to switch layouts for.

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export function renderKeyboard(container, { onLetter, onBackspace }) {
  container.innerHTML = '';
  container.className = 'keyboard';

  ROWS.forEach((row, i) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';

    if (i === ROWS.length - 1) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'key key-wide';
      back.setAttribute('aria-label', 'Usuń literę');
      back.textContent = '⌫';
      back.addEventListener('click', () => onBackspace && onBackspace());
      rowEl.appendChild(back);
    }

    for (const ch of row) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'key';
      btn.textContent = ch;
      btn.addEventListener('click', () => onLetter && onLetter(ch));
      rowEl.appendChild(btn);
    }

    container.appendChild(rowEl);
  });
}
