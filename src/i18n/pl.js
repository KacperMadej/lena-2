// All user-facing text lives here. Keep the app's JS free of hardcoded
// Polish strings so the whole UI vocabulary is in one place.

const STRINGS = {
  appTitle: 'Angielskie Słówka',
  chooseList: 'Wybierz listę słówek do ćwiczenia',
  wordsCount: 'słówek',
  addOwnList: '+ Dodaj własną listę',
  deleteList: 'Usuń listę',
  csvHelp:
    'Wklej słówka w formacie: angielskie_słowo,polskie_słowo,kolejność ' +
    '(kolejność jest opcjonalna). Możesz też wczytać plik CSV z komputera.',
  listName: 'Nazwa listy',
  listNamePlaceholder: 'np. Zwierzęta',
  csvLabel: 'Słówka (CSV)',
  cancel: 'Anuluj',
  save: 'Zapisz',
  needListName: 'Podaj nazwę listy.',
  needAtLeastOneWord: 'Dodaj przynajmniej jedno słówko.',
  modeGapFill: 'Uzupełnij luki',
  modeSort: 'Ułóż po kolei',
  chooseLevel: 'Wybierz poziom trudności',
  level1: 'Poziom 1: przeciągnij literki',
  level2: 'Poziom 2: wpisz brakujące literki',
  level3: 'Poziom 3: napisz całe słowo',
  back: 'Wstecz',
  speak: 'Odsłuchaj słowo',
  correct: 'Brawo! Dobrze!',
  incorrectTryAgain: 'Prawie! Sprawdź jeszcze raz.',
  tryAgain: 'Spróbuj ponownie',
  next: 'Dalej',
  finish: 'Zakończ',
  sortInstructions: 'Przeciągnij słówka, aby ułożyć je we właściwej kolejności.',
  check: 'Sprawdź',
  fillAllSlots: 'Uzupełnij wszystkie miejsca.',
  someWrongTryAgain: 'Nie wszystko się zgadza — spróbuj jeszcze raz.',
  resultsTitle: 'Wynik',
  playAgain: 'Zagraj ponownie',
  backToHome: 'Powrót do listy słówek',
};

export function t(key) {
  return STRINGS[key] || key;
}
