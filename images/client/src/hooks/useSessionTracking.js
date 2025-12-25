import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export const useSessionTracking = (userId) => {
  const sessionStartTime = useRef(Date.now());
  const sessionActive = useRef(true);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Generate unique session ID for this browser session
    const newSessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem('currentSessionId', newSessionId);

    // Send session start event
    const sendSessionStart = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3000/session-event', {
          type: 'session_start',
          session_id: newSessionId,
          user_agent: {
            browser: { browser: navigator.userAgent.split(' ')[0] },
            device: navigator.platform,
            full_ua: navigator.userAgent
          },
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Session started:', newSessionId);
      } catch (error) {
        console.error('Failed to send session start:', error);
      }
    };

    sendSessionStart();

    // Cleanup function for session end
    const handleSessionEnd = async () => {
      if (!sessionActive.current) return;
      sessionActive.current = false;

      const sessionDuration = Date.now() - sessionStartTime.current;
      
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:3000/session-event', {
          type: 'session_end',
          session_id: newSessionId,
          total_session_duration: sessionDuration,
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Session ended:', newSessionId, 'Duration:', sessionDuration + 'ms');
      } catch (error) {
        console.error('Failed to send session end:', error);
      }
    };

    // Handle various session end scenarios
    const handleBeforeUnload = () => {
      handleSessionEnd();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSessionEnd();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleSessionEnd();
    };
  }, [userId]);

  return null;
};