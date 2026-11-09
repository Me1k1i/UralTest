import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.js';
import './OffersTable.scss';

const priceFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  style: 'currency',
  currency: APP_CONFIG.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const countFormatter = new Intl.NumberFormat(APP_CONFIG.locale);

const priceSortStates = {
  none: { icon: ArrowUpDown, ariaSort: 'none', label: 'Сортировать по возрастанию цены', description: 'Без сортировки' },
  asc: { icon: ArrowUp, ariaSort: 'ascending', label: 'Сортировать по убыванию цены', description: 'Цена по возрастанию' },
  desc: { icon: ArrowDown, ariaSort: 'descending', label: 'Сбросить сортировку по цене', description: 'Цена по убыванию' },
};

export default function OffersTable({
  offers,
  filteredEmpty = false,
  onResetFilters,
  scrollResetKey,
  sortDirection = 'none',
  onCyclePriceSort,
}) {
  const containerRef = useRef(null);
  const priceSort = priceSortStates[sortDirection] || priceSortStates.none;
  const SortIcon = priceSort.icon;

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [scrollResetKey]);

  return (
    <div className="offers-table__container" ref={containerRef}>
      <table className="table offers-table" aria-label="Предложения запчастей с ценами и остатками на складах">
        <colgroup>
          <col className="offers-table__column--brand" />
          <col className="offers-table__column--article" />
          <col className="offers-table__column--name" />
          <col className="offers-table__column--warehouse" />
          <col className="offers-table__column--price" />
          <col className="offers-table__column--stock" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Производитель</th>
            <th scope="col">Артикул</th>
            <th scope="col">Наименование</th>
            <th scope="col">Склад</th>
            <th scope="col" className="offers-table__numeric" aria-sort={priceSort.ariaSort}>
              <span className="offers-table__price-heading">
                Цена
                <button
                  type="button"
                  className={`btn btn-sm offers-table__sort-button${sortDirection !== 'none' ? ' offers-table__sort-button--active' : ''}`}
                  onClick={onCyclePriceSort}
                  disabled={!onCyclePriceSort}
                  aria-label={priceSort.label}
                  title={priceSort.description}
                >
                  <SortIcon size={14} aria-hidden="true" />
                </button>
              </span>
            </th>
            <th scope="col" className="offers-table__numeric">Остаток</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td className="offers-table__brand">{offer.brand}</td>
              <td><span className="offers-table__article">{offer.article}</span></td>
              <td className="offers-table__name">
                <span>{offer.name}</span>
                <span className={`offers-table__type offers-table__type--${offer.kind}`}>
                  {offer.kind === 'original' ? 'Искомая деталь' : 'Аналог'}
                </span>
              </td>
              <td className="offers-table__warehouse">{offer.warehouse || '—'}</td>
              <td className="offers-table__numeric offers-table__price">
                {offer.price == null ? '—' : priceFormatter.format(offer.price)}
              </td>
              <td className="offers-table__numeric">
                <span className={`offers-table__stock${offer.stock == null || offer.stock <= 0 ? ' offers-table__stock--empty' : ''}`}>
                  {offer.stock == null ? '—' : `${countFormatter.format(offer.stock)} шт.`}
                </span>
              </td>
            </tr>
          ))}

          {offers.length === 0 && (
            <tr>
              <td className="offers-table__empty" colSpan={6}>
                <span className="offers-table__empty-title">Ничего не найдено</span>
                {filteredEmpty && (
                  <button type="button" className="btn btn-sm offers-table__empty-reset" onClick={onResetFilters}>
                    Сбросить фильтры
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
