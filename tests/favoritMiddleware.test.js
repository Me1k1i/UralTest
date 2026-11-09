import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createOffersMiddleware } from '../server/favoritMiddleware.js';

const privateKey = 'test-key-kept-on-the-server';
const defaultEnv = {
  FAVORIT_API_KEY: privateKey,
  FAVORIT_API_URL: 'https://supplier.example/price/',
};
const defaultOffersPath = '/api/offers?number=01089&brand=FEBI';

async function requestMiddleware(options, path = defaultOffersPath, requestOptions) {
  const middleware = createOffersMiddleware(options);
  const server = createServer((request, response) => {
    void middleware(request, response, () => {
      response.writeHead(404);
      response.end();
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, requestOptions);
    const text = await response.text();
    return { status: response.status, headers: response.headers, text, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('без серверного ключа запрос поставщику не отправляется', async () => {
  const result = await requestMiddleware({
    env: { FAVORIT_API_URL: defaultEnv.FAVORIT_API_URL },
    fetchImpl: () => assert.fail('unexpected provider request'),
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, 'CONFIGURATION_REQUIRED');
  assert(!result.text.includes(privateKey));
});

test('отсутствующий или пробельный бренд не включает аналоги и передаёт только ключ и артикул', async () => {
  for (const brandParameter of ['', '&brand=%20%20%20']) {
    let received;
    const result = await requestMiddleware({
      env: defaultEnv,
      fetchImpl: async (url, options) => {
        received = { url, options };
        return Response.json({ goods: [], secretMetadata: privateKey });
      },
    }, `/api/offers?number=%20001089%20&analogues=on${brandParameter}`);
    assert.equal(result.status, 200);
    assert.equal(received.url.protocol, 'https:');
    assert.deepEqual([...received.url.searchParams.keys()].sort(), ['key', 'number']);
    assert.equal(received.url.searchParams.get('key'), privateKey);
    assert.equal(received.url.searchParams.get('number'), '001089');
    assert.equal(received.options.cache, 'no-store');
    assert.equal(received.options.redirect, 'error');
    assert.deepEqual(result.body, { goods: [] });
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.match(result.headers.get('content-type'), /application\/json/);
    assert(!result.text.includes(privateKey));
  }
});

test('заданный бренд кодируется вместе с артикулом и включает аналоги', async () => {
  let received;
  const parameters = new URLSearchParams({ number: '00#12&34/+5', brand: 'A&B #1', analogues: 'off' });
  const result = await requestMiddleware({
    env: defaultEnv,
    fetchImpl: async (url) => {
      received = url;
      return Response.json({ goods: [] });
    },
  }, `/api/offers?${parameters}`);
  assert.equal(result.status, 200);
  assert.equal(received.searchParams.get('number'), '00#12&34/+5');
  assert.equal(received.searchParams.get('brand'), 'A&B #1');
  assert.equal(received.searchParams.get('analogues'), 'on');
  assert.match(received.search, /%23/);
  assert.match(received.search, /%26/);
  assert.match(received.search, /%2B/);
});

test('браузер задаёт номер и бренд, но не может подменить серверный ключ и API URL', async () => {
  const result = await requestMiddleware({
    env: defaultEnv,
    fetchImpl: async (url) => {
      assert.equal(url.hostname, 'supplier.example');
      assert.equal(url.searchParams.get('key'), privateKey);
      assert.equal(url.searchParams.get('number'), '01089');
      assert.equal(url.searchParams.get('brand'), 'FEBI');
      assert.equal(url.searchParams.get('analogues'), 'on');
      assert.deepEqual([...url.searchParams.keys()].sort(), ['analogues', 'brand', 'key', 'number']);
      return Response.json({ goods: [] });
    },
  }, `${defaultOffersPath}&key=browser-key&apiUrl=https%3A%2F%2Fother.example&developerKey=ignored`);
  assert.equal(result.status, 200);
  assert(!result.text.includes(privateKey));
});

test('артикул обязателен с брендом и без него', async () => {
  for (const path of ['/api/offers', '/api/offers?number=', '/api/offers?brand=FEBI']) {
    const result = await requestMiddleware({
      env: defaultEnv,
      fetchImpl: () => assert.fail('invalid search must not reach provider'),
    }, path);
    assert.equal(result.status, 400);
    assert.equal(result.body.error.code, 'VALIDATION_ERROR');
    assert.equal(typeof result.body.error.message, 'string');
  }
});

test('некорректный артикул или бренд отклоняется до запроса поставщику', async () => {
  for (const parameters of [{ number: '---' }, { number: '01089', brand: 'BOSCH\u0000' }]) {
    const result = await requestMiddleware({
      env: defaultEnv,
      fetchImpl: () => assert.fail('invalid search must not reach provider'),
    }, `/api/offers?${new URLSearchParams(parameters)}`);
    assert.equal(result.status, 400);
    assert.equal(result.body.error.code, 'VALIDATION_ERROR');
  }
});

test('повторяющиеся параметры не создают неоднозначного запроса', async () => {
  for (const path of [
    '/api/offers?number=01089&number=999',
    '/api/offers?number=01089&brand=FEBI&brand=BOSCH',
  ]) {
    const result = await requestMiddleware({
      env: defaultEnv,
      fetchImpl: () => assert.fail('ambiguous parameters must not reach provider'),
    }, path);
    assert.equal(result.status, 400);
    assert.equal(result.body.error.code, 'VALIDATION_ERROR');
  }
});

test('HTTP 200 с error не принимается за успешные данные и не раскрывает детали', async () => {
  const result = await requestMiddleware({ env: defaultEnv, fetchImpl: async () => Response.json({ error: `Invalid key client! ${privateKey}` }) });
  assert.equal(result.status, 502);
  assert.equal(result.body.error.code, 'PROVIDER_ACCESS_DENIED');
  assert(!result.text.includes(privateKey));
});

test('квота обрабатывается и по полю error, и по HTTP 429', async () => {
  for (const providerResponse of [Response.json({ error: 'Request quota exceeded!' }), new Response('busy', { status: 429 })]) {
    const result = await requestMiddleware({ env: defaultEnv, fetchImpl: async () => providerResponse });
    assert.equal(result.status, 429);
    assert.equal(result.body.error.code, 'QUOTA_EXCEEDED');
  }
});

test('невалидный JSON и нарушение формата goods возвращают безопасную ошибку', async () => {
  for (const providerResponse of [new Response('<html>unavailable</html>'), Response.json({ goods: {} }), Response.json(null)]) {
    const result = await requestMiddleware({ env: defaultEnv, fetchImpl: async () => providerResponse });
    assert.equal(result.status, 502);
    assert.equal(result.body.error.code, 'INVALID_RESPONSE');
  }
});

test('ошибка HTTP поставщика не раскрывает исходный ответ', async () => {
  const result = await requestMiddleware({ env: defaultEnv, fetchImpl: async () => new Response(privateKey, { status: 500 }) });
  assert.equal(result.status, 502);
  assert.equal(result.body.error.code, 'PROVIDER_ERROR');
  assert(!result.text.includes(privateKey));
});

test('сетевая ошибка не раскрывает URL с ключом', async () => {
  const result = await requestMiddleware({ env: defaultEnv, fetchImpl: async (url) => { throw new Error(`Network error for ${url}`); } });
  assert.equal(result.status, 502);
  assert.equal(result.body.error.code, 'PROVIDER_UNAVAILABLE');
  assert(!result.text.includes(privateKey));
});

test('истечение времени запроса возвращает HTTP 504', async () => {
  const result = await requestMiddleware({ env: defaultEnv, timeoutMs: 10, fetchImpl: (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  assert.equal(result.status, 504);
  assert.equal(result.body.error.code, 'PROVIDER_TIMEOUT');
});

test('методы записи отклоняются до обращения к поставщику', async () => {
  const result = await requestMiddleware({ env: defaultEnv, fetchImpl: () => assert.fail('unexpected provider request') }, '/api/offers', { method: 'POST' });
  assert.equal(result.status, 405);
  assert.equal(result.headers.get('allow'), 'GET');
});

test('таймаут чтения тела ответа также возвращает HTTP 504', async () => {
  const result = await requestMiddleware({ env: defaultEnv, fetchImpl: async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new DOMException('body timeout', 'TimeoutError'); },
  }) });
  assert.equal(result.status, 504);
  assert.equal(result.body.error.code, 'PROVIDER_TIMEOUT');
});

test('другие маршруты передаются следующему обработчику', async () => {
  const result = await requestMiddleware({ env: defaultEnv, fetchImpl: () => assert.fail('unexpected provider request') }, '/api/unknown');
  assert.equal(result.status, 404);
});

test('отсутствующий или некорректный адрес поставщика считается ошибкой конфигурации', async () => {
  for (const apiUrl of [undefined, '   ', 'file:///private']) {
    const result = await requestMiddleware({
      env: { ...defaultEnv, FAVORIT_API_URL: apiUrl },
      fetchImpl: () => assert.fail('unexpected provider request'),
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error.code, 'CONFIGURATION_REQUIRED');
  }
});
