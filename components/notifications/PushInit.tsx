"use client";

import React from 'react';
import { toast } from 'react-hot-toast';

type Props = {};

export default function PushInit(_props: Props) {
  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled (in-app & browser)');
      } else if (permission === 'denied') {
        toast.error('Notifications denied. You can enable them from browser settings.');
      } else {
        toast('Notification permission: ' + permission);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Notification permission request failed', e);
      toast.error('Failed to request notification permission');
    }
  };

  return (
    <div className='p-2'>
      <p className='text-xs text-muted-foreground mb-2'>Enable browser notifications to receive alerts while you are using the browser. Background push (when the browser is closed) has been removed.</p>
      <button className='btn' onClick={requestPermission}>Enable notifications</button>
    </div>
  );
}
