import { createSlice } from '@reduxjs/toolkit';
import { normalizeArticle } from '#shared/searchValidation.js';

export const DEFAULT_FILTERS = Object.freeze({
  warehouse: '',
  onlyInStock: false,
  kind: 'all',
});

const initialState = {
  article: '',
  number: '',
  selectedBrand: '',
  filters: { ...DEFAULT_FILTERS },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setArticle(state, { payload }) {
      state.article = typeof payload === 'string' ? payload : '';
    },
    submitSearch(state) {
      state.number = normalizeArticle(state.article);
      state.selectedBrand = '';
      state.filters = { ...DEFAULT_FILTERS };
    },
    clearSearch() {
      return initialState;
    },
    selectBrand(state, { payload }) {
      const brand = typeof payload === 'string' ? payload.trim() : '';
      if (brand !== state.selectedBrand) state.filters = { ...DEFAULT_FILTERS };
      state.selectedBrand = brand;
    },
    applyFilters(state, { payload }) {
      const filters = payload && typeof payload === 'object' ? payload : {};
      state.filters = {
        warehouse: typeof filters.warehouse === 'string' ? filters.warehouse.trim() : '',
        onlyInStock: filters.onlyInStock === true,
        kind: ['all', 'original', 'analogue'].includes(filters.kind) ? filters.kind : 'all',
      };
    },
    resetFilters(state) {
      state.filters = { ...DEFAULT_FILTERS };
    },
  },
});

export const {
  setArticle,
  submitSearch,
  clearSearch,
  selectBrand,
  applyFilters,
  resetFilters,
} = searchSlice.actions;
export default searchSlice.reducer;

export const selectArticle = (state) => state.search.article;
export const selectSearchNumber = (state) => state.search.number;
export const selectSelectedBrand = (state) => state.search.selectedBrand;
export const selectFilters = (state) => state.search.filters;

export function selectFilteredOffers(offers, filters = DEFAULT_FILTERS) {
  return offers.filter((offer) => (
    (!filters.warehouse || offer.warehouse === filters.warehouse)
    && (!filters.onlyInStock || offer.stock > 0)
    && (!filters.kind || filters.kind === 'all' || offer.kind === filters.kind)
  ));
}
