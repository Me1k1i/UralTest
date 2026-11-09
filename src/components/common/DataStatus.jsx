import './DataStatus.scss';

export default function DataStatus({ title, message, loading = false, error = false, onRetry }) {
  return (
    <div
      className={`data-status${error ? ' data-status--error' : ''}`}
      role={error ? 'alert' : 'status'}
      aria-busy={loading || undefined}
    >
      {loading && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
      <h3 className="data-status__title">{title}</h3>
      {message && <p className="data-status__message">{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}
