
// rankr-extras.jsx
// All the missing pieces: keyboard shortcuts, swipe, share card,
// progress rings, rename/delete, onboarding hint, empty state

const { useState: useStateX, useEffect: useEffectX, useRef: useRefX, useCallback: useCallbackX } = React;

// ─── 1. Keyboard shortcuts hook ──────────────────────────────────────────────
function useKeyboardVote(onVoteLeft, onVoteRight, enabled) {
  useEffectX(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '1' || e.key === 'ArrowLeft')  { e.preventDefault(); onVoteLeft();  }
      if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); onVoteRight(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onVoteLeft, onVoteRight, enabled]);
}

// ─── 2. Swipe hook ───────────────────────────────────────────────────────────
function useSwipeVote(onSwipeLeft, onSwipeRight, enabled) {
  const startX = useRefX(null);
  const startY = useRefX(null);

  useEffectX(() => {
    if (!enabled) return;
    const onTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
      startX.current = null;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, enabled]);
}

// ─── 3. Keyboard hint badge ───────────────────────────────────────────────────
function KeyHint({ side, mobile }) {
  if (mobile) return null;
  const key = side === 'left' ? '1' : '2';
  const arrow = side === 'left' ? '←' : '→';
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: side === 'left' ? 14 : undefined, right: side === 'right' ? 14 : undefined,
      display: 'flex', gap: 4, alignItems: 'center',
      opacity: 0.35, pointerEvents: 'none',
      animation: 'rankr-fadeup 0.5s ease forwards',
    }}>
      {[key, arrow].map(k => (
        <kbd key={k} style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, padding: '2px 6px',
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          fontFamily: 'monospace', letterSpacing: '0.04em',
        }}>{k}</kbd>
      ))}
    </div>
  );
}

// ─── 4. Progress ring ─────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 44, stroke = 3, color = '#6366F1', emoji, done }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={done ? '#34D399' : color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)', filter: done ? 'drop-shadow(0 0 4px #34D399)' : `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: done ? 18 : 16,
      }}>
        {done ? '✓' : emoji}
      </div>
    </div>
  );
}

