
// Rankr Leaderboard — Dark Luxury Edition
const { useState: useStateLB, useEffect: useEffectLB } = React;

function Sparkline({ history, color, width = 72, height = 28 }) {
  if (!history || history.length < 2) {
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <line x1={0} y1={height/2} x2={width} y2={height/2}
          stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeDasharray="3,3" />
      </svg>
    );
  }
  const min = Math.min(...history), max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,'')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(pts[pts.length-1].split(',')[0])} cy={parseFloat(pts[pts.length-1].split(',')[1])}
        r={3} fill={color} />
    </svg>
  );
}

function MomentumBadge({ delta }) {
  if (delta === 0) return (
    <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '2px 7px' }}>—</span>
  );
  const up = delta > 0;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: up ? '#34D399' : '#F87171',
      background: up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
      borderRadius: 6, padding: '2px 7px',
      display: 'inline-flex', alignItems: 'center', gap: 2,
      border: `1px solid ${up ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
    }}>
      {up ? '▲' : '▼'} {Math.abs(Math.round(delta))}
    </span>
  );
}

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  if (medals[rank]) return <span style={{ fontSize: 18, lineHeight: 1 }}>{medals[rank]}</span>;
  return (
    <span style={{
      width: 26, height: 26, borderRadius: '50%',
      background: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.25)',
      fontSize: 11, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>{rank}</span>
  );
}

function LeaderboardRow({ item, rank, accentColor, index }) {
  const [hovered, setHoveredLB] = useStateLB(false);
  const [mobile, setMobileLB] = useStateLB(() => window.innerWidth < 600);
  useEffectLB(() => {
    const mq = window.matchMedia('(max-width: 599px)');
    const h = e => setMobileLB(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const isTop3 = rank <= 3;
  const winRate = item.wins + item.losses > 0 ? (item.wins / (item.wins + item.losses)) * 100 : 0;

  return (
    <div
      onMouseEnter={() => setHoveredLB(true)}
      onMouseLeave={() => setHoveredLB(false)}
      style={{
        display: 'flex', alignItems: 'center',
        gap: mobile ? 10 : 14,
        padding: mobile ? '11px 12px' : '13px 16px',
        borderRadius: 14,
        background: hovered
          ? 'rgba(99,102,241,0.07)'
          : index % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
        transition: 'all 0.15s ease',
        animation: 'rankr-fadeup 0.35s ease forwards',
        animationDelay: `${index * 0.04}s`,
        opacity: 0,
      }}
    >
      <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <RankBadge rank={rank} />
      </div>

      <div style={{
        width: 38, height: 38, flexShrink: 0, borderRadius: 10,
        background: `linear-gradient(135deg, ${item.color}33, ${item.color}11)`,
        border: `1.5px solid ${item.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>{item.emoji}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 650, color: '#fff',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: "'Syne', sans-serif",
        }}>{item.name}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 2, display: 'flex', gap: 8 }}>
          <span style={{ color: '#34D399', fontWeight: 600 }}>{item.wins}W</span>
          <span>/</span>
          <span style={{ color: '#F87171', fontWeight: 600 }}>{item.losses}L</span>
          {item.wins + item.losses > 0 && (
            <span>· {Math.round(winRate)}% wr</span>
          )}
        </div>
      </div>

      {!mobile && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <Sparkline history={item.eloHistory} color={isTop3 ? '#818CF8' : 'rgba(255,255,255,0.2)'} width={60} height={22} />
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>momentum</div>
        </div>
      )}

      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 52 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Syne', sans-serif" }}>
          {item.wins + item.losses > 0 ? `${Math.round(winRate)}%` : '—'}
        </span>
        <MomentumBadge delta={item.eloHistory?.length >= 2 ? item.eloHistory[item.eloHistory.length-1] - item.eloHistory[item.eloHistory.length-2] : 0} />
      </div>
    </div>
  );
}

function Leaderboard({ items, accentColor, onReset }) {
  const sorted = [...items].sort((a, b) => {
    const wrA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const wrB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    if (wrB !== wrA) return wrB - wrA;
    return b.wins - a.wins;
  });
  const totalVotes = items.reduce((s, i) => s + i.wins + i.losses, 0) / 2;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', fontFamily: "'Syne', sans-serif" }}>
            Rankings
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
            {Math.round(totalVotes)} matchups · sorted by win rate
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
            padding: '7px 16px', fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.15s ease', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(99,102,241,0.15)'; e.target.style.color = '#818CF8'; e.target.style.borderColor = 'rgba(99,102,241,0.3)'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'rgba(255,255,255,0.4)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >↺ Reset</button>
      </div>

      {/* Bar chart */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          Win Rate Distribution
        </div>
        {sorted.slice(0, 5).map((item, i) => {
          const wr = item.wins + item.losses > 0 ? (item.wins / (item.wins + item.losses)) * 100 : 0;
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textAlign: 'right' }}>{i+1}</div>
              <div style={{ fontSize: 15, width: 22 }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.max(wr, 3)}%`,
                    background: i === 0 ? `linear-gradient(90deg, ${accentColor}, #34D399)` : 'rgba(99,102,241,0.35)',
                    borderRadius: 99, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
                    boxShadow: i === 0 ? `0 0 8px ${accentColor}66` : 'none',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', width: 34, textAlign: 'right' }}>
                {item.wins + item.losses > 0 ? `${Math.round(wr)}%` : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '6px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {sorted.map((item, index) => (
          <LeaderboardRow key={item.id} item={item} rank={index+1}
            accentColor={accentColor} index={index} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Leaderboard, Sparkline });
