import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  IconArrow,
  IconBolt,
  IconTarget,
  IconCheck,
  IconCross,
  CATEGORY_ICONS,
} from './Icons';
import { sfx } from '../sound';
import { haptic } from '../native';

// Just past the 220ms sheetDown animation, so the board takes over as the sheet lands.
const CLOSE_MS = 230;

const pts = (n: number) => (n === 1 ? 'PT' : 'PTS');

export default function QuestionCard() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [closing, setClosing] = useState(false);

  const q = state.currentQuestion;

  useEffect(() => {
    if (q) sfx.open();
  }, [q?.id]);

  // The sheet slides away first; the answer is committed once it's gone.
  useEffect(() => {
    if (!closing || selected === null) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'ANSWER_QUESTION', selectedIndex: selected });
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [closing, selected, dispatch]);

  if (!q) return null;

  const currentTeam = state.teams[state.currentTeamIndex];
  const otherTeam = state.teams[state.currentTeamIndex === 0 ? 1 : 0];
  const currentPU = state.powerUps[state.currentTeamIndex];
  const isLastQuestion = Object.keys(state.answeredSlots).length + 1 >= state.totalSlots;

  // Compute effective points
  let displayPoints = q.points;
  let pointsSuffix = pts(q.points);
  if (state.activeDouble) {
    displayPoints = q.points * 2;
    pointsSuffix = `2× ${pts(displayPoints)}`;
  } else if (state.fiftyFiftyEliminated.length > 0) {
    displayPoints = Math.ceil(q.points * 0.5);
    pointsSuffix = '50/50';
  }

  // Find category info
  const catMeta = state.categories.find((c) => c.id === q.category);
  const CatIcon = CATEGORY_ICONS[q.category];

  const handleSelect = (idx: number) => {
    if (revealed || state.fiftyFiftyEliminated.includes(idx)) return;
    haptic.select();
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    if (selected === q.correctIndex) {
      sfx.correct();
      haptic.correct();
    } else {
      sfx.wrong();
      haptic.wrong();
    }
    setRevealed(true);
  };

  const handleContinue = () => {
    if (selected === null || closing) return;
    setClosing(true);
  };

  const canUseDouble =
    !currentPU.usedDouble &&
    !state.activeDouble &&
    state.fiftyFiftyEliminated.length === 0 &&
    !revealed;
  const canUseFifty =
    !currentPU.usedFiftyFifty &&
    state.fiftyFiftyEliminated.length === 0 &&
    !state.activeDouble &&
    !revealed;

  const isCorrect = selected !== null && selected === q.correctIndex;
  const closingClass = closing ? 'is-closing' : '';

  return (
    <div className={`q-overlay ${closingClass}`}>
      <div
        className={`q-sheet ${closingClass}`}
        style={{ '--cat-color': catMeta?.color || '#E85D1E' } as React.CSSProperties}
      >
        {/* Header: category + points */}
        <div className="q-head">
          <div className="q-cat">
            <span className="q-cat-stripe" />
            {CatIcon && <CatIcon size={14} />}
            <span className="q-cat-name">{catMeta?.label || q.category}</span>
          </div>
          <div className={`q-points ${state.activeDouble ? 'is-2x' : ''}`}>
            {displayPoints}
            <small>{pointsSuffix}</small>
          </div>
        </div>

        {/* Team prompt */}
        <div className="ht-mono" style={{ marginBottom: 2 }}>
          {currentTeam.name} · {revealed ? 'Result' : 'Lock in your answer'}
        </div>

        {/* Question image */}
        {q.imageUrl && (
          <div className="q-image-wrap">
            <img src={q.imageUrl} alt="Question image" className="q-image" />
          </div>
        )}

        {/* Question text */}
        <p className="q-text">{q.question}</p>

        {/* Options */}
        <div className="q-options">
          {q.options.map((opt, idx) => {
            const eliminated = state.fiftyFiftyEliminated.includes(idx);
            let cls = 'q-opt';
            let mark: React.ReactNode = null;

            if (eliminated) {
              cls += ' is-elim';
            } else if (revealed) {
              if (idx === q.correctIndex) {
                cls += ' is-correct';
                mark = <IconCheck size={16} color="#fff" />;
              } else if (idx === selected) {
                cls += ' is-wrong';
                mark = <IconCross size={14} color="var(--crimson)" />;
              } else {
                cls += ' is-wrong';
              }
            } else if (idx === selected) {
              cls += ' is-selected';
            }

            return (
              <button
                key={idx}
                className={cls}
                onClick={() => handleSelect(idx)}
                disabled={eliminated || revealed}
              >
                <span className="q-opt-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="q-opt-text">{opt}</span>
                {mark && <span className="q-opt-mark">{mark}</span>}
              </button>
            );
          })}
        </div>

        {/* Power-ups (before reveal) */}
        {!revealed && (
          <div className="q-powerups">
            <button
              className={`q-pu ${state.activeDouble ? 'used' : ''}`}
              disabled={!canUseDouble}
              onClick={() => { sfx.powerUp(); dispatch({ type: 'USE_DOUBLE' }); }}
            >
              <span className="icon"><IconBolt size={14} color="#F2EEE5" /></span>
              <span>
                <div className="lbl">Double Up</div>
                <div className="sub">2× the points</div>
              </span>
            </button>
            <button
              className={`q-pu ${state.fiftyFiftyEliminated.length > 0 ? 'used' : ''}`}
              disabled={!canUseFifty}
              onClick={() => { sfx.powerUp(); dispatch({ type: 'USE_FIFTY_FIFTY' }); }}
            >
              <span className="icon"><IconTarget size={14} color="#F2EEE5" /></span>
              <span>
                <div className="lbl">Fifty Fifty</div>
                <div className="sub">Drop two wrong</div>
              </span>
            </button>
          </div>
        )}

        {/* Result / Actions */}
        {revealed ? (
          <>
            <div className={`q-result ${isCorrect ? 'correct' : 'wrong'}`}>
              {isCorrect
                ? <IconCheck size={20} color="#fff" />
                : <IconCross size={20} color="#F2EEE5" />
              }
              <div className="copy">
                {isCorrect ? 'Bucket!' : 'Wrong call.'}
                <small>
                  {isCorrect
                    ? `+${displayPoints} ${pts(displayPoints)}`
                    : `+0 PTS · Answer was ${q.options[q.correctIndex]}`
                  }
                </small>
              </div>
            </div>
            <button className="ht-btn-primary" onClick={handleContinue} disabled={closing}>
              <span>{isLastQuestion ? 'See the Final Score' : `Next Up · ${otherTeam.name}`}</span>
              <span className="arrow"><IconArrow /></span>
            </button>
          </>
        ) : (
          <button
            className="ht-btn-primary is-orange"
            disabled={selected === null}
            onClick={handleConfirm}
          >
            <span>
              {selected !== null
                ? `Lock In ${String.fromCharCode(65 + selected)}`
                : 'Select an Answer'
              }
            </span>
            <span className="arrow"><IconArrow color="#fff" /></span>
          </button>
        )}
      </div>
    </div>
  );
}
