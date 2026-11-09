import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import FilterPanel from '@/components/workplace/FilterPanel.jsx';
import ArticleSearch from './ArticleSearch.jsx';
import './PartsSearchPanel.scss';

export default function PartsSearchPanel({ search, view }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef(null);
  const filterButtonRef = useRef(null);
  const panelId = useId();
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const canFilter = (search.hasOfferData || search.brands.length > 0) && !search.offersLoading;
  const activeFilterCount = view.activeFilterCount + Number(Boolean(search.selectedBrand));

  useEffect(() => {
    setFiltersOpen(false);
  }, [search.contextKey, search.hasOfferData]);

  function apply(nextFilters) {
    search.applyFilters(nextFilters);
    closeFilters();
  }

  return (
    <section className="parts-search" aria-label="Поиск и фильтры">
      <div className="parts-search__toolbar">
        <ArticleSearch search={search} inputRef={inputRef} />
        <div className="parts-search__actions">
          <div className="parts-search__filter-anchor">
            <button
              ref={filterButtonRef}
              className="btn btn-primary btn-sm parts-search__filter-button"
              type="button"
              disabled={!canFilter}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen && canFilter}
              aria-controls={filtersOpen && canFilter ? panelId : undefined}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Фильтры
              {activeFilterCount > 0 && <span className="parts-search__filter-count">{activeFilterCount}</span>}
            </button>
            {filtersOpen && canFilter && (
              <FilterPanel
                id={panelId}
                filters={{ ...search.filters, brand: search.selectedBrand }}
                options={{ ...view.filterOptions, brands: search.brands }}
                onApply={apply}
                onClose={closeFilters}
                triggerRef={filterButtonRef}
                fallbackFocusRef={inputRef}
              />
            )}
          </div>
          <button className="btn btn-sm parts-search__refresh" type="button" onClick={search.refreshOffers} disabled={!search.canRefreshOffers}>
            <RefreshCw size={16} aria-hidden="true" />
            Обновить
          </button>
        </div>
      </div>
    </section>
  );
}
