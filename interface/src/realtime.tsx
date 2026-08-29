import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { marcarNotificacaoLidaApi, notificacoesApi, type ApiNotificacao } from './apiClient';
import { closeRealtimeSocket, realtimeSocket } from './socketClient';

export const INCIDENT_CHANGED_EVENT = 'ciberbox:incident-changed';
export const DOCUMENT_CHANGED_EVENT = 'ciberbox:document-changed';

type RealtimeState = {
  notifications: ApiNotificacao[];
  unreadCount: number;
  connected: boolean;
  refreshNotifications: () => Promise<void>;
  markRead: (notification: ApiNotificacao) => Promise<void>;
};

const RealtimeContext = createContext<RealtimeState | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ApiNotificacao[]>([]);
  const [connected, setConnected] = useState(false);

  const refreshNotifications = useCallback(async () => {
    try {
      setNotifications(await notificacoesApi());
    } catch {
      // A API mantém-se na fonte de verdade. Uma falha transitória no aviso em
      // tempo real não deve quebrar a sessão nem escrever mensagens na consola.
    }
  }, []);

  const markRead = useCallback(async (notification: ApiNotificacao) => {
    if (notification.lida) return;
    const updated = await marcarNotificacaoLidaApi(notification.id);
    setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
  }, []);

  useEffect(() => {
    const socket = realtimeSocket();
    const onConnect = () => { setConnected(true); void refreshNotifications(); };
    const onDisconnect = () => setConnected(false);
    const onNotification = () => { void refreshNotifications(); };
    const onIncident = () => window.dispatchEvent(new Event(INCIDENT_CHANGED_EVENT));
    const onDocument = () => window.dispatchEvent(new Event(DOCUMENT_CHANGED_EVENT));
    const onFocus = () => { void refreshNotifications(); };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNotification);
    socket.on('notification:read', onNotification);
    socket.on('incident:created', onIncident);
    socket.on('incident:updated', onIncident);
    socket.on('incident:deactivated', onIncident);
    socket.on('document:submitted', onDocument);
    socket.on('document:reviewed', onDocument);
    socket.on('summary:updated', onIncident);
    window.addEventListener('focus', onFocus);
    void refreshNotifications();
    socket.connect();

    return () => {
      window.removeEventListener('focus', onFocus);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNotification);
      socket.off('notification:read', onNotification);
      socket.off('incident:created', onIncident);
      socket.off('incident:updated', onIncident);
      socket.off('incident:deactivated', onIncident);
      socket.off('document:submitted', onDocument);
      socket.off('document:reviewed', onDocument);
      socket.off('summary:updated', onIncident);
      closeRealtimeSocket();
    };
  }, [refreshNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.lida).length,
    connected,
    refreshNotifications,
    markRead,
  }), [notifications, connected, refreshNotifications, markRead]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext) ?? {
    notifications: [], unreadCount: 0, connected: false,
    refreshNotifications: async () => {}, markRead: async () => {},
  };
}
