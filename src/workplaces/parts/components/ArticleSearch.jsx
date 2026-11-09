import { Search, X } from 'lucide-react';
import './ArticleSearch.scss';

export default function ArticleSearch({ search, inputRef }) {
  function submit(event) {
    event.preventDefault();
    if (!search.searchNow()) inputRef.current?.focus();
  }

  function clear() {
    search.clearSearch();
    inputRef.current?.focus();
  }

  function clearFilters() {
    search.clearFilters();
    inputRef.current?.focus();
  }

  return (
    <form className="article-search" role="search" onSubmit={submit} noValidate>
      <div className="article-search__row">
        <label className="visually-hidden" htmlFor="article-search">Артикул детали</label>
        <div className="article-search__field">
          <Search className="article-search__icon" size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            id="article-search"
            className={`form-control form-control-sm article-search__input${search.showValidation ? ' is-invalid' : ''}`}
            type="text"
            name="article"
            placeholder="Артикул детали"
            autoComplete="off"
            spellCheck={false}
            value={search.article}
            onChange={(event) => search.changeArticle(event.target.value)}
            onBlur={search.touchValidation}
            aria-invalid={search.showValidation || undefined}
            aria-describedby={search.showValidation ? 'article-error' : undefined}
          />
          {search.article && (
            <button className="article-search__clear" type="button" aria-label="Очистить поиск" onClick={clear}>
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <button className="btn btn-primary btn-sm" type="submit">Найти</button>
        {search.hasActiveFilters && (
          <button className="btn btn-sm article-search__reset" type="button" onClick={clearFilters}>
            Сбросить фильтры
          </button>
        )}
      </div>
      {search.showValidation && (
        <p className="article-search__validation" id="article-error" role="alert">{search.validationError}</p>
      )}
    </form>
  );
}
