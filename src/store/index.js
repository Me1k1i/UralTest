import { configureStore } from '@reduxjs/toolkit';
import workplaceReducer from './workplaceSlice.js';
import { partsApi } from '@/api/partsApi.js';
import searchReducer from './searchSlice.js';

export const store = configureStore({
  reducer: {
    workplace: workplaceReducer,
    search: searchReducer,
    [partsApi.reducerPath]: partsApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(partsApi.middleware),
});
