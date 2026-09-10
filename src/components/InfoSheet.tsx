import type { CategoryMeta } from '../types';
import { CATEGORY_ICONS } from './Icons';
import Modal from './Modal';

export interface InfoSheetProps {
  view: 'rules' | 'privacy' | 'category';
  category?: CategoryMeta;
  onClose: () => void;
}

const CATEGORY_TIPS: Record<CategoryMeta['id'], string> = {
  geography: 'Think home courts, host cities, and the places behind basketball’s biggest teams.',
  history: 'Put your knowledge of champions, records, awards, and memorable seasons to the test.',
  logo: 'Recognize the teams behind the crests, colors, and visual clues.',
  'guess-whos-missing': 'Read the lineup and find the player who completes the five.',
  'guess-the-player': 'Follow the career clues, clubs, and achievements to name the player.',
};

function Rules() {
  return (
    <div className="info-copy">
      <p>One device. Two teams. A whole lot of basketball knowledge.</p>
      <ol>
        <li className="info-step">
          <h3>Pick your sides</h3>
          <p>Name both teams and choose your colors. Team 1 takes the first turn; then teams alternate after every answer.</p>
        </li>
        <li className="info-step">
          <h3>Call your shot</h3>
          <p>Choose an unplayed points tile in any category. Higher values bring harder questions. Select an answer, then lock it in.</p>
        </li>
        <li className="info-step">
          <h3>Put points on the board</h3>
          <p>A correct answer earns the tile’s points. A wrong answer earns zero, with no points deducted. Each tile can be played once.</p>
        </li>
        <li className="info-step">
          <h3>Use your power-ups</h3>
          <p>Each team gets one Double Up and one Fifty Fifty per game. Use a power-up before locking in an answer; they cannot be combined on the same question.</p>
          <p><strong>Double Up:</strong> a correct answer earns twice the tile’s points.</p>
          <p><strong>Fifty Fifty:</strong> removes two wrong answers. A correct answer earns half the tile’s points, rounded up. A 3-point tile is worth 2 points with Fifty Fifty.</p>
        </li>
        <li className="info-step">
          <h3>Play to the final buzzer</h3>
          <p>The game ends when every tile has been played. The highest score wins. Equal scores finish as a draw.</p>
        </li>
      </ol>
      <p className="info-note">Need a timeout? Save and exit, then resume your game on this device.</p>
    </div>
  );
}

function Privacy() {
  return (
    <div className="info-copy">
      <p>Hoops Trivia is a game you share with the people beside you. You do not need an account to play.</p>
      <section className="info-step">
        <h3>Your game stays on your device</h3>
        <p>Team names, scores, and game progress are saved in this app’s local storage so you can resume a game. The app does not upload them to a server.</p>
      </section>
      <section className="info-step">
        <h3>Questions and connections</h3>
        <p>The app includes a question bank for offline play. When online question updates are configured, it can request questions from Supabase. Those requests include ordinary network information, such as your IP address, device request headers, and the question content requested.</p>
        <p>Questions that use images hosted elsewhere may request those images from their hosts. Those hosts also receive ordinary network request information.</p>
      </section>
      <section className="info-step">
        <h3>No advertising or tracking</h3>
        <p>This app does not include advertising, analytics, or cross-app tracking. It does not request your contacts, camera, microphone, or precise location.</p>
      </section>
      <section className="info-step">
        <h3>Sharing is your choice</h3>
        <p>A result is shared only when you choose the share action. You control the app or person you share it with.</p>
      </section>
      <p className="info-note">These details describe the behavior of this version of Hoops Trivia. This information is included in the app and is available offline.</p>
    </div>
  );
}

export default function InfoSheet({ view, category, onClose }: InfoSheetProps) {
  const title = view === 'rules' ? 'How to play' : view === 'privacy' ? 'Your privacy' : category?.label ?? 'The categories';
  const CategoryIcon = category ? CATEGORY_ICONS[category.id] : undefined;

  return (
    <Modal title={title} onClose={onClose} className="info-sheet">
      {view === 'rules' && <Rules />}
      {view === 'privacy' && <Privacy />}
      {view === 'category' && (
        <div className="info-copy">
          {category ? (
            <>
              {CategoryIcon && <span className="info-category-icon" style={{ color: category.color }} aria-hidden="true"><CategoryIcon size={36} /></span>}
              <p>{category.description}</p>
              <p>{CATEGORY_TIPS[category.id]}</p>
              <p className="info-note">{category.questionCount.toLocaleString()} questions in this category. Each points tile draws a question from its pool when you play.</p>
            </>
          ) : <p>Pick a category to explore its questions.</p>}
        </div>
      )}
      <div className="info-actions">
        <button type="button" className="ht-btn-primary" onClick={onClose}>
          <span>{view === 'rules' ? 'Got it. Let’s play.' : 'Done'}</span>
        </button>
      </div>
    </Modal>
  );
}
