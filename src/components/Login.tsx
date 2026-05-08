import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function Login() {
  const { dispatch } = useGame();
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      dispatch({ type: 'LOGIN', user: { username: username.trim() } });
    }
  };

  return (
    <div className="screen login-screen">
      <div className="card">
        <h1 className="app-title">🏀 Basketball Trivia</h1>
        <p className="subtitle">Test your NBA knowledge!</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="input"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={!username.trim()}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
