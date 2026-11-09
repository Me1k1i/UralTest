import DataStatus from '@/components/common/DataStatus.jsx';
import TablePagination from '@/components/common/TablePagination.jsx';
import OffersTable from '@/components/workplace/OffersTable.jsx';
import PartsSearchPanel from './components/PartsSearchPanel.jsx';
import usePartsSearch from './hooks/usePartsSearch.js';
import useOfferView from './hooks/useOfferView.js';
import './PartsWorkplace.scss';

export default function PartsWorkplace({ title = 'Подбор запчастей' }) {
  const search = usePartsSearch();
  const view = useOfferView(search.offers, search.filters, search.contextKey);

  return (
    <section className="parts-workplace" aria-labelledby="parts-title">
      <header className="parts-workplace__header">
        <h1 id="parts-title" className="parts-workplace__title">{title}</h1>
      </header>

      <PartsSearchPanel search={search} view={view} />

      <section className="parts-workplace__content" aria-label="Предложения запчастей" aria-busy={search.offersLoading}>
        {search.status ? <DataStatus {...search.status} /> : (
          <OffersTable
            offers={view.rows}
            filteredEmpty={search.offers.length > 0 && view.total === 0}
            onResetFilters={search.resetFilters}
            scrollResetKey={view.scrollResetKey}
            sortDirection={view.sortDirection}
            onCyclePriceSort={view.cyclePriceSort}
          />
        )}

        {search.hasOfferData && (
          <TablePagination
            page={view.page}
            pageSize={view.pageSize}
            total={view.total}
            pageCount={view.pageCount}
            onPageChange={view.changePage}
            onPageSizeChange={view.changePageSize}
          />
        )}
      </section>
    </section>
  );
}
