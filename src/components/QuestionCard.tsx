import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { IconArrow, IconBolt, IconTarget, IconCheck, IconCross, CATEGORY_ICONS } from './Icons';
import Modal from './Modal';
import { answerFeedback, tapFeedback } from '../lib/native';

export default function QuestionCard() {
  const { state, dispatch } = useGame();
  const [imageFailed, setImageFailed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const q = state.currentQuestion;
  const selected = state.selectedAnswerIndex;
  const revealed = state.answerRevealed;
  useEffect(() => { if (revealed) resultRef.current?.focus({ preventScroll: true }); }, [revealed]);
  useEffect(() => { setImageFailed(false); }, [q?.id]);
  if (!q) return null;
  const currentTeam = state.teams[state.currentTeamIndex];
  const otherTeam = state.teams[state.currentTeamIndex === 0 ? 1 : 0];
  const currentPU = state.powerUps[state.currentTeamIndex];
  const displayPoints = state.activeDouble ? q.points * 2 : state.fiftyFiftyEliminated.length ? Math.ceil(q.points / 2) : q.points;
  const cat = state.categories.find(c => c.id === q.category);
  const CatIcon = CATEGORY_ICONS[q.category];
  const canDouble = !currentPU.usedDouble && !state.activeDouble && !state.fiftyFiftyEliminated.length && !revealed;
  const canFifty = !currentPU.usedFiftyFifty && !state.fiftyFiftyEliminated.length && !state.activeDouble && !revealed;
  const correct = selected === q.correctIndex;
  const lastQuestion = revealed && Object.keys(state.answeredSlots).length >= state.totalSlots;

  return <Modal title={`${cat?.label ?? 'Question'} · ${displayPoints} ${displayPoints === 1 ? 'point' : 'points'}`} className="q-sheet">
    <div className="q-head" style={{ '--cat-color': cat?.color ?? '#E85D1E' } as React.CSSProperties}>
      <span className="q-cat-icon">{CatIcon && <CatIcon size={20} />}</span>
      <span className="q-team"><strong>{currentTeam.name}</strong><span className="ht-mono">{revealed ? 'The call is in' : 'Make your shot'}</span></span>
      <span className={`q-points ${state.activeDouble ? 'is-2x' : ''}`}>{displayPoints}<small>{state.activeDouble ? 'Double up' : state.fiftyFiftyEliminated.length ? 'Fifty fifty' : 'Points'}</small></span>
    </div>
    {q.imageUrl && !imageFailed && <div className="q-image-wrap"><img className="q-image" src={q.imageUrl} alt="Basketball visual clue for this question" onError={() => setImageFailed(true)} /></div>}
    {imageFailed && <p className="ht-notice" role="status">The visual clue couldn’t load. Save your game and reconnect to try it again.</p>}
    <p className="q-text" id="question-text">{q.question}</p>
    <div className="q-options" role="group" aria-labelledby="question-text">
      {q.options.map((option, index) => {
        const eliminated = state.fiftyFiftyEliminated.includes(index);
        const cls = eliminated ? 'is-elim' : revealed ? index === q.correctIndex ? 'is-correct' : index === selected ? 'is-wrong' : 'is-muted' : index === selected ? 'is-selected' : '';
        return <button className={`q-opt ${cls}`} key={index} disabled={eliminated || revealed} aria-pressed={selected === index} aria-label={`${String.fromCharCode(65 + index)}. ${option}${eliminated ? ', eliminated' : revealed && index === q.correctIndex ? ', correct answer' : ''}`} onClick={() => { tapFeedback(); dispatch({ type: 'SELECT_ANSWER', selectedIndex: index }); }}>
          <span className="q-opt-letter">{String.fromCharCode(65 + index)}</span><span className="q-opt-text">{option}</span>
          {revealed && index === q.correctIndex && <IconCheck size={20} />}
          {revealed && index === selected && !correct && <IconCross size={18} />}
          {!revealed && index === selected && <span className="selection-dot" />}
        </button>;
      })}
    </div>
    {!revealed && <>
      <div className="q-powerups">
        <button className={`q-pu ${state.activeDouble ? 'is-active' : ''}`} disabled={!canDouble} onClick={() => { tapFeedback(); dispatch({ type: 'USE_DOUBLE' }); }} aria-label="Double Up: twice the points">
          <IconBolt size={21} /><span><strong>Double Up</strong><small>{state.activeDouble ? 'Active · 2× points' : currentPU.usedDouble ? 'Already used' : '2× the points'}</small></span>
        </button>
        <button className={`q-pu ${state.fiftyFiftyEliminated.length ? 'is-active' : ''}`} disabled={!canFifty} onClick={() => { tapFeedback(); dispatch({ type: 'USE_FIFTY_FIFTY' }); }} aria-label="Fifty Fifty: remove two wrong answers for half points, rounded up">
          <IconTarget size={21} /><span><strong>Fifty Fifty</strong><small>{state.fiftyFiftyEliminated.length ? 'Active · half points' : currentPU.usedFiftyFifty ? 'Already used' : '2 answers · half points'}</small></span>
        </button>
      </div>
      <p className="q-powerup-note">One of each per team. Half points round up.</p>
    </>}
    <div className="q-actions">
      {revealed ? <>
        <div className={`q-result ${correct ? 'correct' : 'wrong'}`} role="status" tabIndex={-1} ref={resultRef}>
          {correct ? <IconCheck size={24} /> : <IconCross size={20} />}
          <span><strong>{correct ? 'Bucket!' : 'Off the rim.'}</strong><small>{correct ? `+${displayPoints} ${displayPoints === 1 ? 'point' : 'points'} for ${currentTeam.name}` : `Correct answer: ${q.options[q.correctIndex]}`}</small></span>
        </div>
        <button className="ht-btn-primary" onClick={() => { tapFeedback(); dispatch({ type: 'CONTINUE_QUESTION' }); }}><span>{lastQuestion ? 'View Results' : 'Next Turn'}</span><IconArrow /></button>
        {!lastQuestion && <p className="q-next-team">Pass the phone to <strong>{otherTeam.name}</strong></p>}
      </> : <button className="ht-btn-primary is-orange" disabled={selected === null} onClick={() => { if (selected !== null) { answerFeedback(selected === q.correctIndex); dispatch({ type: 'REVEAL_ANSWER' }); } }}><span>{selected === null ? 'Select an Answer' : `Lock In ${String.fromCharCode(65 + selected)}`}</span><IconArrow /></button>}
      <button className="ht-text-button q-save" onClick={() => dispatch({ type: 'GO_HOME' })}>Save & Exit</button>
    </div>
  </Modal>;
}
