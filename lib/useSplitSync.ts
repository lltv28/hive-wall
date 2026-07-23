import { useEffect, useRef, useCallback, useMemo } from 'react';

type SyncEvent =
  | { type: 'chip'; messageId: string; value: string }
  | { type: 'multi'; messageId: string; values: string[] }
  | { type: 'continue' }
  | { type: 'back' }
  | { type: 'results' }
  | { type: 'unlockResults' }
  | { type: 'jump'; targetMsgIndex: number };

type SyncRole = 'leader' | 'follower' | null;

export function useSplitSync() {
  const role = useMemo<SyncRole>(() => {
    if (typeof window === 'undefined') return null;
    const r = new URLSearchParams(window.location.search).get('role');
    return r === 'leader' || r === 'follower' ? r : null;
  }, []);

  const roleRef = useRef<SyncRole>(role);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const listenerRef = useRef<((event: SyncEvent) => void) | null>(null);
  const bufferRef = useRef<SyncEvent[]>([]);

  // Initialize channel for split roles.
  useEffect(() => {
    roleRef.current = role;
    if (!role) return;
    channelRef.current = new BroadcastChannel('quiz-split-sync');

    // Both roles listen — jump events come from the parent page
    channelRef.current.onmessage = (e) => {
      const event = e.data as SyncEvent;

      // Follower listens to all events; leader only listens to jump
      if (roleRef.current === 'follower' || event.type === 'jump') {
        if (listenerRef.current) {
          listenerRef.current(event);
        } else {
          bufferRef.current.push(event);
        }
      }
    };

    return () => {
      roleRef.current = null;
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [role]);

  const broadcast = useCallback((event: SyncEvent) => {
    if (roleRef.current === 'leader' && channelRef.current) {
      channelRef.current.postMessage(event);
    }
  }, []);

  const onEvent = useCallback((listener: (event: SyncEvent) => void) => {
    listenerRef.current = listener;
    // Flush buffered events
    const buf = bufferRef.current;
    bufferRef.current = [];
    buf.forEach(listener);
  }, []);

  const isFollower = role === 'follower';
  const isLeader = role === 'leader';
  const isSplit = role !== null;

  return { broadcast, onEvent, isFollower, isLeader, isSplit };
}
