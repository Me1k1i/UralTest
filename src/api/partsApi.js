import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { APP_CONFIG } from '@/config/app.js';
import { normalizeOffers } from './normalizeOffers.js';
import { normalizeBrands } from './normalizeBrands.js';

async function requestData(request, fetchWithBaseQuery) {
  const response = await fetchWithBaseQuery(request);
  if (response.error) return response;

  try {
    return {
      data: {
        brands: normalizeBrands(response.data),
        offers: normalizeOffers(response.data),
      },
    };
  } catch {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: 'Некорректный ответ сервиса предложений',
        data: {
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Сервис вернул некорректные данные. Повторите запрос позже.',
          },
        },
      },
    };
  }
}

export const partsApi = createApi({
  reducerPath: 'partsApi',
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}/`,
    timeout: 20000,
    cache: 'no-store',
  }),
  endpoints: (builder) => ({
    getOffers: builder.query({
      queryFn({ number, brand } = {}, _api, _options, fetchWithBaseQuery) {
        return requestData(
          { url: 'offers', method: 'GET', params: { number, brand } },
          fetchWithBaseQuery,
        );
      },
    }),
  }),
});

export const { useGetOffersQuery } = partsApi;
