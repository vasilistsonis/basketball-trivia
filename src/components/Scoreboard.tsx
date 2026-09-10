import { useGame } from '../context/GameContext';

export default function Scoreboard() {
  const { state } = useGame();
  return <section className="scoreboard" aria-label="Scoreboard">
    {state.teams.map((team, index) => <div key={index} className={`sb-team ${index === state.currentTeamIndex ? 'is-current' : ''}`} style={{ '--team-color': team.color } as React.CSSProperties}>
      <div className="sb-team-label"><span className="stripe" /> Team 0{index + 1}</div>
      <h2 className="name">{team.name}</h2>
      <p className="score" aria-label={`${team.name}: ${team.score} points`}>{String(team.score).padStart(2, '0')}</p>
    </div>)}
    <span className="sb-vs" aria-hidden="true">VS</span>
  </section>;
}
