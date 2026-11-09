const INVALID_RESPONSE = 'Сервис вернул некорректные данные производителей.';
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function normalizeBrands(response) {
  if (!isRecord(response) || Object.hasOwn(response, 'error') || !Array.isArray(response.goods)) {
    throw new Error(INVALID_RESPONSE);
  }

  const brands = new Map();
  response.goods.forEach((goods) => {
    if (!isRecord(goods) || (goods.brand != null && typeof goods.brand !== 'string')) {
      throw new Error(INVALID_RESPONSE);
    }

    const brand = goods.brand?.trim();
    if (brand) {
      const identity = brand.toLocaleLowerCase('ru-RU');
      if (!brands.has(identity)) brands.set(identity, brand);
    }
  });

  return [...brands.values()].sort((left, right) => left.localeCompare(right, 'ru-RU', { sensitivity: 'base' }));
}
