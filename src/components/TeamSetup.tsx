import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Team } from '../types';
import { Wordmark, IconArrow } from './Icons';

const COLORS = ['#E85D1E', '#10523A', '#3B4D8A', '#B5311A', '#6B4E2E'];

export default function TeamSetup() {
  const { state, dispatch, loadCategories } = useGame();

  const [team1, setTeam1] = useState<Team>({ ...state.teams[0] });
  const [team2, setTeam2] = useState<Team>({ ...state.teams[1] });

  useEffect(() => {
    if (state.categories.length === 0) {
      loadCategories();
    }
  }, [state.categories.length, loadCategories]);

  const totalSlots = state.categories.reduce((sum, cat) => sum + cat.slots.length, 0);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'SET_TEAMS',
      teams: [
        { ...team1, name: team1.name || 'Team 1', score: 0 },
        { ...team2, name: team2.name || 'Team 2', score: 0 },
      ],
    });
    dispatch({ type: 'START_GAME', totalSlots });
  };

  const handleBack = () => {
    dispatch({ type: 'GO_HOME' });
  };

  return (
    <div className="ht-app">
      <div className="ht-paper-grain" />
      <div className="ht-shell">
        {/* Top bar */}
        <div className="ht-topbar">
          <button className="ht-back-btn" onClick={handleBack}>← Back</button>
          <Wordmark />
          <span style={{ width: 32 }} />
        </div>

        {/* Header */}
        <div className="setup-head">
          <h1 className="ht-display setup-h1">
            <small>Step 01 / 02 — Roster</small>
            Pick<br />your sides.
          </h1>
        </div>

        {/* Team 1 card */}
        <div className="team-card" style={{ '--team-color': team1.color } as React.CSSProperties}>
          <div className="team-card-head">
            <div>
              <div className="team-num">Team 01</div>
              <div className="ht-mono" style={{ marginTop: 4 }}>Captain · Pick a name</div>
            </div>
            <div className="team-jersey">1</div>
          </div>
          <input
            className="team-input"
            value={team1.name}
            onChange={(e) => setTeam1({ ...team1, name: e.target.value })}
            placeholder="TEAM NAME"
          />
          <div className="team-colors">
            {COLORS.map((c) => (
              <span
                key={`t1-${c}`}
                className={`team-swatch ${team1.color === c ? 'is-selected' : ''}`}
                style={{ background: c }}
                onClick={() => setTeam1({ ...team1, color: c })}
              />
            ))}
          </div>
        </div>

        {/* Team 2 card */}
        <div className="team-card" style={{ '--team-color': team2.color } as React.CSSProperties}>
          <div className="team-card-head">
            <div>
              <div className="team-num">Team 02</div>
              <div className="ht-mono" style={{ marginTop: 4 }}>Captain · Pick a name</div>
            </div>
            <div className="team-jersey">2</div>
          </div>
          <input
            className="team-input"
            value={team2.name}
            onChange={(e) => setTeam2({ ...team2, name: e.target.value })}
            placeholder="TEAM NAME"
          />
          <div className="team-colors">
            {COLORS.map((c) => (
              <span
                key={`t2-${c}`}
                className={`team-swatch ${team2.color === c ? 'is-selected' : ''}`}
                style={{ background: c }}
                onClick={() => setTeam2({ ...team2, color: c })}
              />
            ))}
          </div>
        </div>

        {/* Start button */}
        <div style={{ padding: '16px 22px 0', marginTop: 'auto' }}>
          <form onSubmit={handleStart}>
            <button type="submit" className="ht-btn-primary" disabled={totalSlots === 0}>
              <span>Tip Off · {totalSlots} Questions</span>
              <span className="arrow"><IconArrow color="currentColor" /></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
