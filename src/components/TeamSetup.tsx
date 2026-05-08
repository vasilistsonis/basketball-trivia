import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Team } from '../types';

const COLOR_OPTIONS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
];

export default function TeamSetup() {
  const { state, dispatch, categories, loadCategories } = useGame();

  const [team1, setTeam1] = useState<Team>({ ...state.teams[0] });
  const [team2, setTeam2] = useState<Team>({ ...state.teams[1] });

  useEffect(() => {
    if (categories.length === 0) {
      loadCategories();
    }
  }, [categories.length, loadCategories]);

  const totalSlots = categories.reduce((sum, cat) => sum + cat.slots.length, 0);

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

  return (
    <div className="screen setup-screen">
      <div className="card card-wide">
        <h2>Team Setup</h2>
        <form onSubmit={handleStart} className="team-setup-form">
          {/* Team 1 */}
          <div className="team-config">
            <h3 style={{ color: team1.color }}>Team 1</h3>
            <input
              type="text"
              className="input"
              placeholder="Team 1"
              value={team1.name}
              onChange={(e) => setTeam1({ ...team1, name: e.target.value })}
            />
            <div className="color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={`t1-${c}`}
                  type="button"
                  className={`color-swatch ${team1.color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setTeam1({ ...team1, color: c })}
                />
              ))}
            </div>
          </div>

          {/* Team 2 */}
          <div className="team-config">
            <h3 style={{ color: team2.color }}>Team 2</h3>
            <input
              type="text"
              className="input"
              placeholder="Team 2"
              value={team2.name}
              onChange={(e) => setTeam2({ ...team2, name: e.target.value })}
            />
            <div className="color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={`t2-${c}`}
                  type="button"
                  className={`color-swatch ${team2.color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setTeam2({ ...team2, color: c })}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            🏀 Start Game
          </button>
        </form>
      </div>
    </div>
  );
}
