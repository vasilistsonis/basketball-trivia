import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Wordmark, IconArrow, CourtArc, CATEGORY_ICONS } from './Icons';

export default function Home() {
  const { state, dispatch, loadCategories, loading } = useGame();

  useEffect(() => {
    if (state.categories.length === 0) {
      loadCategories();
    }
  }, [state.categories.length, loadCategories]);

  const handleStart = () => {
    dispatch({ type: 'START_SETUP' });
  };

  const totalQ = state.categories.reduce((s, c) => s + c.questionCount, 0);

  return (
    <div className="ht-app">
      <div className="ht-paper-grain" />
      <div className="ht-shell">
        {/* Top bar */}
        <div className="ht-topbar">
          <Wordmark />
        </div>

        {/* Hero section */}
        <div className="home-hero">
          <CourtArc style={{
            position: 'absolute', top: -120, right: -140, width: 360, height: 360, opacity: 1
          }} opacity={0.09} />

          <div className="home-tagline">
            <span className="ht-mono">Season 26 · Vol. 01</span>
            <span style={{ flex: 1, height: 1, background: 'rgba(17,17,17,0.18)' }} />
          </div>

          <h1 className="ht-display home-title">
            Drop<br />
            <em>Dimes.</em>
          </h1>

          <p className="home-sub">
            Two teams. Five categories. One scoreboard. Pick your slots and prove you watch every game.
          </p>

          <button
            className="ht-btn-primary is-orange"
            onClick={handleStart}
            disabled={loading || state.categories.length === 0}
          >
            <span>{loading ? 'Loading...' : 'Start Game'}</span>
            <span className="arrow"><IconArrow color="#fff" /></span>
          </button>
        </div>

        {/* Stats row */}
        <div style={{ padding: '16px 22px 0' }}>
          <div className="home-stats">
            <div className="home-stat">
              <div className="home-stat-num">{totalQ || '—'}</div>
              <div className="home-stat-lbl">Questions</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-num">{state.categories.length || '—'}</div>
              <div className="home-stat-lbl">Categories</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-num">2×</div>
              <div className="home-stat-lbl">Power-ups</div>
            </div>
          </div>
        </div>

        {/* Categories list */}
        <div className="home-cats-title">
          <div className="ht-label">The Categories</div>
          <div className="ht-mono">Tap to preview</div>
        </div>
        <div className="home-cats">
          {state.categories.map((cat, i) => {
            const CatIcon = CATEGORY_ICONS[cat.id];
            return (
              <div
                key={cat.id}
                className="home-cat-row"
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <span className="home-cat-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="home-cat-name">
                  <span className="home-cat-stripe" />
                  {CatIcon && <CatIcon size={16} />}
                  <span className="home-cat-label">{cat.label}</span>
                </div>
                <span className="home-cat-count">{cat.questionCount} Q</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
