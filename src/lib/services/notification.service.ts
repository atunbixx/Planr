export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
  silent?: boolean;
}

export class NotificationService {
  private permission: NotificationPermission = 'default';
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;
  private isEnabled: boolean = true;
  private soundEnabled: boolean = true;

  constructor() {
    this.init();
  }

  private async init() {
    // Check if notifications are supported
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      // Request permission if not already granted
      if (this.permission === 'default') {
        this.requestPermission();
      }
    }

    // Initialize audio context
    if ('AudioContext' in window) {
      this.audioContext = new AudioContext();
      await this.loadNotificationSound();
    }

    // Load preferences from localStorage
    this.loadPreferences();

    // Listen for visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.clearBadge();
        }
      });
    }
  }

  private loadPreferences() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        this.isEnabled = prefs.enabled ?? true;
        this.soundEnabled = prefs.soundEnabled ?? true;
      }
    }
  }

  private savePreferences() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_preferences', JSON.stringify({
        enabled: this.isEnabled,
        soundEnabled: this.soundEnabled
      }));
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isEnabled || !this.canShowNotifications()) {
      return null;
    }

    try {
      // Play sound if enabled
      if (this.soundEnabled && !options.silent) {
        await this.playSound();
      }

      // Create notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent || !this.soundEnabled,
        data: options.data,
        actions: options.actions
      });

      // Handle notification clicks
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Navigate to relevant page if data is provided
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  async showMessageNotification(message: {
    senderName: string;
    content: string;
    threadId: string;
    vendorName?: string;
  }) {
    const title = message.vendorName || message.senderName;
    const body = message.content.length > 100 
      ? message.content.substring(0, 100) + '...' 
      : message.content;

    await this.show({
      title,
      body,
      tag: `message-${message.threadId}`,
      data: {
        url: `/dashboard/messages?thread=${message.threadId}`
      },
      requireInteraction: false
    });
  }

  private canShowNotifications(): boolean {
    return 'Notification' in window && 
           this.permission === 'granted' && 
           document.visibilityState === 'hidden';
  }

  private async loadNotificationSound() {
    if (!this.audioContext) return;

    try {
      // Use a simple sine wave beep for notification
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.frequency.value = 800; // 800 Hz
      oscillator.type = 'sine';
      
      // Create envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Store as a function to create fresh oscillator each time
      this.playSound = async () => {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 800;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
      };
    } catch (error) {
      console.error('Error loading notification sound:', error);
    }
  }

  async playSound() {
    // Will be overridden by loadNotificationSound
  }

  updateBadge(count: number) {
    if ('navigator' in window && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count);
        } else {
          (navigator as any).clearAppBadge();
        }
      } catch (error) {
        console.error('Error updating app badge:', error);
      }
    }

    // Update favicon with badge
    this.updateFaviconBadge(count);
  }

  clearBadge() {
    this.updateBadge(0);
  }

  private updateFaviconBadge(count: number) {
    if (typeof document === 'undefined') return;

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 32, 32);

      if (count > 0) {
        // Draw badge
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.beginPath();
        ctx.arc(24, 8, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Draw count
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count > 99 ? '99+' : count.toString(), 24, 8);
      }

      favicon.href = canvas.toDataURL('image/png');
    };

    img.src = favicon.href;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.savePreferences();
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    this.savePreferences();
  }

  isNotificationEnabled(): boolean {
    return this.isEnabled && this.permission === 'granted';
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}