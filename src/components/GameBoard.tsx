import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Scoreboard from './Scoreboard';
import { Wordmark, IconBolt, IconTarget, IconCheck, IconCross, CATEGORY_ICONS } from './Icons';

export default function GameBoard() {
  const { state, loadCategories, selectSlot, dispatch, loading } = useGame();

  useEffect(() => {
    if (state.categories.length === 0) {
      loadCategories();
    }
  }, [state.categories.length, loadCategories]);

  const handleSlotClick = (slotKey: string) => {
    if (state.answeredSlots[slotKey] || loading) return;
    selectSlot(slotKey);
  };

  const currentTeam = state.teams[state.currentTeamIndex];
  const currentPU = state.powerUps[state.currentTeamIndex];
  const answeredCount = Object.keys(state.answeredSlots).length;

  return (
    <div className="ht-app">
      <div className="ht-paper-grain" />
      <div className="ht-shell" style={{ padding: 0 }}>
        {/* Top bar */}
        <div className="ht-topbar" style={{ paddingBottom: 8 }}>
          <button className="ht-back-btn" onClick={() => dispatch({ type: 'GO_HOME' })}>Quit</button>
          <div className="ht-mono">Q {answeredCount + 1} / {state.totalSlots}</div>
          <Wordmark />
        </div>

        {/* Score & turn indicator */}
        <div className="board-top">
          <Scoreboard />

          <div
            className="turn-bar"
            style={{ '--team-color': currentTeam.color } as React.CSSProperties}
          >
            <div className="left">
              <span className="turn-dot" style={{ background: currentTeam.color }} />
              <span>{currentTeam.name} · On the Ball</span>
            </div>
            <div className="turn-pus">
              {!currentPU.usedDouble && (
                <span className="pu-pill"><IconBolt size={9} /> 2×</span>
              )}
              {!currentPU.usedFiftyFifty && (
                <span className="pu-pill"><IconTarget size={9} /> 50·50</span>
              )}
            </div>
          </div>
        </div>

        {loading && <div className="loading-indicator">Loading question...</div>}

        {/* Jeopardy-style board */}
        <div className="board-grid" style={{ '--cols': state.categories.length } as React.CSSProperties}>
          {state.categories.map((cat) => {
            const CatIcon = CATEGORY_ICONS[cat.id];
            return (
              <div key={cat.id} className="board-col">
                <div className="col-head" style={{ '--cat-color': cat.color } as React.CSSProperties}>
                  <div className="col-icon">{CatIcon && <CatIcon size={20} />}</div>
                  <div className="col-label">{cat.label}</div>
                </div>
                {cat.slots.map((slot) => {
                  const answered = state.answeredSlots[slot.key];
                  if (answered) {
                    const teamColor = state.teams[answered.answeredByTeam].color;
                    return (
                      <button
                        key={slot.key}
                        className={`slot answered ${answered.correct ? 'correct' : 'wrong'}`}
                        style={{ borderColor: teamColor }}
                        disabled
                      >
                        {answered.correct
                          ? <IconCheck size={20} color="#fff" />
                          : <IconCross size={20} color="#F2EEE5" />
                        }
                        <span
                          className="stamp"
                          style={{
                            color: answered.correct
                              ? 'rgba(255,255,255,0.85)'
                              : 'rgba(242,238,229,0.6)',
                          }}
                        >
                          T{answered.answeredByTeam + 1}·{slot.points}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={slot.key}
                      className="slot"
                      onClick={() => handleSlotClick(slot.key)}
                      disabled={loading}
                    >
                      {slot.points}
                      <span className="stamp">PT{slot.points > 1 ? 'S' : ''}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
