'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: ConnectionType;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: EventListener): void;
  removeEventListener(type: 'change', listener: EventListener): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<ConnectionType>('unknown');
  const [downlink, setDownlink] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Set initial online state
    setIsOnline(navigator.onLine);

    // Get network information
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    const updateNetworkInfo = () => {
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        setDownlink(connection.downlink || null);
        
        // Show warning for slow connections
        const slowConnections: ConnectionType[] = ['slow-2g', '2g'];
        setShowWarning(slowConnections.includes(connection.effectiveType || 'unknown'));
      }
    };

    updateNetworkInfo();

    // Event listeners
    const handleOnline = () => {
      setIsOnline(true);
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowWarning(false);
    };

    const handleConnectionChange = () => {
      updateNetworkInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const getConnectionQuality = () => {
    if (!isOnline) return { text: 'Offline', color: 'text-red-600', icon: WifiOff };
    
    switch (connectionType) {
      case '4g':
      case 'wifi':
        return { text: 'Good', color: 'text-green-600', icon: Wifi };
      case '3g':
        return { text: 'Fair', color: 'text-yellow-600', icon: Wifi };
      case '2g':
      case 'slow-2g':
        return { text: 'Poor', color: 'text-orange-600', icon: AlertCircle };
      default:
        return { text: 'Unknown', color: 'text-gray-600', icon: Wifi };
    }
  };

  const { text, color, icon: Icon } = getConnectionQuality();

  // Only show in development or when there's a poor connection
  if (process.env.NODE_ENV === 'production' && isOnline && !showWarning) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-30">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 max-w-xs">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <div className="text-sm">
            <p className={`font-medium ${color}`}>
              Network: {text}
            </p>
            {isOnline && connectionType !== 'unknown' && (
              <p className="text-xs text-gray-600">
                Type: {connectionType.toUpperCase()}
                {downlink && ` • ${downlink} Mbps`}
              </p>
            )}
            {showWarning && (
              <p className="text-xs text-orange-600 mt-1">
                Slow connection detected. Some features may be limited.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}