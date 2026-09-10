import { useState } from 'react';
import { useGame } from '../context/GameContext';
import Scoreboard from './Scoreboard';
import InfoSheet from './InfoSheet';
import Modal from './Modal';
import { Wordmark, IconBolt, IconTarget, IconCheck, IconCross, CATEGORY_ICONS } from './Icons';
import { tapFeedback } from '../lib/native';

export default function GameBoard() {
  const { state, selectSlot, dispatch, loading, error, clearError, storageWarning } = useGame();
  const [menu, setMenu] = useState(false);
  const [rules, setRules] = useState(false);
  const currentTeam = state.teams[state.currentTeamIndex];
  const currentPU = state.powerUps[state.currentTeamIndex];
  const answeredCount = Object.keys(state.answeredSlots).length;

  return <main className="ht-app board-screen">
    <div className="ht-paper-grain" aria-hidden="true" />
    <div className="ht-shell">
      <header className="ht-topbar"><button className="ht-back-btn" onClick={() => setMenu(true)}>Pause</button><Wordmark /><span className="ht-mono">{answeredCount}/{state.totalSlots}</span></header>
      <h1 className="sr-only" data-screen-title tabIndex={-1}>Game board</h1>
      <div className="board-top">
        <Scoreboard />
        <div className="turn-bar" style={{ '--team-color': currentTeam.color } as React.CSSProperties} aria-live="polite">
          <div className="turn-copy"><span className="turn-dot" /><span><strong>{currentTeam.name}</strong><span className="turn-caption">Your ball. Pick a question.</span></span></div>
          <div className="turn-pus" aria-label="Available power-ups">{!currentPU.usedDouble && <span className="pu-pill" aria-label="Double Up available"><IconBolt size={13} /> 2×</span>}{!currentPU.usedFiftyFifty && <span className="pu-pill" aria-label="Fifty Fifty available"><IconTarget size={13} /> ½</span>}</div>
        </div>
      </div>
      <div className="board-caption"><h2 className="ht-label">Pick your shot</h2><span className="ht-mono">More points. More pressure.</span></div>
      {loading && <p className="loading-indicator" role="status">Getting your question…</p>}
      {error && <div className="ht-error-banner" role="alert"><span>{error}</span><button className="modal-close" onClick={clearError} aria-label="Dismiss error">×</button></div>}
      {storageWarning && <p className="board-notice ht-notice" role="status">{storageWarning}</p>}
      <div className="board-grid" aria-label="Question board">
        {state.categories.map((cat, index) => {
          const CatIcon = CATEGORY_ICONS[cat.id];
          const completed = cat.slots.filter(slot => state.answeredSlots[slot.key]).length;
          return <section key={cat.id} className={`board-col ${completed === cat.slots.length ? 'is-complete' : ''}`} style={{ '--cat-color': cat.color } as React.CSSProperties} aria-label={cat.label}>
            <div className="col-head"><span className="col-icon">{CatIcon && <CatIcon size={19} />}</span><h3 className="col-label">{cat.label}</h3><span className="col-number">0{index + 1}</span></div>
            <div className="board-slots" style={{ '--slots': cat.slots.length } as React.CSSProperties}>{cat.slots.map(slot => {
              const answered = state.answeredSlots[slot.key];
              return <button key={slot.key} className={`slot ${answered ? `answered ${answered.correct ? 'correct' : 'wrong'}` : ''}`} disabled={!!answered || loading || state.phase !== 'playing'} onClick={() => { tapFeedback(); void selectSlot(slot.key); }} aria-label={answered ? `${cat.label}, ${slot.points} points: ${state.teams[answered.answeredByTeam].name}, ${answered.correct ? 'correct' : 'incorrect'}` : `${cat.label}, ${slot.points} ${slot.points === 1 ? 'point' : 'points'}`}>
                {answered ? <>{answered.correct ? <IconCheck size={22} /> : <IconCross size={18} />}<span className="stamp">Team {answered.answeredByTeam + 1}</span></> : <><span className="slot-points">{slot.points}</span><span className="stamp">{slot.points === 1 ? 'Point' : 'Points'}</span><span className="slot-dots" aria-hidden="true">{'•'.repeat(Math.min(slot.points, 3))}</span></>}
              </button>;
            })}</div>
          </section>;
        })}
      </div>
      <div className="board-progress"><progress value={answeredCount} max={state.totalSlots} aria-label="Match progress" /><span className="ht-mono">{state.totalSlots - answeredCount} questions left on the court</span></div>
    </div>
    {menu && <Modal title="Time out." onClose={() => setMenu(false)}><div className="info-copy"><p>{storageWarning ? 'Your match is paused. Keep playing to finish this game.' : 'Your match is saved on this device. Come back whenever you’re ready.'}</p></div><div className="pause-actions"><button className="ht-btn-primary" onClick={() => setMenu(false)}>Keep Playing</button><button className="ht-btn-ghost" onClick={() => { setMenu(false); setRules(true); }}>How to Play</button><button className="ht-text-button" onClick={() => dispatch({ type: 'GO_HOME' })}>Save & Exit</button></div></Modal>}
    {rules && <InfoSheet view="rules" onClose={() => setRules(false)} />}
  </main>;
}
