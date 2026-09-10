import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { CategoryMeta } from '../types';
import { Wordmark, IconArrow, CourtArc, CATEGORY_ICONS } from './Icons';
import InfoSheet from './InfoSheet';
import { tapFeedback } from '../lib/native';

export default function Home() {
  const { state, dispatch, loadCategories, loading, error, savedGame, resumeGame, storageWarning } = useGame();
  const [info, setInfo] = useState<'rules' | 'privacy' | 'category' | null>(null);
  const [category, setCategory] = useState<CategoryMeta>();
  useEffect(() => { void loadCategories(); }, [loadCategories]);
  const totalQ = state.categories.reduce((sum, cat) => sum + cat.questionCount, 0);
  const savedGameFinished = savedGame?.state.phase === 'game-over';

  return (
    <main className="ht-app home-screen">
      <div className="ht-paper-grain" aria-hidden="true" />
      <div className="ht-shell">
        <header className="ht-topbar">
          <Wordmark />
          <button className="ht-text-button" onClick={() => setInfo('rules')}>How to play <span aria-hidden="true">↗</span></button>
        </header>
        <section className="home-hero">
          <CourtArc style={{ position: 'absolute', top: -72, right: -170, width: 440, height: 440 }} opacity={0.13} />
          <div className="home-tagline"><span className="ht-mono">The basketball trivia club</span><span className="home-rule" /></div>
          <h1 className="ht-display home-title" data-screen-title tabIndex={-1}>Drop<br /><em>Dimes.</em></h1>
          <p className="home-sub">Two teams. Five categories. One scoreboard.<br />Bring your crew. Prove you know the game.</p>
          <div className="home-game-meta"><span className="status-dot" /> Pass & play <span aria-hidden="true">/</span> Works offline</div>
          {savedGame && (
            <section className="resume-card" aria-label="Saved match">
              <div className="resume-top"><span className="ht-label">{savedGameFinished ? 'Your last game' : 'Still on the clock'}</span><span className="ht-mono">{Object.keys(savedGame.state.answeredSlots).length}/{savedGame.state.totalSlots} played</span></div>
              <p>{savedGame.state.teams[0].name} <strong>{savedGame.state.teams[0].score} : {savedGame.state.teams[1].score}</strong> {savedGame.state.teams[1].name}</p>
              <button className="ht-btn-primary" onClick={() => { tapFeedback(); resumeGame(); }}><span>{savedGameFinished ? 'View Results' : 'Resume Game'}</span><IconArrow /></button>
            </section>
          )}
          {error && state.categories.length === 0 ? (
            <div className="ht-error" role="alert"><p>{error}</p><button className="ht-btn-primary" onClick={loadCategories} disabled={loading}>Try again <IconArrow /></button></div>
          ) : (
            <button className={`ht-btn-primary ${savedGame ? 'is-outline' : 'is-orange'}`} onClick={() => { tapFeedback(); dispatch({ type: 'START_SETUP' }); }} disabled={state.categories.length === 0}>
              <span>{savedGame ? 'New Game' : state.categories.length ? 'Start Game' : 'Getting the court ready…'}</span><IconArrow />
            </button>
          )}
          {storageWarning && <p className="ht-notice" role="status">{storageWarning}</p>}
        </section>
        <section className="home-stats" aria-label="Game at a glance">
          <div className="home-stat"><span className="home-stat-num">{totalQ || '—'}</span><span className="home-stat-lbl">Questions</span></div>
          <div className="home-stat"><span className="home-stat-num">{state.categories.length || '5'}</span><span className="home-stat-lbl">Categories</span></div>
          <div className="home-stat"><span className="home-stat-num">2×</span><span className="home-stat-lbl">Power play</span></div>
        </section>
        <section className="home-categories" aria-labelledby="categories-title">
          <div className="home-cats-title"><h2 className="ht-label" id="categories-title">Know your court</h2><span className="ht-mono">Explore the categories</span></div>
          <div className="home-cats">
            {state.categories.map((cat, i) => {
              const CatIcon = CATEGORY_ICONS[cat.id];
              return <button key={cat.id} className="home-cat-row" style={{ '--cat-color': cat.color } as React.CSSProperties} onClick={() => { setCategory(cat); setInfo('category'); }} aria-label={`Preview ${cat.label}`}>
                <span className="home-cat-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="home-cat-icon">{CatIcon && <CatIcon size={19} />}</span>
                <span className="home-cat-label">{cat.label}</span>
                <span className="home-cat-count">{cat.questionCount} Q</span><IconArrow size={16} />
              </button>;
            })}
          </div>
        </section>
        <footer className="ht-footer"><span className="ht-mono">Made for the love of the game.</span><button className="ht-privacy-link" onClick={() => setInfo('privacy')}>Privacy</button></footer>
      </div>
      {info && <InfoSheet view={info} category={category} onClose={() => setInfo(null)} />}
    </main>
  );
}
