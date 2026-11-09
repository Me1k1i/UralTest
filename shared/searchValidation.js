export const MAX_ARTICLE_LENGTH = 100;
const MAX_BRAND_LENGTH = 100;
const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}]/u;
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

export function normalizeArticle(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getArticleError(value) {
  const article = normalizeArticle(value);
  if (!article) return 'Введите артикул детали.';
  if (CONTROL_CHARACTERS.test(value)) return 'Артикул не должен содержать управляющие или невидимые символы.';
  if (article.length > MAX_ARTICLE_LENGTH) return `Артикул должен содержать не более ${MAX_ARTICLE_LENGTH} символов.`;
  if (!LETTER_OR_NUMBER.test(article)) return 'Артикул должен содержать хотя бы одну букву или цифру.';
  return '';
}

export function getBrandError(value) {
  const brand = typeof value === 'string' ? value.trim() : '';
  if (!brand) return 'Выберите производителя.';
  if (CONTROL_CHARACTERS.test(value)) return 'Название производителя содержит недопустимые символы.';
  if (brand.length > MAX_BRAND_LENGTH) return `Название производителя должно содержать не более ${MAX_BRAND_LENGTH} символов.`;
  return '';
}
