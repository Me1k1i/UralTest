import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOffers } from '../src/api/normalizeOffers.js';

const product = (values = {}) => ({
  goodsID: 'part-1',
  brand: 'MEYLE',
  number: '001089',
  name: 'Ролик натяжителя',
  price: 999999,
  count: 999,
  warehouses: [{ id: 'warehouse-1', code: 'МС1', price: 1250.5, stock: 4 }],
  ...values,
});

test('цена и остаток берутся из каждого склада, артикул сохраняет ведущие нули', () => {
  const offers = normalizeOffers({ goods: [product({ warehouses: [
    { id: 'ms', code: 'МС1', price: 1250.5, stock: 4 },
    { id: 'ns', code: 'НС1', price: 1310, stock: 2 },
  ] })] });
  assert.equal(offers.length, 2);
  assert.deepEqual(offers.map(({ article, warehouse, price, stock, kind }) => ({ article, warehouse, price, stock, kind })), [
    { article: '001089', warehouse: 'МС1', price: 1250.5, stock: 4, kind: 'original' },
    { article: '001089', warehouse: 'НС1', price: 1310, stock: 2, kind: 'original' },
  ]);
  assert.notEqual(offers[0].id, offers[1].id);
});

test('вложенные аналоги попадают в таблицу и отличаются от исходных товаров', () => {
  const analogue = product({ goodsID: 'part-2', brand: 'INA', number: '532 0161 10', analogues: [
    product({ goodsID: 'part-3', brand: 'SKF', number: 'VKM 31059' }),
  ] });
  const offers = normalizeOffers({ goods: [product({ analogues: [analogue] })] });
  assert.deepEqual(offers.map(({ brand, kind }) => [brand, kind]), [
    ['MEYLE', 'original'], ['INA', 'analogue'], ['SKF', 'analogue'],
  ]);
});

test('повтор исходного товара в аналогах не дублирует его склады', () => {
  const original = product();
  const sourceWithAnalogue = product({ goodsID: 'part-2', brand: 'INA', analogues: [product()] });
  const offers = normalizeOffers({ goods: [sourceWithAnalogue, original] });
  assert.equal(offers.length, 2);
  assert.equal(offers.find((offer) => offer.brand === 'MEYLE').kind, 'original');
});

test('пустые структуры ответа не создают фиктивных строк', () => {
  assert.deepEqual(normalizeOffers({ goods: [] }), []);
  assert.deepEqual(normalizeOffers({ goods: [{}, {
    goodsID: '00000000-0000-0000-0000-000000000000',
    brand: '', number: '', name: '', count: 0, price: 0, rate: 0, warehouses: [],
  }] }), []);
});

test('товар без складских предложений сохраняется без выдуманной цены', () => {
  const [offer] = normalizeOffers({ goods: [product({ warehouses: [] })] });
  assert.equal(offer.warehouse, '—');
  assert.equal(offer.price, null);
  assert.equal(offer.stock, 0);
});

test('складские числа нормализуются без подстановки общих price/count', () => {
  const cases = [
    [{ price: 1250.5, stock: 4 }, [1250.5, 4]],
    [{ price: ' 1234,50 ', stock: '12' }, [1234.5, 12]],
    [{ price: '0', stock: 0 }, [0, 0]],
    [{}, [null, null]],
    [{ price: null, stock: null }, [null, null]],
    [{ price: '1250 руб.', stock: '12 шт.' }, [null, null]],
  ];
  for (const [warehouse, expected] of cases) {
    const [offer] = normalizeOffers({ goods: [product({ warehouses: [warehouse] })] });
    assert.deepEqual([offer.price, offer.stock], expected);
  }
});

test('склады без id сохраняют отдельные предложения и стабильные уникальные id', () => {
  for (const warehouse of [{}, { code: 'МС' }]) {
    const response = { goods: [product({ warehouses: [
      { ...warehouse, price: 10, stock: 1 }, { ...warehouse, price: 20, stock: 2 },
    ] })] };
    const offers = normalizeOffers(response);
    assert.deepEqual(offers.map(({ price, stock }) => [price, stock]), [[10, 1], [20, 2]]);
    assert.notEqual(offers[0].id, offers[1].id);
    assert.deepEqual(offers.map(({ id }) => id), normalizeOffers(response).map(({ id }) => id));
  }
});

test('без goodsID строки определяются по бренду и артикулу', () => {
  const source = product({ goodsID: '', analogues: [product({ goodsID: '' })] });
  const offers = normalizeOffers({ goods: [source] });
  assert.equal(offers.length, 1);
  assert.equal(offers[0].kind, 'original');
});

test('ошибки сервиса и нарушенная структура не маскируются пустым результатом', () => {
  for (const response of [null, { goods: {} },
    { goods: [product({ warehouses: [null] })] }, { goods: [product({ analogues: {} })] },
    { goods: [], error: 'Invalid key client!' }]) {
    assert.throws(() => normalizeOffers(response), /Сервис вернул/);
  }
});
