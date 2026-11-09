const INVALID_RESPONSE = 'Сервис вернул некорректные данные предложений.';
const ZERO_GUID = /^0{8}-0{4}-0{4}-0{4}-0{12}$/;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' ? value.trim() : '';

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function productIdentity(goods, path) {
  const goodsId = text(goods.goodsID);
  if (goodsId && !ZERO_GUID.test(goodsId)) return ['goods', goodsId];

  const brand = text(goods.brand);
  const article = text(goods.number);
  return brand || article ? ['part', brand, article] : ['position', text(goods.name), path];
}

export function normalizeOffers(response) {
  if (!isRecord(response)) throw new Error(INVALID_RESPONSE);
  if (Object.hasOwn(response, 'error')) {
    throw new Error('Сервис вернул ошибку при получении предложений.');
  }
  if (!Array.isArray(response.goods)) throw new Error(INVALID_RESPONSE);

  const offers = new Map();
  const visited = new WeakSet();
  const queue = response.goods.map((goods, index) => ({ goods, kind: 'original', path: `goods.${index}` }));

  for (let index = 0; index < queue.length; index += 1) {
    const { goods, kind, path } = queue[index];
    if (!isRecord(goods)) throw new Error(INVALID_RESPONSE);
    if (visited.has(goods)) continue;
    visited.add(goods);

    if (goods.analogues !== undefined) {
      if (!Array.isArray(goods.analogues)) throw new Error(INVALID_RESPONSE);
      goods.analogues.forEach((analogue, analogueIndex) => {
        queue.push({ goods: analogue, kind: 'analogue', path: `${path}.analogues.${analogueIndex}` });
      });
    }

    const article = text(goods.number);
    const brand = text(goods.brand);
    const name = text(goods.name);
    const goodsId = text(goods.goodsID);
    const placeholder = !article && !brand && !name && (!goodsId || ZERO_GUID.test(goodsId));
    if (placeholder) continue;
    if (!Array.isArray(goods.warehouses)) throw new Error(INVALID_RESPONSE);

    const identity = productIdentity(goods, path);
    const product = { article: article || '—', brand: brand || '—', name: name || '—', kind };

    function addOffer(warehouseIdentity, values) {
      const id = JSON.stringify([identity, warehouseIdentity]);
      if (!offers.has(id)) offers.set(id, { id, ...product, ...values });
    }

    if (goods.warehouses.length === 0) {
      addOffer(['unavailable'], { warehouse: '—', price: null, stock: 0 });
      continue;
    }

    const codeOccurrences = new Map();
    goods.warehouses.forEach((warehouse, warehouseIndex) => {
      if (!isRecord(warehouse)) throw new Error(INVALID_RESPONSE);
      const warehouseId = text(warehouse.id);
      const code = text(warehouse.code);
      const occurrence = codeOccurrences.get(code) || 0;
      codeOccurrences.set(code, occurrence + 1);
      const warehouseIdentity = warehouseId
        ? ['warehouse', warehouseId]
        : code
          ? ['code', code, occurrence]
          : ['position', path, warehouseIndex];

      addOffer(warehouseIdentity, {
        warehouse: code || warehouseId || 'Склад без названия',
        price: numericValue(warehouse.price),
        stock: numericValue(warehouse.stock),
      });
    });
  }

  return [...offers.values()];
}
