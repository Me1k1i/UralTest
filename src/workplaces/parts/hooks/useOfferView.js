import { useEffect, useMemo, useState } from 'react';
import { selectFilteredOffers } from '@/store/searchSlice.js';
import { PAGE_SIZE_OPTIONS, paginateOffers, sortOffersByPrice } from '@/utils/offerView.js';

export default function useOfferView(offers, filters, contextKey) {
  const [sortDirection, setSortDirection] = useState('none');
  const [pageSize, setPageSize] = useState(50);
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const filteredOffers = useMemo(() => selectFilteredOffers(offers, filters), [offers, filters]);
  const sortedOffers = useMemo(() => sortOffersByPrice(filteredOffers, sortDirection), [filteredOffers, sortDirection]);
  const viewKey = JSON.stringify([contextKey, filters, sortDirection, pageSize]);
  const requestedPage = pageState.key === viewKey ? pageState.page : 1;
  const pagination = paginateOffers(sortedOffers, { page: requestedPage, pageSize });

  useEffect(() => {
    setPageState((current) => {
      if (current.key !== viewKey) return { key: viewKey, page: 1 };
      if (current.page > pagination.pageCount) return { ...current, page: pagination.pageCount };
      return current;
    });
  }, [viewKey, pagination.pageCount]);

  const filterOptions = useMemo(() => ({
    warehouses: [...new Set(offers.map((offer) => offer.warehouse))].sort((left, right) => left.localeCompare(right)),
  }), [offers]);

  return {
    ...pagination,
    filterOptions,
    activeFilterCount: Number(Boolean(filters.warehouse))
      + Number(filters.onlyInStock) + Number(filters.kind !== 'all'),
    sortDirection,
    scrollResetKey: `${viewKey}:${pagination.page}`,
    cyclePriceSort: () => setSortDirection((value) => ({ none: 'asc', asc: 'desc', desc: 'none' })[value]),
    changePage: (page) => setPageState({ key: viewKey, page }),
    changePageSize: (value) => {
      const size = Number(value);
      if (PAGE_SIZE_OPTIONS.includes(size)) setPageSize(size);
    },
  };
}
