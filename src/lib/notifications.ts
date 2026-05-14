import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Batch, Recipe } from './beerjson/types';

/**
 * Configure notification handler.
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a local notification.
 */
export async function scheduleNotification(options: {
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger: Date;
  identifier?: string;
}): Promise<string> {
  const { title, body, data, trigger, identifier } = options;

  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: {
      date: trigger,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });
}

/**
 * Cancel all notifications for a batch.
 */
export async function cancelBatchNotifications(batchId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier?.startsWith(`batch-${batchId}`)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/**
 * Cancel a specific notification.
 */
export async function cancelNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Schedule all relevant notifications for a batch based on its fermentation steps.
 */
export async function scheduleBatchNotifications(batch: Batch, recipe: Recipe) {
  const batchId = batch.id;
  const baseId = `batch-${batchId}`;

  // Cancel any existing notifications for this batch
  await cancelBatchNotifications(batchId);

  const now = Date.now();
  const startedAt = new Date(batch.started_at).getTime();

  // Gravity check reminder (3 days after pitch)
  const gravityCheckTime = startedAt + 3 * 24 * 60 * 60 * 1000;
  if (gravityCheckTime > now) {
    await scheduleNotification({
      identifier: `${baseId}-gravity`,
      title: `${recipe.name}`,
      body: "Day 3 — time to check gravity and see how fermentation's tracking.",
      data: { batchId, type: 'gravity_check' },
      trigger: new Date(gravityCheckTime),
    });
  }

  // Schedule based on fermentation steps
  const steps = recipe.process?.fermentation?.steps ?? [];
  let stepOffsetMs = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepName = step.name ?? `Step ${i + 1}`;
    const durationHrs = step.duration_hours ?? 168;
    const stepStartMs = startedAt + stepOffsetMs;
    const stepEndMs = stepStartMs + durationHrs * 60 * 60 * 1000;

    // Reminder at the end of each step
    if (stepEndMs > now) {
      await scheduleNotification({
        identifier: `${baseId}-step-${i}`,
        title: `${recipe.name}`,
        body: `${stepName} complete. ${i < steps.length - 1 ? 'Time for the next step.' : 'Your beer is ready.'}`,
        data: { batchId, type: 'step_complete', stepIndex: i },
        trigger: new Date(stepEndMs),
      });
    }

    stepOffsetMs += durationHrs * 60 * 60 * 1000;
  }

  // Estimated ready notification
  if (batch.estimated_ready_at) {
    const readyTime = new Date(batch.estimated_ready_at).getTime();
    if (readyTime > now) {
      await scheduleNotification({
        identifier: `${baseId}-ready`,
        title: `${recipe.name} is ready`,
        body: "Time to package. Your patience has paid off.",
        data: { batchId, type: 'ready' },
        trigger: new Date(readyTime),
      });
    }
  }
}

/**
 * Schedule a brew day reminder.
 */
export async function scheduleBrewDayReminder(batch: Batch, hoursBefore: number = 12) {
  const batchId = batch.id;
  const reminderTime = Date.now() + hoursBefore * 60 * 60 * 1000;

  await scheduleNotification({
    identifier: `batch-${batchId}-brewday`,
    title: `Brew day tomorrow`,
    body: `${batch.recipe_snapshot.name} — get your water ready.`,
    data: { batchId, type: 'brew_day_reminder' },
    trigger: new Date(reminderTime),
  });
}
