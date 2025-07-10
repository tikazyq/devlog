import { useEffect, useRef, useState } from 'react';

/**
 * @deprecated This hook is deprecated. Use useServerSentEvents instead for real-time updates.
 * WebSocket is not supported in Next.js App Router without custom server setup.
 */
export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.warn(
      'useWebSocket is deprecated. Use useServerSentEvents for real-time updates instead.'
    );
    
    // Always return false for connection status
    setConnected(false);
  }, []);

  const subscribe = (channel: string) => {
    console.warn('useWebSocket.subscribe is deprecated. Use useServerSentEvents instead.');
  };

  const unsubscribe = (channel: string) => {
    console.warn('useWebSocket.unsubscribe is deprecated. Use useServerSentEvents instead.');
  };

  return {
    connected,
    subscribe,
    unsubscribe,
  };
}
