// ── Native touches (iOS) ──
// Thin wrappers around Capacitor plugins. Everything here is a no-op in a
// plain browser, so the web build and the headless screenshot checks run
// without them.

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();

/** Light status-bar text over the dark results screen, dark text over paper elsewhere. */
export function setStatusBarForDarkScreen(dark: boolean) {
  if (!native) return;
  // Capacitor names the style after the background it sits on: Dark = light text.
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
}

// Reserved for the moments that matter — picking an answer, the verdict,
// the final buzzer — so they stay meaningful.
export const haptic = {
  select: () => {
    if (native) Haptics.selectionChanged().catch(() => {});
  },
  correct: () => {
    if (native) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  },
  wrong: () => {
    if (native) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  },
  final: () => {
    if (native) Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
  },
};
