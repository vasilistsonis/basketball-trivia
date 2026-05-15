import { useGame } from '../context/GameContext';
import { Wordmark, IconArrow, CourtArc } from './Icons';

export default function GameOver() {
  const { state, dispatch } = useGame();
  const [team1, team2] = state.teams;

  const winner =
    team1.score > team2.score ? team1 : team2.score > team1.score ? team2 : null;
  const winnerIdx = winner === team1 ? 0 : winner === team2 ? 1 : -1;
  const margin = Math.abs(team1.score - team2.score);

  // Count correct answers per team
  const answered = Object.values(state.answeredSlots);
  const totalPerTeam = [
    answered.filter((a) => a.answeredByTeam === 0).length,
    answered.filter((a) => a.answeredByTeam === 1).length,
  ];
  const correctPerTeam = [
    answered.filter((a) => a.answeredByTeam === 0 && a.correct).length,
    answered.filter((a) => a.answeredByTeam === 1 && a.correct).length,
  ];
  const totalCorrect = correctPerTeam[0] + correctPerTeam[1];
  const totalWrong = answered.length - totalCorrect;

  return (
    <div className="ht-app go-shell">
      <div className="ht-paper-grain" />
      <div className="ht-shell">
        {/* Top bar */}
        <div className="ht-topbar">
          <Wordmark light />
          <div className="ht-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Final · {answered.length}/{state.totalSlots}
          </div>
        </div>

        {/* Title & winner */}
        <div className="go-head">
          <CourtArc
            style={{
              position: 'absolute', top: -100, right: -120, width: 300, height: 300,
            }}
            stroke="#fff"
            opacity={0.15}
          />
          <div className="go-kicker">FINAL BUZZER</div>
          {winner ? (
            <>
              <h1 className="go-title">
                {winner.name.split(' ')[0]}<br />Take It.
              </h1>
              <div className="go-winner-name">+ {margin} PT Margin</div>
            </>
          ) : (
            <>
              <h1 className="go-title">It's a<br />Tie!</h1>
              <div className="go-winner-name">Dead even.</div>
            </>
          )}
        </div>

        {/* Final scores table */}
        <div className="go-final">
          {[team1, team2].map((team, idx) => {
            const pct = totalPerTeam[idx] > 0
              ? Math.round((correctPerTeam[idx] / totalPerTeam[idx]) * 100)
              : 0;
            return (
              <div
                key={idx}
                className={`go-final-row ${winnerIdx === idx ? 'winner' : ''}`}
                style={{ '--team-color': team.color } as React.CSSProperties}
              >
                <div className="go-final-jersey">{idx + 1}</div>
                <div>
                  <div className="go-final-name">{team.name}</div>
                  <div className="go-final-meta">
                    {correctPerTeam[idx]} / {totalPerTeam[idx]} correct · {pct}%
                  </div>
                </div>
                <div className="go-final-score">{team.score}</div>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="go-stats">
          <div className="go-stat">
            <div className="go-stat-num">{totalCorrect}</div>
            <div className="go-stat-lbl">Correct</div>
          </div>
          <div className="go-stat">
            <div className="go-stat-num">{totalWrong}</div>
            <div className="go-stat-lbl">Misses</div>
          </div>
          <div className="go-stat">
            <div className="go-stat-num">
              {state.powerUps.reduce((s, pu) =>
                s + (pu.usedDouble ? 1 : 0) + (pu.usedFiftyFifty ? 1 : 0), 0
              )}
            </div>
            <div className="go-stat-lbl">Power-ups</div>
          </div>
        </div>

        {/* Actions */}
        <div className="go-actions">
          <button
            className="ht-btn-primary"
            onClick={() => dispatch({ type: 'START_SETUP' })}
          >
            <span>Run It Back</span>
            <span className="arrow"><IconArrow color="#fff" /></span>
          </button>
          <button
            className="ht-btn-ghost"
            onClick={() => dispatch({ type: 'GO_HOME' })}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
