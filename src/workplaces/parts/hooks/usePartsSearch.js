import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetOffersQuery } from '@/api/partsApi.js';
import {
  applyFilters,
  clearSearch,
  resetFilters,
  selectArticle,
  selectBrand,
  selectFilters,
  selectSearchNumber,
  selectSelectedBrand,
  setArticle,
  submitSearch,
} from '@/store/searchSlice.js';
import { getArticleError, normalizeArticle } from '#shared/searchValidation.js';

const EMPTY_LIST = [];

function getErrorMessage(error) {
  const message = error?.data?.error?.message;
  return typeof message === 'string' && message.trim()
    ? message
    : 'Не удалось связаться с сервисом. Повторите запрос позже.';
}

export default function usePartsSearch() {
  const dispatch = useDispatch();
  const article = useSelector(selectArticle);
  const number = useSelector(selectSearchNumber);
  const selectedBrand = useSelector(selectSelectedBrand);
  const filters = useSelector(selectFilters);
  const hasActiveFilters = Boolean(selectedBrand || filters.warehouse || filters.onlyInStock || filters.kind !== 'all');
  const validationError = getArticleError(article);
  const [validationTouched, setValidationTouched] = useState(false);

  const partsQuery = useGetOffersQuery({ number }, { skip: !number });
  const brands = partsQuery.currentData?.brands ?? EMPTY_LIST;
  const brandQuery = useGetOffersQuery(
    { number, brand: selectedBrand },
    { skip: !number || !selectedBrand },
  );
  const query = selectedBrand ? brandQuery : partsQuery;
  const offers = number && !query.isError ? query.currentData?.offers ?? EMPTY_LIST : EMPTY_LIST;
  const hasOfferData = Boolean(number) && !query.isError && query.currentData !== undefined;
  const offersLoading = Boolean(number) && query.isFetching;

  function searchNow() {
    setValidationTouched(true);
    if (validationError) return false;
    const sameNumber = normalizeArticle(article) === number;
    dispatch(submitSearch());
    if (sameNumber && !partsQuery.isUninitialized && !partsQuery.isFetching) partsQuery.refetch();
    return true;
  }

  function applySearchFilters(next) {
    const brand = typeof next.brand === 'string' && brands.includes(next.brand) ? next.brand : '';
    dispatch(selectBrand(brand));
    dispatch(applyFilters(next));
  }

  let status = null;
  if (!number) {
    status = { title: 'Введите артикул детали' };
  } else if (query.isFetching && !query.currentData) {
    status = { title: 'Загружаем предложения…', loading: true };
  } else if (query.isError) {
    status = {
      title: 'Не удалось загрузить предложения',
      message: getErrorMessage(query.error),
      error: true,
      onRetry: query.refetch,
    };
  }

  return {
    article,
    selectedBrand,
    filters,
    hasActiveFilters,
    brands,
    offers,
    hasOfferData,
    contextKey: JSON.stringify([number, selectedBrand]),
    validationError,
    showValidation: Boolean(validationError) && (validationTouched || Boolean(article)),
    offersLoading,
    canRefreshOffers: Boolean(number) && !query.isFetching,
    status,
    changeArticle: (value) => dispatch(setArticle(value)),
    touchValidation: () => setValidationTouched(true),
    searchNow,
    clearSearch: () => {
      dispatch(clearSearch());
      setValidationTouched(false);
    },
    applyFilters: applySearchFilters,
    clearFilters: () => {
      dispatch(selectBrand(''));
      dispatch(resetFilters());
    },
    resetFilters: () => dispatch(resetFilters()),
    refreshOffers: () => {
      if (number && !query.isFetching) query.refetch();
    },
  };
}
