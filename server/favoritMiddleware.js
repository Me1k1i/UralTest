import { getFavoritConfig } from './config.js';
import { getArticleError, getBrandError, normalizeArticle } from '#shared/searchValidation.js';

function sendJson(response, status, body) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function fail(response, status, code, message) {
  sendJson(response, status, { error: { code, message } });
}

function configurationError(response) {
  fail(response, 503, 'CONFIGURATION_REQUIRED', 'Подключение к сервису предложений ещё не настроено.');
}

function providerError(response, status, value) {
  const description = typeof value === 'string' ? value : '';
  if (status === 429 || /quota|limit|exceed/i.test(description)) {
    fail(response, 429, 'QUOTA_EXCEEDED', 'Лимит запросов к сервису предложений исчерпан. Попробуйте позднее.');
  } else if (status === 401 || status === 403 || /key|client|authoriz/i.test(description)) {
    fail(response, 502, 'PROVIDER_ACCESS_DENIED', 'Сервис предложений отклонил подключение. Проверьте настройки доступа.');
  } else {
    fail(response, 502, 'PROVIDER_ERROR', 'Сервис предложений не смог обработать запрос. Попробуйте позднее.');
  }
}

export function createOffersMiddleware({ env = process.env, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  return async function offersMiddleware(request, response, next = () => {
    fail(response, 404, 'NOT_FOUND', 'Ресурс не найден.');
  }) {
    let incomingUrl;
    try {
      incomingUrl = new URL(request.url, 'http://localhost');
    } catch {
      fail(response, 400, 'INVALID_REQUEST', 'Некорректный запрос.');
      return;
    }
    if (incomingUrl.pathname !== '/api/offers') {
      next();
      return;
    }
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      fail(response, 405, 'METHOD_NOT_ALLOWED', 'Этот запрос поддерживает только получение данных.');
      return;
    }

    const parameters = incomingUrl.searchParams;
    if (parameters.getAll('number').length > 1 || parameters.getAll('brand').length > 1) {
      fail(response, 400, 'VALIDATION_ERROR', 'Передайте один артикул и одного производителя.');
      return;
    }
    const rawNumber = parameters.get('number');
    const rawBrand = parameters.get('brand');
    const brand = rawBrand?.trim() || '';
    const validationError = getArticleError(rawNumber) || (brand && getBrandError(rawBrand));
    if (validationError) {
      fail(response, 400, 'VALIDATION_ERROR', validationError);
      return;
    }
    const number = normalizeArticle(rawNumber);

    const { apiKey: key, apiUrl } = getFavoritConfig(env);
    if (!key) {
      configurationError(response);
      return;
    }

    let url;
    try {
      url = new URL(apiUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
      url.search = '';
      url.hash = '';
      url.searchParams.set('key', key);
      url.searchParams.set('number', number);
      if (brand) {
        url.searchParams.set('brand', brand);
        url.searchParams.set('analogues', 'on');
      }
    } catch {
      configurationError(response);
      return;
    }

    try {
      const upstream = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      });

      let body;
      try {
        body = await upstream.json();
      } catch (error) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw error;
        if (!upstream.ok) providerError(response, upstream.status);
        else fail(response, 502, 'INVALID_RESPONSE', 'Сервис предложений вернул некорректный ответ.');
        return;
      }
      if (!upstream.ok || (body && Object.hasOwn(body, 'error'))) {
        providerError(response, upstream.status, body?.error);
        return;
      }
      if (!body || !Array.isArray(body.goods)) {
        fail(response, 502, 'INVALID_RESPONSE', 'Сервис предложений вернул некорректный ответ.');
        return;
      }

      sendJson(response, 200, { goods: body.goods });
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        fail(response, 504, 'PROVIDER_TIMEOUT', 'Сервис предложений не ответил вовремя. Повторите запрос.');
      } else {
        fail(response, 502, 'PROVIDER_UNAVAILABLE', 'Не удалось связаться с сервисом предложений. Повторите запрос.');
      }
    }
  };
}
