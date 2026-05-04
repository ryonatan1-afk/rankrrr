
// Rankr Matchup Component — Dark Luxury Arcade Edition
const { useState, useEffect, useRef, useCallback } = React;

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 600);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 599px)');
    const handler = e => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

function RippleEffect({ x, y, color }) {
  return (
    <span style={{
      position: 'absolute', left: x, top: y,
      width: 8, height: 8, borderRadius: '50%',
      background: color,
      transform: 'translate(-50%, -50%) scale(0)',
      animation: 'rankr-ripple 0.55s ease-out forwards',
      pointerEvents: 'none', zIndex: 10,
    }} />
  );
}

function ConfettiParticle({ x, y, color, angle, distance }) {
  return (
    <span style={{
      position: 'fixed', left: x, top: y,
      width: 7, height: 7,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      background: color,
      transform: 'translate(-50%, -50%)',
      animation: 'rankr-confetti 0.7s ease-out forwards',
      '--angle': `${angle}deg`,
      '--dist': `${distance}px`,
      pointerEvents: 'none', zIndex: 9999, opacity: 1,
    }} />
  );
}

function MatchupCard({ item, onSelect, isSelected, isLoser, isIdle, side, mobile }) {
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState(null);
  const cardRef = useRef(null);

  const handleClick = (e) => {
    if (!isIdle) return;
    const rect = cardRef.current.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
    onSelect(item, e.clientX, e.clientY);
  };

  const scale = isSelected ? 1.04 : isLoser ? 0.95 : hovered && isIdle ? 1.025 : 1;
  const opacity = isLoser ? 0.35 : 1;

  const glowColor = isSelected ? '#34D399' : '#6366F1';
  const borderColor = isSelected
    ? '#34D399'
    : isLoser
    ? 'rgba(255,255,255,0.04)'
    : hovered && isIdle
    ? 'rgba(99,102,241,0.7)'
    : 'rgba(255,255,255,0.08)';

  const boxShadow = isSelected
    ? `0 0 0 1px #34D399, 0 8px 48px rgba(52,211,153,0.25), 0 2px 8px rgba(0,0,0,0.4)`
    : hovered && isIdle
    ? `0 0 0 1px rgba(99,102,241,0.6), 0 8px 48px rgba(99,102,241,0.2), 0 2px 8px rgba(0,0,0,0.4)`
    : `0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)`;

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: mobile ? 'none' : 1,
        width: mobile ? '100%' : undefined,
        minWidth: 0,
        background: isSelected
          ? 'rgba(52,211,153,0.05)'
          : hovered && isIdle
          ? 'rgba(99,102,241,0.07)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor}`,
        borderRadius: mobile ? 18 : 22,
        padding: mobile ? '20px 18px 18px' : '36px 28px 32px',
        cursor: isIdle ? 'pointer' : 'default',
        transform: `scale(${scale})`,
        opacity,
        boxShadow,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.28s ease, box-shadow 0.22s ease, border-color 0.18s ease, background 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: mobile ? 'row' : 'column',
        alignItems: 'center',
        gap: mobile ? 14 : 20,
        userSelect: 'none',
        minHeight: mobile ? 96 : undefined,
      }}
    >
      {/* Subtle noise overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4, pointerEvents: 'none',
      }} />

      {/* Glow pulse on hover */}
      {(hovered || isSelected) && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: `radial-gradient(ellipse at 50% 0%, ${glowColor}18 0%, transparent 70%)`,
          pointerEvents: 'none',
          animation: isSelected ? 'none' : 'rankr-glow-pulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Winner badge */}
      <div style={{
        position: 'absolute', top: 12, right: 14,
        background: isSelected ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isSelected ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: isSelected ? '#34D399' : 'rgba(255,255,255,0.3)',
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '3px 9px', borderRadius: 99,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
      }}>
        {isSelected ? '✓ Winner' : item.wins + item.losses > 0 ? `${Math.round((item.wins / (item.wins + item.losses)) * 100)}%` : 'Unranked'}
      </div>

      {/* Emoji orb */}
      <div style={{
        width: mobile ? 64 : 96, height: mobile ? 64 : 96,
        flexShrink: 0, borderRadius: mobile ? 14 : 20,
        background: `linear-gradient(135deg, ${item.color}33, ${item.color}11)`,
        border: `1.5px solid ${item.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: mobile ? 30 : 42,
        transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1)',
        transform: hovered && isIdle ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0deg)',
        boxShadow: hovered && isIdle ? `0 8px 32px ${item.color}44` : 'none',
      }}>
        {item.emoji}
      </div>

      {/* Text block */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: mobile ? 'flex-start' : 'center',
        gap: mobile ? 4 : 14, minWidth: 0,
        paddingTop: mobile ? 20 : 0,
      }}>
        <div style={{
          fontSize: mobile ? 18 : 24, fontWeight: 700,
          color: '#fff', letterSpacing: '-0.03em',
          textAlign: mobile ? 'left' : 'center', lineHeight: 1.2,
          fontFamily: "'Syne', sans-serif",
        }}>{item.name}</div>

        <div style={{
          fontSize: mobile ? 12 : 13,
          color: 'rgba(255,255,255,0.45)',
          textAlign: mobile ? 'left' : 'center',
          lineHeight: 1.55, maxWidth: mobile ? undefined : 200,
        }}>{item.description}</div>

        <div style={{ display: 'flex', gap: mobile ? 12 : 14, alignItems: 'center', marginTop: mobile ? 0 : 4 }}>
          <StatPill label="W" value={item.wins} color="#34D399" />
          <StatPill label="L" value={item.losses} color="#F87171" />
          <StatPill label="Win%" value={item.wins + item.losses > 0 ? `${Math.round((item.wins / (item.wins + item.losses)) * 100)}%` : '—'} color="#818CF8" />
        </div>
      </div>

      {/* Choose button */}
      {isIdle && !mobile && (
        <div style={{
          background: hovered ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.05)',
          color: hovered ? '#fff' : 'rgba(255,255,255,0.4)',
          border: `1px solid ${hovered ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12, padding: '9px 24px',
          fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
          transition: 'all 0.18s ease', pointerEvents: 'none',
          boxShadow: hovered ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
        }}>
          Choose this →
        </div>
      )}

      {isIdle && mobile && (
        <div style={{
          position: 'absolute', bottom: 10, right: 14,
          fontSize: 11, color: hovered ? '#818CF8' : 'rgba(255,255,255,0.2)',
          fontWeight: 600, transition: 'color 0.15s ease', pointerEvents: 'none',
        }}>Tap →</div>
      )}

      {ripple && <RippleEffect x={ripple.x} y={ripple.y} color="rgba(99,102,241,0.4)" />}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function VSBadge({ mobile }) {
  return (
    <div style={{
      flexShrink: 0,
      width: mobile ? 36 : 44, height: mobile ? 36 : 44,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: mobile ? 10 : 11, fontWeight: 800,
      color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em',
      zIndex: 2, position: 'relative',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>VS</div>
  );
}

function ProgressBar({ current, total, accentColor }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Round {current} of {total}</span>
        <span style={{ fontSize: 11.5, color: accentColor, fontWeight: 600 }}>{Math.round(pct)}% complete</span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${accentColor}, #34D399)`,
          borderRadius: 99, transition: 'width 0.4s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${accentColor}88`,
        }} />
      </div>
    </div>
  );
}

