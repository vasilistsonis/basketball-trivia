import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';

/** The number re-mounts when it changes, so the pop animation replays per point scored. */
function Score({ value }: { value: number }) {
  const prev = useRef(value);
  const [hasChanged, setHasChanged] = useState(false);
  const changedNow = prev.current !== value;

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setHasChanged(true);
    }
  }, [value]);

  return (
    <div key={value} className={`score ${changedNow || hasChanged ? 'is-pop' : ''}`}>
      {String(value).padStart(2, '0')}
    </div>
  );
}

export default function Scoreboard() {
  const { state } = useGame();
  const [team1, team2] = state.teams;

  return (
    <div className="scoreboard">
      <div className="sb-team" style={{ '--team-color': team1.color } as React.CSSProperties}>
        <div className="row1">
          <span className="stripe" />
          <span>Team 01</span>
        </div>
        <div className="name">{team1.name}</div>
        <Score value={team1.score} />
      </div>
      <div className="sb-divider" />
      <div className="sb-team right" style={{ '--team-color': team2.color } as React.CSSProperties}>
        <div className="row1">
          <span>Team 02</span>
          <span className="stripe" />
        </div>
        <div className="name">{team2.name}</div>
        <Score value={team2.score} />
      </div>
    </div>
  );
}
