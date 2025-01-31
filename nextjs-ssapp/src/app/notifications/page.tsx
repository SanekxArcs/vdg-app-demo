'use client';

import { Layout } from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { Notification } from '@/types';

const notifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'Low Stock Alert',
    message: 'Steel Pipes inventory is below minimum threshold',
    type: 'warning',
    read: false,
    createdAt: new Date('2024-03-10T10:00:00'),
  },
  {
    id: '2',
    userId: '1',
    title: 'Project Update',
    message: 'Project "Building A" has been marked as completed',
    type: 'success',
    read: true,
    createdAt: new Date('2024-03-09T15:30:00'),
  },
  {
    id: '3',
    userId: '1',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on March 15th',
    type: 'info',
    read: false,
    createdAt: new Date('2024-03-08T09:00:00'),
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function NotificationsPage() {
  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
            <div className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
              {notifications.filter(n => !n.read).length}
            </div>
          </div>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? 'opacity-60' : ''}>
              <CardContent className="flex items-start space-x-4 p-6">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}