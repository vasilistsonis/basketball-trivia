import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { setStatusBar } from '../lib/native';

export interface ModalProps {
  children: ReactNode;
  title: string;
  onClose?: () => void;
  className?: string;
}

interface ModalEntry {
  host: HTMLDivElement;
  panel: HTMLDivElement;
  heading: HTMLHeadingElement | null;
  returnFocus: HTMLElement | null;
}

interface BackgroundState {
  inert: string | null;
  ariaHidden: string | null;
}

const modalStack: ModalEntry[] = [];
const backgroundStates = new Map<HTMLElement, BackgroundState>();
let backgroundObserver: MutationObserver | undefined;
let releaseScrollLock: (() => void) | undefined;

function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function restoreBackground(element: HTMLElement, state: BackgroundState) {
  restoreAttribute(element, 'inert', state.inert);
  restoreAttribute(element, 'aria-hidden', state.ariaHidden);
}

function isolateTopModal() {
  const top = modalStack[modalStack.length - 1];
  if (!top) {
    for (const [element, state] of backgroundStates) restoreBackground(element, state);
    backgroundStates.clear();
    return;
  }

  for (const element of Array.from(document.body.children)) {
    if (!(element instanceof HTMLElement)) continue;
    if (element === top.host) {
      const previous = backgroundStates.get(element);
      if (previous) restoreBackground(element, previous);
      continue;
    }
    if (!backgroundStates.has(element)) {
      backgroundStates.set(element, {
        inert: element.getAttribute('inert'),
        ariaHidden: element.getAttribute('aria-hidden'),
      });
    }
    element.setAttribute('inert', '');
    element.setAttribute('aria-hidden', 'true');
  }
}

function lockDocumentScroll() {
  const body = document.body;
  const root = document.documentElement;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const properties: Array<[HTMLElement, string]> = [
    [body, 'position'], [body, 'top'], [body, 'left'], [body, 'width'],
    [body, 'overflow'], [body, 'padding-right'], [root, 'overflow'],
    [root, 'overscroll-behavior'], [root, 'scroll-behavior'],
  ];
  const previous = properties.map(([element, property]) => ({
    element,
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }));
  const scrollbarWidth = window.innerWidth - root.clientWidth;
  const paddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

  // A fixed body also prevents background rubber-banding in iOS WKWebView.
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = `-${scrollX}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) body.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
  root.style.overflow = 'hidden';
  root.style.overscrollBehavior = 'none';
  root.style.scrollBehavior = 'auto';

  return () => {
    // Restore scroll before restoring a potentially smooth scroll behavior.
    for (const { element, property, value, priority } of previous) {
      if (property !== 'scroll-behavior') element.style.setProperty(property, value, priority);
    }
    window.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' });
    const scrollBehavior = previous[previous.length - 1];
    root.style.setProperty('scroll-behavior', scrollBehavior.value, scrollBehavior.priority);
  };
}

function focusHeading(entry: ModalEntry) {
  (entry.heading ?? entry.panel).focus({ preventScroll: true });
}

function focusableElements(panel: HTMLElement) {
  const selector = 'a[href], area[href], button, input, select, textarea, iframe, [contenteditable="true"], [tabindex]';
  return Array.from(panel.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const style = window.getComputedStyle(element);
    return element.tabIndex >= 0
      && !element.matches(':disabled')
      && !element.closest('[inert], [hidden], [aria-hidden="true"]')
      && style.visibility !== 'hidden'
      && element.getClientRects().length > 0;
  });
}

function restoreFocus(entry: ModalEntry) {
  const top = modalStack[modalStack.length - 1];
  const target = entry.returnFocus;
  if (target?.isConnected && !target.closest('[inert]') && !target.matches(':disabled')
      && (!top || top.panel.contains(target))) {
    target.focus({ preventScroll: true });
  } else if (top) {
    focusHeading(top);
  } else {
    // A completed question may remove or disable the tile that opened it.
    const app = document.getElementById('root');
    const fallback = app?.querySelector<HTMLElement>('h1, [data-screen-title]') ?? app;
    if (fallback) {
      const tabIndex = fallback.getAttribute('tabindex');
      fallback.tabIndex = -1;
      fallback.focus({ preventScroll: true });
      restoreAttribute(fallback, 'tabindex', tabIndex);
    }
  }
}

/** Accessible sheet shared by questions, instructions, and privacy information. */
export default function Modal({ children, title, onClose, className = '' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [host] = useState(() => typeof document === 'undefined' ? null : document.createElement('div'));

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!host || !panel) return;
    const entry: ModalEntry = {
      host,
      panel,
      heading: headingRef.current,
      returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    host.className = 'modal-portal';
    document.body.appendChild(host);
    setStatusBar(true);
    modalStack.push(entry);
    if (modalStack.length === 1) {
      releaseScrollLock = lockDocumentScroll();
      backgroundObserver = new MutationObserver(isolateTopModal);
      backgroundObserver.observe(document.body, { childList: true });
    }

    const isTop = () => modalStack[modalStack.length - 1] === entry;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === 'Escape' && onCloseRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      } else if (event.key === 'Tab') {
        const focusable = focusableElements(panel);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) {
          event.preventDefault();
          focusHeading(entry);
        } else if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isTop() && event.target instanceof Node && !panel.contains(event.target)) focusHeading(entry);
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn, true);
    // Move focus before hiding its previous container from assistive technology.
    focusHeading(entry);
    isolateTopModal();

    return () => {
      const wasTop = isTop();
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn, true);
      const index = modalStack.indexOf(entry);
      if (index !== -1) modalStack.splice(index, 1);
      host.remove();
      setStatusBar(!!document.querySelector('.go-shell'));
      if (modalStack.length === 0) {
        backgroundObserver?.disconnect();
        backgroundObserver = undefined;
      }
      isolateTopModal();
      if (modalStack.length === 0) {
        releaseScrollLock?.();
        releaseScrollLock = undefined;
      }
      if (wasTop) restoreFocus(entry);
    };
  }, [host]);

  if (!host) return null;
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && modalStack[modalStack.length - 1]?.host === host) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={`modal-panel ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId} ref={headingRef} tabIndex={-1}>{title}</h2>
          {onClose && (
            <button type="button" className="modal-close" onClick={onClose} aria-label={`Close ${title}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    host,
  );
}