function MatchupScreen({ pairs, currentIndex, onVote, accentColor }) {
  const mobile = useIsMobile();
  const [animState, setAnimState] = useState('idle');
  const [selectedSide, setSelectedSide] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [visible, setVisible] = useState(true);
  const [swipeHint, setSwipeHint] = useState(null); // 'left' | 'right' | null
  const pair = pairs[currentIndex];

  const doVote = useCallback((winner, loser, cx, cy) => {
    if (animState !== 'idle') return;
    setSelectedSide(winner.id);
    setAnimState('selected');
    const particles = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: cx ?? window.innerWidth / 2,
      y: cy ?? window.innerHeight / 2,
      color: ['#6366F1','#818CF8','#34D399','#A5B4FC','#FCD34D','#6EE7B7'][i % 6],
      angle: (i / 16) * 360, distance: 52 + Math.random() * 56,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 800);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setAnimState('idle'); setSelectedSide(null);
        setVisible(true); onVote(winner.id, loser.id);
      }, 260);
    }, 500);
  }, [animState, onVote]);

  const handleSelect = (winner, cx, cy) => {
    if (!pair) return;
    const loser = pair[0].id === winner.id ? pair[1] : pair[0];
    doVote(winner, loser, cx, cy);
  };

  // Keyboard: 1/← = left card, 2/→ = right card
  useKeyboardVote(
    useCallback(() => { if (pair && animState === 'idle') doVote(pair[0], pair[1]); }, [pair, animState, doVote]),
    useCallback(() => { if (pair && animState === 'idle') doVote(pair[1], pair[0]); }, [pair, animState, doVote]),
    animState === 'idle'
  );

  // Swipe: left = vote for right card, right = vote for left card
  useSwipeVote(
    useCallback(() => {
      if (pair && animState === 'idle') { setSwipeHint('left'); setTimeout(() => setSwipeHint(null), 400); doVote(pair[1], pair[0]); }
    }, [pair, animState, doVote]),
    useCallback(() => {
      if (pair && animState === 'idle') { setSwipeHint('right'); setTimeout(() => setSwipeHint(null), 400); doVote(pair[0], pair[1]); }
    }, [pair, animState, doVote]),
    animState === 'idle'
  );

  if (!pair) return null;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 20 : 32 }}>
      <ProgressBar current={currentIndex} total={pairs.length} accentColor={accentColor} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Which do you prefer?
        </div>
      </div>

      {/* Swipe direction hint */}
      {swipeHint && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 9000, pointerEvents: 'none',
          fontSize: 48, opacity: 0.6,
          animation: 'rankr-fadein 0.1s ease',
        }}>
          {swipeHint === 'left' ? '👈' : '👉'}
        </div>
      )}

      <div style={{
        display: 'flex', flexDirection: mobile ? 'column' : 'row',
        gap: mobile ? 10 : 16, alignItems: 'stretch', width: '100%',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        position: 'relative',
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MatchupCard item={pair[0]} onSelect={handleSelect}
            isSelected={selectedSide === pair[0].id}
            isLoser={selectedSide !== null && selectedSide !== pair[0].id}
            isIdle={animState === 'idle'} side="left" mobile={mobile} />
          <KeyHint side="left" mobile={mobile} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <VSBadge mobile={mobile} />
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <MatchupCard item={pair[1]} onSelect={handleSelect}
            isSelected={selectedSide === pair[1].id}
            isLoser={selectedSide !== null && selectedSide !== pair[1].id}
            isIdle={animState === 'idle'} side="right" mobile={mobile} />
          <KeyHint side="right" mobile={mobile} />
        </div>
      </div>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
        {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}
      </div>
    </div>
  );
}

Object.assign(window, { MatchupScreen });
