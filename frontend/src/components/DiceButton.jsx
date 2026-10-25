import React, { useState } from 'react';
import { Dices, RefreshCw } from 'lucide-react';

export default function DiceButton({ seed, onChange }) {
  const [isRolling, setIsRolling] = useState(false);

  const rollNewSeed = () => {
    setIsRolling(true);
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    onChange(newSeed);
    setTimeout(() => {
      setIsRolling(false);
    }, 500);
  };

  const handleInputChange = (e) => {
    const val = e.target.value.trim();
    if (val === '') {
      onChange(null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) onChange(num);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label
          htmlFor="seed-input"
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}
        >
          Roll the dice (Seed)
        </label>
        {seed !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '10px',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Clear (Random)
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          id="seed-input"
          type="number"
          placeholder="Random seed..."
          value={seed ?? ''}
          onChange={handleInputChange}
          className="font-mono"
          style={{
            flex: 1,
            padding: '7px 10px',
            fontSize: '12px',
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        />
        <button
          type="button"
          onClick={rollNewSeed}
          title="Roll a new random seed"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            backgroundColor: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text)',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <Dices
            size={16}
            className={isRolling ? 'animate-dice' : ''}
            style={{ color: '#38BDF8' }}
          />
          <span>Roll</span>
        </button>
      </div>
    </div>
  );
}
