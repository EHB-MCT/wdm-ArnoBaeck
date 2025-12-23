import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AnalyticsContext = createContext();

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

export function AnalyticsProvider({ children }) {
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [userAgent, setUserAgent] = useState(null);

  useEffect(() => {
    const startTime = new Date();
    const userAgentData = {
      raw: navigator.userAgent,
      browser: getBrowserInfo(),
      device: getDeviceInfo(),
      os: getOSInfo(),
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    setSessionStartTime(startTime);
    setUserAgent(userAgentData);

    sendSessionEvent('session_start', {
      timestamp: startTime,
      time_of_day: startTime.getHours() + ':' + startTime.getMinutes().toString().padStart(2, '0'),
      user_agent: userAgentData
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendSessionEvent('session_pause', {
          timestamp: new Date(),
          session_duration: Date.now() - startTime.getTime()
        });
      } else {
        sendSessionEvent('session_resume', {
          timestamp: new Date(),
          session_duration: Date.now() - startTime.getTime()
        });
      }
    };

    const handleBeforeUnload = () => {
      sendSessionEvent('session_end', {
        timestamp: new Date(),
        total_session_duration: Date.now() - startTime.getTime()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  function sendSessionEvent(eventType, data) {
    axios.post("http://localhost:3000/session-event", {
      type: eventType,
      ...data
    }).catch(() => {});
  }

  return (
    <AnalyticsContext.Provider value={{
      sessionStartTime,
      userAgent,
      getSessionDuration: () => sessionStartTime ? Date.now() - sessionStartTime.getTime() : 0
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari';
    version = ua.match(/Safari\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
  }

  return { browser, version };
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'desktop';

  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    if (/iPad/.test(ua)) {
      device = 'tablet';
    } else {
      device = 'mobile';
    }
  }

  return device;
}

function getOSInfo() {
  const ua = navigator.userAgent;
  let os = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Windows') > -1) {
    os = 'Windows';
    version = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Mac') > -1) {
    os = 'macOS';
  } else if (ua.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (ua.indexOf('Android') > -1) {
    os = 'Android';
    version = ua.match(/Android (\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('iOS') > -1 || /iPhone|iPad/.test(ua)) {
    os = 'iOS';
    version = ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || 'Unknown';
  }

  return { os, version };
}