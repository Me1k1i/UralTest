import { createSelector, createSlice } from '@reduxjs/toolkit';
import {
  DEFAULT_WORKPLACE_ID,
  WORKPLACES,
} from '@/config/workplaces.js';

const initialState = {
  activeId: DEFAULT_WORKPLACE_ID,
};

const workplaceSlice = createSlice({
  name: 'workplace',
  initialState,
  reducers: {
    setActiveWorkplace(state, { payload }) {
      if (WORKPLACES.some(({ id }) => id === payload)) state.activeId = payload;
    },
  },
});

export const { setActiveWorkplace } = workplaceSlice.actions;
export default workplaceSlice.reducer;

const selectWorkplaceState = (state) => state.workplace;

export const selectActiveWorkplace = createSelector(
  [selectWorkplaceState],
  ({ activeId }) => WORKPLACES.find(({ id }) => id === activeId) || WORKPLACES[0],
);
