import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_FILTERS } from '@/store/searchSlice.js';
import './FilterPanel.scss';

export default function FilterPanel({ id, filters, options, onApply, onClose, triggerRef, fallbackFocusRef }) {
  const panelRef = useRef(null);
  const [draft, setDraft] = useState({ ...filters });

  useEffect(() => {
    const panel = panelRef.current;
    panel.querySelector('select')?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;

      const controls = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const trigger = triggerRef.current;
      if (trigger && !trigger.disabled) trigger.focus();
      else fallbackFocusRef?.current?.focus();
    };
  }, [onClose, triggerRef, fallbackFocusRef]);

  function change(name, value) {
    setDraft((current) => name === 'brand'
      ? { ...current, brand: value, warehouse: '', kind: 'all' }
      : { ...current, [name]: value });
  }

  function submit(event) {
    event.preventDefault();
    onApply(draft);
  }

  return (
    <>
      <button className="filter-panel__backdrop" type="button" aria-label="Закрыть фильтры" onClick={onClose} />
      <section className="filter-panel" id={id} ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <form onSubmit={submit}>
          <header className="filter-panel__header">
            <h2 id={`${id}-title`} className="filter-panel__title">Фильтры предложений</h2>
            <button className="btn btn-sm filter-panel__close" type="button" aria-label="Закрыть фильтры" onClick={onClose}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="filter-panel__body">
            <div className="filter-panel__field">
              <label className="form-label" htmlFor={`${id}-brand`}>Производитель детали</label>
              <select className="form-select form-select-sm" id={`${id}-brand`} value={draft.brand} onChange={(event) => change('brand', event.target.value)}>
                <option value="">Все производители</option>
                {options.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </div>
            <div className="filter-panel__field">
              <label className="form-label" htmlFor={`${id}-warehouse`}>Склад</label>
              <select className="form-select form-select-sm" id={`${id}-warehouse`} value={draft.warehouse} disabled={draft.brand !== filters.brand} onChange={(event) => change('warehouse', event.target.value)}>
                <option value="">Все склады</option>
                {options.warehouses.map((warehouse) => <option key={warehouse} value={warehouse}>{warehouse}</option>)}
              </select>
            </div>
            <div className="filter-panel__field">
              <label className="form-label" htmlFor={`${id}-kind`}>Тип позиции</label>
              <select className="form-select form-select-sm" id={`${id}-kind`} value={draft.brand ? draft.kind : 'all'} disabled={!draft.brand} onChange={(event) => change('kind', event.target.value)}>
                <option value="all">Все позиции</option>
                <option value="original">Искомая деталь</option>
                <option value="analogue">Аналоги</option>
              </select>
            </div>
            <label className="form-check filter-panel__checkbox">
              <input className="form-check-input" type="checkbox" checked={draft.onlyInStock} onChange={(event) => change('onlyInStock', event.target.checked)} />
              <span className="form-check-label">Только в наличии</span>
            </label>
          </div>

          <footer className="filter-panel__footer">
            <button type="button" className="btn btn-sm filter-panel__reset" onClick={() => setDraft({ brand: '', ...DEFAULT_FILTERS })}>Сбросить</button>
            <button className="btn btn-primary btn-sm" type="submit">Применить</button>
          </footer>
        </form>
      </section>
    </>
  );
}
