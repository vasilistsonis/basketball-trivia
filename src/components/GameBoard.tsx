import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Scoreboard from './Scoreboard';

export default function GameBoard() {
  const { state, categories, loadCategories, selectSlot, loading } = useGame();

  useEffect(() => {
    if (categories.length === 0) {
      loadCategories();
    }
  }, [categories.length, loadCategories]);

  const handleSlotClick = (slotKey: string) => {
    if (state.answeredSlots[slotKey] || loading) return;
    selectSlot(slotKey);
  };

  const currentTeam = state.teams[state.currentTeamIndex];

  return (
    <div className="screen game-screen">
      <Scoreboard />

      <div className="turn-indicator" style={{ borderColor: currentTeam.color }}>
        <span className="turn-dot" style={{ backgroundColor: currentTeam.color }} />
        <strong>{currentTeam.name}</strong>'s turn
      </div>

      {loading && <div className="loading-indicator">Loading question...</div>}

      <div className="board">
        {categories.map((cat) => (
          <div key={cat.id} className="category-column">
            <div className="category-header">
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </div>
            <div className="slots">
              {cat.slots.map((slot) => {
                const answered = state.answeredSlots[slot.key];
                return (
                  <button
                    key={slot.key}
                    className={`slot-btn ${answered ? 'answered' : ''} ${
                      answered?.correct ? 'correct' : answered ? 'wrong' : ''
                    }`}
                    disabled={!!answered || loading}
                    onClick={() => handleSlotClick(slot.key)}
                    style={
                      answered
                        ? { borderColor: state.teams[answered.answeredByTeam].color }
                        : undefined
                    }
                  >
                    {answered ? (answered.correct ? '✓' : '✗') : `${slot.points}pt`}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
