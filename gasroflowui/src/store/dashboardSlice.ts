import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadDashboardData, type DashboardData } from '../api/dashboardData';

const DEFAULT_RESTAURANT_ID = import.meta.env.VITE_DEFAULT_RESTAURANT_ID || 'rest_demo_001';

export type DashboardLoadStatus = 'idle' | 'loading' | 'refreshing' | 'succeeded' | 'failed';
export type DashboardSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface DashboardSocketEvent {
  restaurantId: string;
  occurredAt: string;
}

export interface DashboardState {
  restaurantId: string;
  data: DashboardData | null;
  status: DashboardLoadStatus;
  error: string | null;
  lastLoadedAt: string | null;
  socketStatus: DashboardSocketStatus;
  socketId: string | null;
  socketError: string | null;
  lastSocketEvent: DashboardSocketEvent | null;
}

const initialState: DashboardState = {
  restaurantId: DEFAULT_RESTAURANT_ID,
  data: null,
  status: 'idle',
  error: null,
  lastLoadedAt: null,
  socketStatus: 'idle',
  socketId: null,
  socketError: null,
  lastSocketEvent: null,
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (restaurantId: string) => loadDashboardData(restaurantId),
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setRestaurantId(state, action: PayloadAction<string>) {
      state.restaurantId = action.payload;
      state.data = null;
      state.error = null;
      state.status = 'idle';
      state.lastSocketEvent = null;
    },
    setDashboardSocketConnecting(state) {
      state.socketStatus = 'connecting';
      state.socketError = null;
      state.socketId = null;
    },
    setDashboardSocketConnected(state, action: PayloadAction<string>) {
      state.socketStatus = 'connected';
      state.socketId = action.payload;
      state.socketError = null;
    },
    setDashboardSocketDisconnected(state) {
      state.socketStatus = 'disconnected';
      state.socketId = null;
    },
    setDashboardSocketError(state, action: PayloadAction<string>) {
      state.socketStatus = 'error';
      state.socketError = action.payload;
      state.socketId = null;
    },
    dashboardSocketEventReceived(state, action: PayloadAction<DashboardSocketEvent>) {
      state.lastSocketEvent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = state.data ? 'refreshing' : 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        if (action.meta.arg !== state.restaurantId) {
          return;
        }

        state.data = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.lastLoadedAt = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        if (action.meta.arg !== state.restaurantId) {
          return;
        }

        state.status = 'failed';
        state.error = action.error.message ?? 'Unknown API error';
      });
  },
});

export const {
  dashboardSocketEventReceived,
  setDashboardSocketConnected,
  setDashboardSocketConnecting,
  setDashboardSocketDisconnected,
  setDashboardSocketError,
  setRestaurantId,
} = dashboardSlice.actions;

export const dashboardReducer = dashboardSlice.reducer;
