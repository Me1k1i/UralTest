import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ARTICLE_LENGTH,
  getArticleError,
  getBrandError,
  normalizeArticle,
} from '../shared/searchValidation.js';

test('артикул сохраняет ведущие нули, внутренние пробелы и специальные символы', () => {
  const article = '  001 23/#A&B+7  ';
  assert.equal(normalizeArticle(article), '001 23/#A&B+7');
  assert.equal(getArticleError(article), '');
});

test('короткие и нелатинские артикулы разрешены без выдуманного минимума длины', () => {
  for (const article of ['1', 'Д-01']) assert.equal(getArticleError(article), '');
});

test('пустой и состоящий только из знаков артикул возвращает ошибку валидации', () => {
  for (const article of ['', '   ', '---', '#&/+']) assert.notEqual(getArticleError(article), '');
});

test('слишком длинный артикул отклоняется без скрытого обрезания', () => {
  assert.equal(getArticleError('1'.repeat(MAX_ARTICLE_LENGTH)), '');
  const article = '1'.repeat(MAX_ARTICLE_LENGTH + 1);
  assert.notEqual(getArticleError(article), '');
  assert.equal(normalizeArticle(article).length, MAX_ARTICLE_LENGTH + 1);
});

test('управляющие и невидимые символы в артикуле отклоняются', () => {
  for (const article of ['A\u0000B', 'A\nB', '\t001', '00\u200b1', 'A\u202eB']) {
    assert.notEqual(getArticleError(article), '');
  }
});

test('переданное имя производителя допускает специальные символы и проверяется по содержимому и длине', () => {
  assert.equal(getBrandError(' ACME & SONS '), '');
  assert.equal(getBrandError('A'.repeat(100)), '');
  for (const brand of ['A\nB', 'A\u200bB', 'A'.repeat(101)]) {
    assert.notEqual(getBrandError(brand), '');
  }
});
