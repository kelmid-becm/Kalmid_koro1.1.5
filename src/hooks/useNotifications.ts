import { AppTranslations } from '../locales/translations';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarEvent } from '../types';

export function useNotifications() {
  /**
   * Triggers a browser notification.
   */
  const triggerNotification = (title: string, body: string, tag: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/app-icon.png',
        tag,
        requireInteraction: true
      });
    }
  };

  /**
   * Plans the reminder logic.
   * This function should be called within a timer/effect
   * in the component that tracks the current time.
   */
  const scheduleReminder = (
    event: CalendarEvent, 
    now: Date, 
    isAlarm: boolean, 
    t: AppTranslations
  ): { shouldFire: boolean, type: 'alarm' | 'reminder' } | null => {
    
    if (event.isCompleted) return null;

    if (isAlarm) {
        if (!event.enableAlarm || event.alarmFired) return null;
        const targetTime = event.snoozeTime ? new Date(event.snoozeTime) : new Date(event.startTime);
        if (now.getTime() >= targetTime.getTime() && (now.getTime() - targetTime.getTime() < 60000)) {
            return { shouldFire: true, type: 'alarm' };
        }
    } else {
        if (event.reminded || event.priority !== 'high') return null;
        const startTime = new Date(event.startTime);
        const diff = startTime.getTime() - now.getTime();
        if (diff > 0 && diff <= 30 * 60 * 1000 && diff > 29 * 60 * 1000) {
            return { shouldFire: true, type: 'reminder' };
        }
    }
    return null;
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    return await Notification.requestPermission();
  };

  return {
    triggerNotification,
    scheduleReminder,
    requestPermission
  };
}
