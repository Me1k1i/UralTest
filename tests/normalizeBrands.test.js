import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBrands } from '../src/api/normalizeBrands.js';

test('производители извлекаются без зависимости от складских предложений', () => {
  assert.deepEqual(normalizeBrands({ goods: [{ brand: 'MEYLE' }, { brand: 'FEBI', warehouses: [] }] }), ['FEBI', 'MEYLE']);
});

test('пустые структуры игнорируются, повторы бренда не зависят от регистра', () => {
  assert.deepEqual(normalizeBrands({ goods: [{}, { brand: '' }, { brand: '  ' }, { brand: ' SKF ' }, { brand: 'skf' }, { brand: 'BOSCH' }] }), ['BOSCH', 'SKF']);
});

test('действительно пустой ответ возвращает пустой список производителей', () => {
  assert.deepEqual(normalizeBrands({ goods: [] }), []);
  assert.deepEqual(normalizeBrands({ goods: [{ brand: '', number: '', goodsID: '00000000-0000-0000-0000-000000000000' }] }), []);
});

test('ошибки и нарушенный контракт не маскируются под пустой список', () => {
  for (const response of [null, { goods: {} }, { goods: [{ brand: 123 }] }, { goods: [], error: 'private provider detail' }]) {
    assert.throws(() => normalizeBrands(response), /некорректные данные производителей/);
  }
});
