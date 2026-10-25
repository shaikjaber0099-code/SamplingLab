import React, { useRef, useState } from 'react';
import { getTemperatureColor, getHeatInfo } from '../theme/thermalUtils';

export default function Thermometer({ value, onChange, min = 0.0, max = 2.0, step = 0.05 }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const tVal = Math.max(min, Math.min(max, Number(value) || 0.0));
  const heat = getHeatInfo(tVal);
  const currentColor = getTemperatureColor(tVal);

  // Percentage filled (0.0 to 1.0)
  const pct = (tVal - min) / (max - min);
  const fillHeightPercent = Math.round(pct * 100);

  const updateFromPointer = (clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Inverted because 2.0 is at top and 0.0 is at bottom
    const yFromBottom = rect.bottom - clientY;
    const clampedY = Math.max(0, Math.min(rect.height, yFromBottom));
    const newRatio = clampedY / rect.height;
    const rawVal = min + newRatio * (max - min);
    // Snap to step
    const stepped = Math.round(rawVal / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    onChange(Number(clamped.toFixed(2)));
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateFromPointer(e.clientY);
    const handleMove = (moveEvent) => updateFromPointer(moveEvent.clientY);
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleKeyDown = (e) => {
    let nextVal = tVal;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      nextVal = Math.min(max, tVal + step);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      nextVal = Math.max(min, tVal - step);
    } else if (e.key === 'PageUp') {
      nextVal = Math.min(max, tVal + 0.5);
    } else if (e.key === 'PageDown') {
      nextVal = Math.max(min, tVal - 0.5);
    } else if (e.key === 'Home') {
      nextVal = min;
    } else if (e.key === 'End') {
      nextVal = max;
    } else {
      return;
    }
    e.preventDefault();
    onChange(Number(nextVal.toFixed(2)));
  };

  const ticks = [2.0, 1.5, 1.0, 0.5, 0.0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 12px',
        backgroundColor: 'var(--surface-2)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: `0 0 20px ${currentColor}15`,
        transition: 'box-shadow 0.3s ease',
        userSelect: 'none',
      }}
    >
      {/* Header readout */}
      <div style={{ textAlign: 'center', marginBottom: '14px', width: '100%' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Heat Level (Temperature)
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: currentColor,
            marginTop: '2px',
            textShadow: `0 0 10px ${currentColor}40`,
            transition: 'color 0.2s ease'
          }}
        >
          T = {tVal.toFixed(2)}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            padding: '2px 10px',
            borderRadius: '9999px',
            backgroundColor: `${currentColor}20`,
            border: `1px solid ${currentColor}40`,
            fontSize: '11px',
            fontWeight: 600,
            color: currentColor
          }}
        >
          <span>{heat.icon}</span>
          <span>{heat.label}</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>· {heat.sublabel}</span>
        </div>
      </div>

      {/* Thermometer Assembly */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
        {/* Glass tube with mercury */}
        <div
          ref={containerRef}
          role="slider"
          tabIndex={0}
          aria-label="Temperature slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={tVal}
          aria-valuetext={`T = ${tVal.toFixed(2)}, ${heat.label}`}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          style={{
            position: 'relative',
            width: '28px',
            height: '220px',
            backgroundColor: 'rgba(11, 15, 23, 0.8)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px 14px 20px 20px',
            overflow: 'hidden',
            cursor: 'ns-resize',
            outline: 'none',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {/* Mercury liquid fill */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillHeightPercent}%`,
              background: 'var(--t-gradient-v)',
              backgroundAttachment: 'fixed',
              transition: isDragging ? 'none' : 'height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              boxShadow: `0 0 12px ${currentColor}80`,
            }}
          />

          {/* Meniscus bulb shine effect */}
          <div
            style={{
              position: 'absolute',
              bottom: `${fillHeightPercent}%`,
              left: '2px',
              right: '2px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: '#FFFFFF',
              opacity: 0.7,
              transform: 'translateY(50%)',
              transition: isDragging ? 'none' : 'bottom 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />

          {/* Glass glare highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '4px',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.05))',
              borderRadius: '2px',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Ticks and click-to-snap targets */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '220px',
            padding: '4px 0',
          }}
        >
          {ticks.map((tick) => {
            const isSelected = Math.abs(tVal - tick) < 0.1;
            const tickColor = getTemperatureColor(tick);
            return (
              <button
                key={tick}
                type="button"
                onClick={() => onChange(tick)}
                className="font-mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  color: isSelected ? tickColor : 'var(--text-muted)',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                title={`Set T = ${tick.toFixed(1)}`}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: isSelected ? '10px' : '6px',
                    height: '2px',
                    backgroundColor: isSelected ? tickColor : 'var(--border)',
                    transition: 'all 0.2s ease',
                  }}
                />
                <span>{tick.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Descriptor explanation note */}
      <div
        style={{
          marginTop: '10px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: '1.4',
          maxWidth: '220px',
        }}
      >
        {heat.description}
      </div>
    </div>
  );
}
