import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '@/utils/offerView.js';
import './TablePagination.scss';

export default function TablePagination({
  page,
  pageSize,
  total,
  pageCount,
  onPageChange,
  onPageSizeChange,
}) {
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  return (
    <footer className="table-pagination">
      <div className="table-pagination__summary">
        <span className="table-pagination__page-size-label">Строк:</span>
        <div className="btn-group table-pagination__page-sizes" role="group" aria-label="Строк на странице">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              className="btn btn-sm table-pagination__size-button"
              type="button"
              aria-label={`${size} строк на странице`}
              aria-pressed={pageSize === size}
              onClick={() => onPageSizeChange(size)}
            >
              {size}
            </button>
          ))}
        </div>
        <span className="table-pagination__range" aria-live="polite">{start}–{end} из {total}</span>
      </div>

      {pageCount > 1 && (
        <nav className="table-pagination__navigation" aria-label="Страницы предложений">
          <button
            className="btn btn-sm table-pagination__page-button"
            type="button"
            disabled={page === 1}
            aria-label="Предыдущая страница"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="table-pagination__current">Страница {page} из {pageCount}</span>
          <button
            className="btn btn-sm table-pagination__page-button"
            type="button"
            disabled={page === pageCount}
            aria-label="Следующая страница"
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </footer>
  );
}
