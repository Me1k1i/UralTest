import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import reducer, {
  applyFilters,
  clearSearch,
  resetFilters,
  selectArticle,
  selectBrand,
  selectFilteredOffers,
  selectFilters,
  selectSearchNumber,
  selectSelectedBrand,
  setArticle,
  submitSearch,
} from '../src/store/searchSlice.js';

const makeStore = () => configureStore({ reducer: { search: reducer } });
const offers = [
  { id: '1', brand: 'MEYLE', warehouse: 'МС1', stock: 5, kind: 'original' },
  { id: '2', brand: 'MEYLE', warehouse: 'МС2', stock: 0, kind: 'original' },
  { id: '3', brand: 'MAPCO', warehouse: 'МС1', stock: 12, kind: 'analogue' },
  { id: '4', brand: 'MAPCO', warehouse: 'МС2', stock: null, kind: 'analogue' },
];

test('ввод артикула не меняет выполненный поиск и условия до отправки формы', () => {
  const store = makeStore();
  store.dispatch(setArticle('00123'));
  assert.equal(selectSearchNumber(store.getState()), '');
  store.dispatch(submitSearch());
  store.dispatch(selectBrand('MEYLE'));
  store.dispatch(applyFilters({ warehouse: 'МС1', onlyInStock: true, kind: 'analogue' }));
  store.dispatch(setArticle('00456'));
  assert.equal(selectArticle(store.getState()), '00456');
  assert.equal(selectSearchNumber(store.getState()), '00123');
  assert.equal(selectSelectedBrand(store.getState()), 'MEYLE');
  assert.deepEqual(selectFilters(store.getState()), { warehouse: 'МС1', onlyInStock: true, kind: 'analogue' });
});

test('отправка поиска фиксирует артикул и сбрасывает прежнего производителя и условия', () => {
  const store = makeStore();
  store.dispatch(selectBrand('MEYLE'));
  store.dispatch(applyFilters({ onlyInStock: true, kind: 'analogue' }));
  store.dispatch(setArticle(' 00123 '));
  store.dispatch(submitSearch());
  assert.equal(selectArticle(store.getState()), ' 00123 ');
  assert.equal(selectSearchNumber(store.getState()), '00123');
  assert.equal(selectSelectedBrand(store.getState()), '');
  assert.deepEqual(selectFilters(store.getState()), { warehouse: '', onlyInStock: false, kind: 'all' });
});

test('выбор другого производителя сбрасывает условия предыдущей выдачи', () => {
  const store = makeStore();
  store.dispatch(selectBrand('MEYLE'));
  store.dispatch(applyFilters({ onlyInStock: true, warehouse: 'МС1' }));
  store.dispatch(selectBrand('FEBI'));
  assert.equal(selectSelectedBrand(store.getState()), 'FEBI');
  assert.deepEqual(selectFilters(store.getState()), { warehouse: '', onlyInStock: false, kind: 'all' });
});

test('условия по складу, наличию и типу применяются совместно', () => {
  const result = selectFilteredOffers(offers, { warehouse: 'МС1', onlyInStock: true, kind: 'analogue' });
  assert.deepEqual(result.map((offer) => offer.id), ['3']);
});

test('фильтр наличия исключает нулевой и неизвестный остаток', () => {
  assert.deepEqual(selectFilteredOffers(offers, { onlyInStock: true }).map((offer) => offer.id), ['1', '3']);
});

test('бренд из формы не становится локальным фильтром и сохраняет подходящие аналоги других производителей', () => {
  const store = makeStore();
  store.dispatch(selectBrand('MEYLE'));
  store.dispatch(applyFilters({ brand: 'MEYLE', warehouse: 'МС1', kind: 'analogue', onlyInStock: true }));
  assert.deepEqual(selectFilters(store.getState()), { warehouse: 'МС1', onlyInStock: true, kind: 'analogue' });
  assert.deepEqual(selectFilteredOffers(offers, selectFilters(store.getState())).map((offer) => offer.id), ['3']);
});

test('сброс локальных фильтров сохраняет выполненный запрос и выбранного производителя', () => {
  const store = makeStore();
  store.dispatch(setArticle('00123'));
  store.dispatch(submitSearch());
  store.dispatch(selectBrand('MEYLE'));
  store.dispatch(applyFilters({ onlyInStock: true, kind: 'analogue' }));
  store.dispatch(resetFilters());
  assert.equal(selectSearchNumber(store.getState()), '00123');
  assert.equal(selectSelectedBrand(store.getState()), 'MEYLE');
  assert.equal(selectFilteredOffers(offers, selectFilters(store.getState())).length, 4);
});

test('очистка поиска убирает и введённый артикул, и выполненный запрос, и условия', () => {
  const store = makeStore();
  store.dispatch(setArticle('00123'));
  store.dispatch(submitSearch());
  store.dispatch(selectBrand('MEYLE'));
  store.dispatch(applyFilters({ onlyInStock: true }));
  store.dispatch(clearSearch());
  assert.equal(selectArticle(store.getState()), '');
  assert.equal(selectSearchNumber(store.getState()), '');
  assert.equal(selectSelectedBrand(store.getState()), '');
  assert.deepEqual(selectFilters(store.getState()), { warehouse: '', onlyInStock: false, kind: 'all' });
});

