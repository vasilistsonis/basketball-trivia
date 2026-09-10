import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

export function tapFeedback() {
  if (Capacitor.isNativePlatform()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export function answerFeedback(correct: boolean) {
  if (Capacitor.isNativePlatform()) void Haptics.notification({ type: correct ? NotificationType.Success : NotificationType.Warning }).catch(() => {});
}

export function setStatusBar(darkBackground: boolean) {
  const darkSurface = darkBackground || !!document.querySelector('.modal-portal');
  if (Capacitor.isNativePlatform()) void StatusBar.setStyle({ style: darkSurface ? Style.Dark : Style.Light }).catch(() => {});
}

export async function shareResult(text: string): Promise<'shared' | 'copied' | 'cancelled'> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: 'Hoops Trivia · Final score', text, dialogTitle: 'Share the final score' });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title: 'Hoops Trivia · Final score', text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    if (error instanceof Error && /cancel|abort|dismiss/i.test(error.message + error.name)) return 'cancelled';
    throw error;
  }
}
