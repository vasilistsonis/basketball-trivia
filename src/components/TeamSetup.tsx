import { FormEvent, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Team } from '../types';
import { Wordmark, IconArrow, IconCheck } from './Icons';
import { tapFeedback } from '../lib/native';

const COLORS = [
  { value: '#E85D1E', name: 'Orange' }, { value: '#10523A', name: 'Court Green' },
  { value: '#3B4D8A', name: 'Navy Blue' }, { value: '#B5311A', name: 'Crimson' },
  { value: '#6B4E2E', name: 'Leather Brown' },
];

export default function TeamSetup() {
  const { state, dispatch, savedGame } = useGame();
  const [teams, setTeams] = useState<[Team, Team]>([
    { ...state.teams[0], color: COLORS.some(c => c.value === state.teams[0].color) ? state.teams[0].color : COLORS[0].value },
    { ...state.teams[1], color: COLORS.some(c => c.value === state.teams[1].color) ? state.teams[1].color : COLORS[2].value },
  ]);
  const [error, setError] = useState('');
  const secondInput = useRef<HTMLInputElement>(null);
  const starting = useRef(false);
  const totalSlots = state.categories.reduce((sum, cat) => sum + cat.slots.length, 0);
  const updateTeam = (index: number, value: Partial<Team>) => {
    setError('');
    setTeams(current => current.map((team, i) => i === index ? { ...team, ...value } : team) as [Team, Team]);
  };
  const handleStart = (event: FormEvent) => {
    event.preventDefault();
    const clean = teams.map((team, index) => ({ ...team, name: team.name.trim() || `Team ${index + 1}`, score: 0 })) as [Team, Team];
    if (clean[0].name.toLocaleLowerCase() === clean[1].name.toLocaleLowerCase()) { setError('Give each team a different name so you can follow the score.'); return; }
    if (!totalSlots || starting.current) return;
    starting.current = true;
    (document.activeElement as HTMLElement)?.blur();
    tapFeedback();
    dispatch({ type: 'SET_TEAMS', teams: clean });
    dispatch({ type: 'START_GAME', totalSlots });
  };

  return <main className="ht-app setup-screen">
    <div className="ht-paper-grain" aria-hidden="true" />
    <div className="ht-shell">
      <header className="ht-topbar"><button className="ht-back-btn" onClick={() => dispatch({ type: 'GO_HOME' })}>← Back</button><Wordmark /></header>
      <section className="setup-head"><span className="ht-mono">The pregame / Pick your crew</span><h1 className="ht-display setup-h1" data-screen-title tabIndex={-1}>Pick your<br /><em>sides.</em></h1><p>One phone. Two teams. All the bragging rights.</p></section>
      <form onSubmit={handleStart} className="setup-form">
        <div className="team-cards">{teams.map((team, index) => <fieldset className="team-card" key={index} style={{ '--team-color': team.color } as React.CSSProperties}>
          <legend className="sr-only">Team {index + 1}</legend>
          <div className="team-card-head"><div><span className="team-num">Team 0{index + 1}</span><span className="ht-mono">{index === 0 ? 'First possession' : 'The challengers'}</span></div><span className="team-jersey" aria-hidden="true">{index + 1}</span></div>
          <label className="sr-only" htmlFor={`team-${index}-name`}>Team {index + 1} name</label>
          <input id={`team-${index}-name`} ref={index === 1 ? secondInput : undefined} className="team-input" value={team.name} onChange={event => updateTeam(index, { name: event.target.value })} placeholder={`Team ${index + 1}`} maxLength={20} autoComplete="off" autoCapitalize="words" spellCheck={false} enterKeyHint={index === 0 ? 'next' : 'done'} onKeyDown={event => { if (event.key === 'Enter' && index === 0) { event.preventDefault(); secondInput.current?.focus(); } }} aria-describedby={error ? 'setup-error' : undefined} />
          <div className="team-colors" role="group" aria-label={`Team ${index + 1} color`}>{COLORS.map(color => <button type="button" key={color.value} className={`team-swatch ${team.color === color.value ? 'is-selected' : ''}`} aria-label={`Team ${index + 1}: ${color.name}`} aria-pressed={team.color === color.value} onClick={() => { tapFeedback(); updateTeam(index, { color: color.value }); }}><span style={{ background: color.value }}>{team.color === color.value && <IconCheck size={18} color="#fff" />}</span></button>)}</div>
        </fieldset>)}</div>
        <div className="setup-actions">
          {error && <p id="setup-error" className="ht-notice is-error" role="alert">{error}</p>}
          {savedGame && <p className="ht-notice">Tip off starts a fresh game and replaces your saved match.</p>}
          <button type="submit" className="ht-btn-primary" disabled={!totalSlots}><span>Tip Off</span><span className="button-detail">{totalSlots} questions <IconArrow /></span></button>
          <p className="setup-note">Team 1 picks first. Take turns and pass the phone.</p>
        </div>
      </form>
    </div>
  </main>;
}
