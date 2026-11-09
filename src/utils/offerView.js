export const PAGE_SIZE_OPTIONS = Object.freeze([10, 50, 100]);

const hasPrice = (offer) => typeof offer.price === 'number' && Number.isFinite(offer.price);

export function sortOffersByPrice(offers, direction = 'none') {
  const rows = [...offers];
  if (direction !== 'asc' && direction !== 'desc') return rows;

  return rows.sort((left, right) => {
    const leftHasPrice = hasPrice(left);
    const rightHasPrice = hasPrice(right);

    if (!leftHasPrice && !rightHasPrice) return 0;
    if (!leftHasPrice) return 1;
    if (!rightHasPrice) return -1;

    return direction === 'asc' ? left.price - right.price : right.price - left.price;
  });
}

export function paginateOffers(offers, { page = 1, pageSize = 50 } = {}) {
  const size = PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 50;
  const total = offers.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const requestedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  const currentPage = Math.min(pageCount, Math.max(1, requestedPage));
  const offset = (currentPage - 1) * size;

  return {
    rows: offers.slice(offset, offset + size),
    page: currentPage,
    pageSize: size,
    pageCount,
    total,
    start: total > 0 ? offset + 1 : 0,
    end: Math.min(offset + size, total),
  };
}
