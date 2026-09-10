import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Wordmark, IconArrow, CourtArc, IconTrophy } from './Icons';
import InfoSheet from './InfoSheet';
import { shareResult, tapFeedback, setStatusBar } from '../lib/native';

export default function GameOver() {
  const { state, dispatch } = useGame();
  const [privacy, setPrivacy] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [sharing, setSharing] = useState(false);
  const [first, second] = state.teams;
  const winnerIndex = first.score === second.score ? -1 : first.score > second.score ? 0 : 1;
  const winner = winnerIndex === 0 ? first : winnerIndex === 1 ? second : null;
  const answered = Object.values(state.answeredSlots);
  const correctCount = answered.filter(answer => answer.correct).length;
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareResult(`Hoops Trivia · Final score\n${first.name} ${first.score} — ${second.score} ${second.name}\n${winner ? winner.name + ' takes the win!' : 'A dead heat!'}\n${correctCount} of ${answered.length} questions correct. Think you can do better?`);
      setShareStatus(result === 'copied' ? 'Final score copied. Paste it to share.' : result === 'shared' ? 'Share sheet closed.' : '');
    } catch { setShareStatus('Sharing is unavailable right now. Your final score is still here.'); }
    finally { setSharing(false); setStatusBar(true); }
  };

  return <main className="ht-app go-shell">
    <div className="ht-paper-grain" aria-hidden="true" />
    <div className="ht-shell">
      <header className="ht-topbar"><Wordmark light /><span className="ht-mono">Full time / {answered.length} played</span></header>
      <section className="go-head">
        <CourtArc style={{ position: 'absolute', top: -110, right: -150, width: 440, height: 440 }} stroke="#fff" opacity={0.13} />
        <div className="go-kicker"><IconTrophy size={20} /> Final buzzer</div>
        <h1 className="ht-display go-title" data-screen-title tabIndex={-1}>{winner ? <>Nothing<br />but <em>net.</em></> : <>A dead<br /><em>heat.</em></>}</h1>
        <p className="go-winner-name">{winner ? <><strong>{winner.name}</strong> takes it.</> : 'All square. Run it back?'}</p>
        <p className="go-margin">{winner ? `A ${Math.abs(first.score - second.score)}-point win. Bragging rights secured.` : 'Two teams. The same score. Respect.'}</p>
      </section>
      <section className="go-final" aria-label="Final scores">{state.teams.map((team, index) => {
        const attempts = answered.filter(answer => answer.answeredByTeam === index);
        const correct = attempts.filter(answer => answer.correct).length;
        return <div key={index} className={`go-final-row ${index === winnerIndex ? 'winner' : ''}`} style={{ '--team-color': team.color } as React.CSSProperties}>
          <span className="go-final-jersey">{index + 1}</span><div className="go-final-team"><h2>{team.name}</h2><p>{correct}/{attempts.length} correct {index === winnerIndex && <span>· Winner</span>}</p></div><strong className="go-final-score">{team.score}</strong>
        </div>;
      })}</section>
      <section className="go-stats" aria-label="Match statistics">
        <div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{answered.length - correctCount}</strong><span>Misses</span></div><div><strong>{state.powerUps.reduce((sum, pu) => sum + Number(pu.usedDouble) + Number(pu.usedFiftyFifty), 0)}</strong><span>Power-ups</span></div>
      </section>
      <div className="go-actions">
        <button className="ht-btn-primary is-orange" onClick={() => { tapFeedback(); dispatch({ type: 'START_SETUP' }); }}><span>Run It Back</span><IconArrow /></button>
        <button className="ht-btn-ghost" onClick={share} disabled={sharing}>{sharing ? 'Opening share…' : 'Share Result'}</button>
        <p className="share-status" role="status">{shareStatus}</p>
        <button className="ht-text-button" onClick={() => dispatch({ type: 'GO_HOME' })}>Back to Home</button>
        <button className="ht-privacy-link" onClick={() => setPrivacy(true)}>Privacy</button>
      </div>
    </div>
    {privacy && <InfoSheet view="privacy" onClose={() => setPrivacy(false)} />}
  </main>;
}
