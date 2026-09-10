import { Component, type ReactNode } from 'react';
import { IconArrow, IconBasketball, Wordmark } from './Icons';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="ht-app recovery-screen">
        <main className="ht-shell">
          <div className="ht-topbar"><Wordmark /></div>
          <div className="home-hero" role="alert">
            <span aria-hidden="true"><IconBasketball size={42} /></span>
            <p className="ht-mono">A quick timeout</p>
            <h1 className="ht-display recovery-title">Let’s get<br />back in play.</h1>
            <p className="home-sub">Something interrupted the app. Reload to try again. Your saved game will stay on this device.</p>
            <button type="button" className="ht-btn-primary is-orange" onClick={() => window.location.reload()}>
              <span>Reload app</span>
              <span className="arrow" aria-hidden="true"><IconArrow /></span>
            </button>
          </div>
        </main>
      </div>
    );
  }
}