// ─── 5. Share / Results Card ──────────────────────────────────────────────────
function ShareModal({ category, onClose }) {
  const sorted = [...category.items].sort((a, b) => {
    const wrA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const wrB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    return wrB - wrA;
  });
  const totalVotes = category.items.reduce((s, i) => s + i.wins + i.losses, 0) / 2;
  const [copied, setCopied] = useStateX(false);

  const handleCopy = () => {
    const text = `🏆 My ${category.label} Rankings (Rankr)\n\n` +
      sorted.map((item, i) => {
        const wr = item.wins + item.losses > 0 ? Math.round((item.wins / (item.wins + item.losses)) * 100) : 0;
        const medal = ['🥇','🥈','🥉'][i] || `${i+1}.`;
        return `${medal} ${item.emoji} ${item.name} — ${wr}% win rate`;
      }).join('\n') +
      `\n\nRanked with Rankr ⚡`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        animation: 'rankr-fadein 0.18s ease forwards',
      }} />
      <div style={{
        position: 'fixed', zIndex: 2001, top: '50%', left: '50%',
        width: 'min(420px, calc(100vw - 32px))',
        background: 'linear-gradient(160deg, rgba(18,18,32,0.98) 0%, rgba(10,10,20,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)',
        animation: 'rankr-modal-in 0.25s cubic-bezier(.34,1.56,.64,1) forwards',
      }}>
        {/* Card header */}
        <div style={{
          padding: '28px 24px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(52,211,153,0.06))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            My Rankings
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', fontFamily: "'Syne', sans-serif" }}>
            {category.label}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            {Math.round(totalVotes)} matchups · powered by Rankr ⚡
          </div>
        </div>

        {/* Rankings list */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map((item, i) => {
            const wr = item.wins + item.losses > 0 ? Math.round((item.wins / (item.wins + item.losses)) * 100) : 0;
            const medals = ['🥇','🥈','🥉'];
            const isTop = i < 3;
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 12,
                background: isTop ? `rgba(${i===0?'99,102,241':i===1?'148,163,184':'180,160,120'},0.08)` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isTop ? `rgba(${i===0?'99,102,241':i===1?'148,163,184':'180,160,120'},0.15)` : 'rgba(255,255,255,0.04)'}`,
              }}>
                <span style={{ fontSize: isTop ? 18 : 13, width: 24, textAlign: 'center', fontWeight: 700, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {medals[i] || i+1}
                </span>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: isTop ? '#fff' : 'rgba(255,255,255,0.6)', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
                  {item.name}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: i === 0 ? '#818CF8' : 'rgba(255,255,255,0.3)',
                  background: i === 0 ? 'rgba(99,102,241,0.12)' : 'transparent',
                  padding: i === 0 ? '2px 8px' : '0',
                  borderRadius: 99,
                }}>{item.wins + item.losses > 0 ? `${wr}%` : '—'}</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
            background: copied ? 'rgba(52,211,153,0.15)' : '#6366F1',
            color: copied ? '#34D399' : '#fff',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: copied ? '0 4px 20px rgba(52,211,153,0.2)' : '0 4px 20px rgba(99,102,241,0.35)',
            transition: 'all 0.2s ease',
            border: copied ? '1px solid rgba(52,211,153,0.3)' : '1px solid transparent',
          }}>
            {copied ? '✓ Copied!' : '📋 Copy Results'}
          </button>
          <button onClick={onClose} style={{
            padding: '11px 16px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s ease',
          }}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─── 6. Category options menu (rename + delete) ───────────────────────────────
function CategoryMenu({ cat, onRename, onDelete, onClose, isDefault }) {
  const [renaming, setRenaming] = useStateX(false);
  const [newName, setNewName] = useStateX(cat.label);
  const inputRef = useRefX(null);
  useEffectX(() => { if (renaming) setTimeout(() => inputRef.current?.focus(), 50); }, [renaming]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500 }} />
      <div style={{
        position: 'absolute', top: '110%', right: 0, zIndex: 600,
        background: 'rgba(18,18,28,0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: 6, minWidth: 180,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        animation: 'rankr-fadeup 0.15s ease forwards',
      }}>
        {renaming ? (
          <div style={{ padding: '6px 8px', display: 'flex', gap: 6 }}>
            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onRename(newName); onClose(); } if (e.key === 'Escape') onClose(); }}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", outline: 'none',
              }}
            />
            <button onClick={() => { onRename(newName); onClose(); }} style={{
              background: '#6366F1', border: 'none', borderRadius: 8, padding: '6px 10px',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>✓</button>
          </div>
        ) : (
          <>
            <button onClick={() => setRenaming(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '9px 12px', borderRadius: 9, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.7)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              ✏️ Rename
            </button>
            {!isDefault && (
              <button onClick={() => { onDelete(); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 12px', borderRadius: 9, border: 'none',
                background: 'transparent', color: '#F87171',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🗑️ Delete
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── 7. Onboarding hint ───────────────────────────────────────────────────────
function OnboardingHint({ mobile, onDismiss }) {
  const [visible, setVisible] = useStateX(true);
  useEffectX(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: mobile ? 80 : 32, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 800,
      background: 'rgba(18,18,28,0.95)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 99, padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
    }} onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}>
      <span style={{ fontSize: 16 }}>{mobile ? '👆' : '🖱️'}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
        {mobile
          ? 'Tap a card to vote · Swipe left/right too!'
          : 'Click a card · or press 1 / 2 to vote fast'}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>✕</span>
    </div>
  );
}

// ─── 8. Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onGenerate, onPickBuiltIn }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      padding: '48px 24px', textAlign: 'center',
      animation: 'rankr-fadeup 0.4s ease forwards',
    }}>
      <div style={{ fontSize: 56 }}>🎲</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
          Nothing to rank yet!
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 260, lineHeight: 1.6 }}>
          Pick a built-in category or generate a new one with AI to get started.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onGenerate} style={{
          background: '#6366F1', color: '#fff', border: 'none', borderRadius: 12,
          padding: '11px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
        }}>✨ Generate with AI</button>
        <button onClick={onPickBuiltIn} style={{
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
          padding: '11px 22px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>Browse Categories</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  useKeyboardVote, useSwipeVote,
  KeyHint, ProgressRing, ShareModal,
  CategoryMenu, OnboardingHint, EmptyState,
});
