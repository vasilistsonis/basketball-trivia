import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function QuestionCard() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const q = state.currentQuestion;
  if (!q) return null;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  const handleContinue = () => {
    if (selected === null) return;
    dispatch({ type: 'ANSWER_QUESTION', selectedIndex: selected });
    setSelected(null);
    setRevealed(false);
  };

  const currentTeam = state.teams[state.currentTeamIndex];

  return (
    <div className="overlay">
      <div className="question-card">
        <div className="question-header">
          <span className="question-points">{q.points} pt{q.points > 1 ? 's' : ''}</span>
          <span className="question-team" style={{ color: currentTeam.color }}>
            {currentTeam.name}
          </span>
        </div>

        <p className="question-text">{q.question}</p>

        <div className="options">
          {q.options.map((opt, idx) => {
            let cls = 'option-btn';
            if (revealed) {
              if (idx === q.correctIndex) cls += ' correct';
              else if (idx === selected) cls += ' wrong';
            } else if (idx === selected) {
              cls += ' selected';
            }
            return (
              <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
                {opt}
              </button>
            );
          })}
        </div>

        {!revealed ? (
          <button
            className="btn btn-primary"
            disabled={selected === null}
            onClick={handleConfirm}
          >
            Lock In Answer
          </button>
        ) : (
          <div className="result-area">
            <p className={selected === q.correctIndex ? 'result-correct' : 'result-wrong'}>
              {selected === q.correctIndex
                ? `✓ Correct! +${q.points} point${q.points > 1 ? 's' : ''}`
                : `✗ Wrong! The answer was: ${q.options[q.correctIndex]}`}
            </p>
            <button className="btn btn-primary" onClick={handleContinue}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
