import { useEffect, useState } from 'react';
import { isMuted, setMuted, onMuteChange } from '../sound';
import { IconSound } from './Icons';

export default function SoundToggle({ light = false }: { light?: boolean }) {
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => onMuteChange(setMutedState), []);

  const toggle = () => {
    setMuted(!muted);
  };

  return (
    <button
      className={`ht-sound-btn ${light ? 'is-light' : ''}`}
      onClick={toggle}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!muted}
    >
      <IconSound size={18} muted={muted} />
    </button>
  );
}
