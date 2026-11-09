import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_SIZE_OPTIONS, paginateOffers, sortOffersByPrice } from '../src/utils/offerView.js';

const ids = (rows) => rows.map((row) => row.id);

test('цены сортируются численно в обоих направлениях, ноль не теряется', () => {
  const offers = [
    { id: 'expensive', price: 1000 },
    { id: 'unknown', price: null },
    { id: 'free', price: 0 },
    { id: 'cheap', price: 90.5 },
  ];

  assert.deepEqual(ids(sortOffersByPrice(offers, 'asc')), ['free', 'cheap', 'expensive', 'unknown']);
  assert.deepEqual(ids(sortOffersByPrice(offers, 'desc')), ['expensive', 'cheap', 'free', 'unknown']);
});

test('равные цены и неизвестные значения сохраняют взаимный порядок', () => {
  const offers = [
    { id: 'first-unknown', price: null },
    { id: 'first', price: 10 },
    { id: 'second', price: 10 },
    { id: 'second-unknown', price: null },
  ];

  for (const direction of ['asc', 'desc']) {
    assert.deepEqual(ids(sortOffersByPrice(offers, direction)), [
      'first', 'second', 'first-unknown', 'second-unknown',
    ]);
  }
});

test('снятие сортировки восстанавливает порядок API и не меняет исходный массив', () => {
  const offers = Object.freeze([
    Object.freeze({ id: 'middle', price: 20 }),
    Object.freeze({ id: 'highest', price: 30 }),
    Object.freeze({ id: 'lowest', price: 10 }),
  ]);

  assert.deepEqual(ids(sortOffersByPrice(offers, 'asc')), ['lowest', 'middle', 'highest']);
  assert.deepEqual(ids(sortOffersByPrice(offers, 'desc')), ['highest', 'middle', 'lowest']);
  assert.deepEqual(ids(sortOffersByPrice(offers, 'none')), ['middle', 'highest', 'lowest']);
  assert.deepEqual(ids(offers), ['middle', 'highest', 'lowest']);
});

test('пагинация 10, 50 и 100 строк сохраняет полную выдачу и корректный диапазон последней страницы', () => {
  const offers = Array.from({ length: 123 }, (_, id) => ({ id }));
  assert.deepEqual(PAGE_SIZE_OPTIONS, [10, 50, 100]);
  assert.equal(paginateOffers(offers).pageSize, 50);

  for (const pageSize of PAGE_SIZE_OPTIONS) {
    const first = paginateOffers(offers, { pageSize });
    assert.equal(first.rows.length, pageSize);
    assert.equal(first.start, 1);
    assert.equal(first.end, pageSize);
    assert.equal(first.total, 123);

    const visited = [];
    for (let page = 1; page <= first.pageCount; page += 1) {
      visited.push(...paginateOffers(offers, { page, pageSize }).rows);
    }
    assert.deepEqual(visited, offers, `Выдача должна быть полной для размера ${pageSize}`);

    const last = paginateOffers(offers, { page: first.pageCount, pageSize });
    assert.equal(last.page, first.pageCount);
    assert.equal(last.start, (first.pageCount - 1) * pageSize + 1);
    assert.equal(last.end, 123);
    assert.deepEqual(last.rows, offers.slice(last.start - 1));
  }
});

test('номер страницы ограничивается последней доступной страницей выдачи', () => {
  const offers = Array.from({ length: 12 }, (_, id) => ({ id }));
  assert.equal(paginateOffers(offers, { page: 999, pageSize: 10 }).page, 2);
});

test('пустая выдача возвращает нулевой диапазон и одну допустимую страницу', () => {
  for (const pageSize of PAGE_SIZE_OPTIONS) {
    assert.deepEqual(paginateOffers([], { page: 99, pageSize }), {
      rows: [], page: 1, pageSize, pageCount: 1, total: 0, start: 0, end: 0,
    });
  }
});
