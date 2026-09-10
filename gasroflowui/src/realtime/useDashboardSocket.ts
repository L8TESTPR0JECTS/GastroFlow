import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { gastroflowApi } from '../api/gastroflowApi';
import { useAppDispatch } from '../store/hooks';
import {
  dashboardSocketEventReceived,
  fetchDashboardData,
  setDashboardSocketConnected,
  setDashboardSocketConnecting,
  setDashboardSocketDisconnected,
  setDashboardSocketError,
} from '../store/dashboardSlice';

interface DashboardUpdatedPayload {
  restaurantId: string;
  occurredAt: string;
}

const socketUrl = (import.meta.env.VITE_SOCKET_URL || gastroflowApi.baseUrl).replace(/\/$/, '');

export function useDashboardSocket(restaurantId: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!restaurantId) {
      return undefined;
    }

    dispatch(setDashboardSocketConnecting());

    const socket: Socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      dispatch(setDashboardSocketConnected(socket.id ?? 'connected'));
      // debugger;
      socket.emit('dashboard.subscribe', { restaurantId });
    });

    socket.on('dashboard.updated', (payload: DashboardUpdatedPayload) => {
      if (payload.restaurantId !== restaurantId) {
        return;
      }

      dispatch(dashboardSocketEventReceived(payload));
      dispatch(fetchDashboardData(restaurantId));
    });

    socket.on('disconnect', () => {
      dispatch(setDashboardSocketDisconnected());
    });

    socket.on('connect_error', (error) => {
      dispatch(setDashboardSocketError(error.message));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [dispatch, restaurantId]);
}
