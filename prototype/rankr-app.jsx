
// Rankr Main App — Dark Luxury Arcade Edition
const { useState, useEffect, useRef, useCallback } = React;
const useStateX = useState; // alias used by DoneScreen (imported via extras)

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_ITEMS = [
  { id: 1,  name: 'Tokyo',     emoji: '🗼', color: '#6366F1', description: 'Electric streets, ramen at 3am, endless exploration.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 2,  name: 'Paris',     emoji: '🗺️', color: '#EC4899', description: "Golden light, croissants, the world's most romantic boulevards.", elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 3,  name: 'New York',  emoji: '🗽', color: '#F59E0B', description: 'The city that never sleeps—raw, alive, overwhelming.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 4,  name: 'Kyoto',     emoji: '⛩️', color: '#10B981', description: 'Bamboo groves, ancient temples, lantern-lit evenings.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 5,  name: 'Barcelona', emoji: '🏛️', color: '#F97316', description: "Gaudí's dreamscapes, tapas in the sun, sea breezes.", elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 6,  name: 'Lisbon',    emoji: '🎭', color: '#8B5CF6', description: 'Fado echoes on cobblestones, pastel façades, salt air.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 7,  name: 'Sydney',    emoji: '🦘', color: '#06B6D4', description: 'Harbour sunsets, great whites, and a relaxed roar.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
  { id: 8,  name: 'Marrakech', emoji: '🕌', color: '#EF4444', description: 'Spice markets, medina mazes, rooftop mint tea.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
];

const DEFAULT_CATEGORIES = [
  { id: 'travel', label: '✈️ Travel Destinations', items: DEFAULT_ITEMS },
  {
    id: 'food', label: '🍽️ Foods', items: [
      { id: 101, name: 'Sushi',     emoji: '🍣', color: '#6366F1', description: 'Pristine fish, seasoned rice, pure umami.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 102, name: 'Pizza',     emoji: '🍕', color: '#F59E0B', description: 'Crispy crust, molten cheese, endless variations.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 103, name: 'Tacos',     emoji: '🌮', color: '#10B981', description: 'Street-level joy in a handmade corn shell.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 104, name: 'Ramen',     emoji: '🍜', color: '#EC4899', description: 'Twelve-hour broth, silky noodles, marbled pork.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 105, name: 'Croissant', emoji: '🥐', color: '#F97316', description: 'Laminated butter, shattering flakes, golden morning.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 106, name: 'Biryani',   emoji: '🍛', color: '#8B5CF6', description: 'Fragrant basmati, slow-cooked spice, saffron gold.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
    ],
  },
  {
    id: 'movies', label: '🎬 Movie Genres', items: [
      { id: 201, name: 'Thriller',    emoji: '🔪', color: '#EF4444', description: 'Edge-of-your-seat tension, unreliable narrators.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 202, name: 'Sci-Fi',      emoji: '🚀', color: '#6366F1', description: 'Vast universes, moral dilemmas, wonder and dread.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 203, name: 'Romance',     emoji: '💘', color: '#EC4899', description: 'Longing glances, missed connections, tender resolution.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 204, name: 'Comedy',      emoji: '😂', color: '#F59E0B', description: 'Timing is everything. Absurdity is a gift.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 205, name: 'Horror',      emoji: '👻', color: '#A78BFA', description: 'Jump scares are cheap. Dread is eternal.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
      { id: 206, name: 'Documentary', emoji: '🎥', color: '#10B981', description: 'Truth is stranger and richer than fiction.', elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
    ],
  },
];

// ─── ELO Engine ──────────────────────────────────────────────────────────────
const K = 32;
function expectedScore(ra, rb) { return 1 / (1 + Math.pow(10, (rb - ra) / 400)); }
function newElo(winner, loser) {
  const ea = expectedScore(winner.elo, loser.elo);
  const eb = expectedScore(loser.elo, winner.elo);
  return { winnerElo: winner.elo + K * (1 - ea), loserElo: loser.elo + K * (0 - eb) };
}

// ─── Pair generator ──────────────────────────────────────────────────────────
function generatePairs(items) {
  const pairs = [];
  const ids = items.map(i => i.id);
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      pairs.push([ids[i], ids[j]]);
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'rankr_state_v4';
function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }

// ─── Mobile hook ─────────────────────────────────────────────────────────────
function useIsMobileApp() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 600);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 599px)');
    const h = e => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0A0A0F; }
  button { font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  @keyframes rankr-ripple  { to { transform: translate(-50%,-50%) scale(22); opacity: 0; } }
  @keyframes rankr-confetti {
    0%   { transform: translate(-50%,-50%) rotate(0deg) scale(1); opacity: 1; }
    100% { transform: translate(-50%,-50%) rotate(720deg) translate(calc(cos(var(--angle,0deg))*var(--dist,60px)), calc(sin(var(--angle,0deg))*var(--dist,60px))) scale(0.3); opacity: 0; }
  }
  @keyframes rankr-fadeup  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes rankr-fadein  { from { opacity:0; } to { opacity:1; } }
  @keyframes rankr-spin    { to { transform: rotate(360deg); } }
  @keyframes rankr-modal-in { from { opacity:0; transform:translate(-50%,-46%) scale(0.95); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
  @keyframes rankr-glow-pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
  @keyframes rankr-orb1 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(60px,-40px) scale(1.1); } 66% { transform:translate(-30px,50px) scale(0.95); } }
  @keyframes rankr-orb2 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-50px,60px) scale(1.05); } 66% { transform:translate(40px,-30px) scale(0.9); } }
  @keyframes rankr-orb3 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(30px,40px) scale(1.08); } }
  @keyframes rankr-hero-in { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes rankr-stagger1 { 0%,15% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:translateY(0); } }
  @keyframes rankr-stagger2 { 0%,30% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:translateY(0); } }
  @keyframes rankr-stagger3 { 0%,45% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:translateY(0); } }
  @keyframes rankr-stagger4 { 0%,55% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:translateY(0); } }
`;

// ─── Animated Background ──────────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Base */}
      <div style={{ position: 'absolute', inset: 0, background: '#0A0A0F' }} />
      {/* Orb 1 — indigo */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        top: '-100px', left: '-100px',
        animation: 'rankr-orb1 18s ease-in-out infinite',
        filter: 'blur(40px)',
      }} />
      {/* Orb 2 — violet */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
        bottom: '-80px', right: '-80px',
        animation: 'rankr-orb2 22s ease-in-out infinite',
        filter: 'blur(50px)',
      }} />
      {/* Orb 3 — mint accent */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
        top: '40%', right: '20%',
        animation: 'rankr-orb3 28s ease-in-out infinite',
        filter: 'blur(60px)',
      }} />
      {/* Noise texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
        opacity: 1,
      }} />
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }} />
    </div>
  );
}

// ─── AI Modal ─────────────────────────────────────────────────────────────────
const ITEM_COLORS = ['#6366F1','#EC4899','#F59E0B','#10B981','#F97316','#8B5CF6','#06B6D4','#EF4444'];

function AIModal({ onClose, onAdd, accentColor }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleGenerate = async () => {
    const trimmed = query.trim();
    if (!trimmed || status === 'loading') return;
    setStatus('loading'); setErrorMsg('');
    try {
      const prompt = `You are generating items for a 1v1 ranking app called Rankr.
The user wants to rank: "${trimmed}"
Return a JSON object with exactly this shape (no markdown, no explanation, just raw JSON):
{"label":"<emoji> <Category Name>","items":[{"name":"...","emoji":"...","description":"..."},...]}
Rules: Generate 6 to 8 items. "label" starts with a single emoji. Each "name" is 1-4 words. Each "description" is one evocative sentence, 8-14 words. Each "emoji" is a single emoji. No duplicates. Pure JSON only.`;
      const raw = await window.claude.complete(prompt);
      const data = JSON.parse(raw.replace(/```json|```/g,'').trim());
      if (!data.label || !Array.isArray(data.items) || data.items.length < 2) throw new Error('bad shape');
      const baseId = Date.now();
      onAdd({
        id: `custom_${baseId}`, label: data.label,
        items: data.items.map((item, i) => ({
          id: baseId + i, name: item.name, emoji: item.emoji || '⭐',
          color: ITEM_COLORS[i % ITEM_COLORS.length], description: item.description,
          elo: 1200, wins: 0, losses: 0, eloHistory: [1200],
        })),
      });
      setStatus('done');
    } catch {
      setStatus('error'); setErrorMsg('Generation failed. Try a different category name.');
    }
  };

  const examples = ['90s Hip Hop Albums','JavaScript Frameworks','Fast Food Chains','Pixar Movies','Olympic Sports'];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        animation: 'rankr-fadein 0.18s ease forwards',
      }} />
      <div style={{
        position: 'fixed', zIndex: 1001, top: '50%', left: '50%',
        width: 'min(480px, calc(100vw - 32px))',
        background: 'rgba(18,18,28,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 22,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        backdropFilter: 'blur(24px)',
        padding: '28px 24px 24px',
        display: 'flex', flexDirection: 'column', gap: 20,
        animation: 'rankr-modal-in 0.22s cubic-bezier(.34,1.56,.64,1) forwards',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Syne', sans-serif" }}>
              ✨ AI Category Generator
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Type any topic — Claude builds it instantly.
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13,
            color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); if (e.key === 'Escape') onClose(); }}
            disabled={status === 'loading'}
            placeholder="e.g. Pixar Movies, Coffee Drinks…"
            style={{
              flex: 1, padding: '11px 14px', borderRadius: 12,
              border: `1px solid ${query ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
              fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#fff',
              outline: 'none', background: 'rgba(255,255,255,0.05)',
              transition: 'border-color 0.15s ease',
            }}
          />
          <button onClick={handleGenerate} disabled={!query.trim() || status === 'loading'}
            style={{
              padding: '11px 20px', borderRadius: 12, border: 'none',
              background: !query.trim() || status === 'loading' ? 'rgba(255,255,255,0.06)' : '#6366F1',
              color: !query.trim() || status === 'loading' ? 'rgba(255,255,255,0.25)' : '#fff',
              fontSize: 13.5, fontWeight: 700, cursor: !query.trim() || status === 'loading' ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
              boxShadow: !query.trim() || status === 'loading' ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              transition: 'all 0.15s ease',
            }}>
            {status === 'loading' ? '✨ Generating…' : 'Generate →'}
          </button>
        </div>

        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', borderTop: '2px solid #6366F1', animation: 'rankr-spin 0.7s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#818CF8', fontWeight: 500 }}>Claude is crafting your category…</span>
          </div>
        )}
        {status === 'error' && (
          <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#F87171' }}>
            {errorMsg}
          </div>
        )}
        {status === 'idle' && (
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Try these</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {examples.map(ex => (
                <button key={ex} onClick={() => setQuery(ex)} style={{
                  padding: '5px 12px', borderRadius: 99,
                  border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.color = '#818CF8'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.color = 'rgba(255,255,255,0.45)'; }}
                >{ex}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, accentColor, mobile }) {
  const tabs = [{ id: 'rank', label: 'Matchup', icon: '⚔️' }, { id: 'board', label: 'Rankings', icon: '📊' }];
  return (
    <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: mobile ? '8px 14px' : '8px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
          background: active === t.id ? 'rgba(99,102,241,0.85)' : 'transparent',
          color: active === t.id ? '#fff' : 'rgba(255,255,255,0.3)',
          boxShadow: active === t.id ? '0 2px 12px rgba(99,102,241,0.4)' : 'none',
          transition: 'all 0.18s ease',
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          {!mobile && t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Category Selector ────────────────────────────────────────────────────────
function CategorySelector({ categories, activeId, onChange, accentColor, onNewCategory, onRename, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [menuCat, setMenuCat] = useState(null);
  const DEFAULT_IDS = ['travel', 'food', 'movies'];
  const handleAdd = (newCat) => { onNewCategory(newCat); setShowModal(false); onChange(newCat.id); };
  return (
    <>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => onChange(cat.id)} style={{
              padding: '6px 12px 6px 16px', borderRadius: 99,
              border: `1px solid ${activeId === cat.id ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.08)'}`,
              background: activeId === cat.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
              color: activeId === cat.id ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              fontSize: 12.5, fontWeight: activeId === cat.id ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s ease', letterSpacing: '-0.01em',
              boxShadow: activeId === cat.id ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {cat.label}
              <span
                onClick={e => { e.stopPropagation(); setMenuCat(menuCat === cat.id ? null : cat.id); }}
                style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                  padding: '0 2px', borderRadius: 4,
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => e.stopPropagation() || (e.target.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.2)'}
              >···</span>
            </button>
            {menuCat === cat.id && (
              <CategoryMenu
                cat={cat}
                isDefault={DEFAULT_IDS.includes(cat.id)}
                onRename={newLabel => { onRename(cat.id, newLabel); setMenuCat(null); }}
                onDelete={() => { onDelete(cat.id); setMenuCat(null); }}
                onClose={() => setMenuCat(null)}
              />
            )}
          </div>
        ))}
        <button onClick={() => setShowModal(true)} style={{
          padding: '6px 14px', borderRadius: 99,
          border: '1px dashed rgba(99,102,241,0.4)',
          background: 'transparent', color: '#818CF8',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderStyle = 'solid'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed'; }}
        >✨ New</button>
      </div>
      {showModal && <AIModal onClose={() => setShowModal(false)} onAdd={handleAdd} accentColor={accentColor} />}
    </>
  );
}

// ─── Done Screen ─────────────────────────────────────────────────────────────
function DoneScreen({ onViewResults, onReset, accentColor, winner, category }) {
  const [showShare, setShowShare] = useStateX(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: '48px 24px', textAlign: 'center', animation: 'rankr-fadeup 0.45s ease forwards' }}>
      <div style={{
        width: 96, height: 96, borderRadius: 24,
        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 52, boxShadow: '0 8px 40px rgba(52,211,153,0.2)',
      }}>{winner?.emoji || '🏆'}</div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.05em', marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>
          All done!
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 300, lineHeight: 1.6 }}>
          {winner ? <><strong style={{ color: '#fff' }}>{winner.name}</strong> topped the charts. Check the full rankings.</>
            : 'Every matchup complete. The rankings are live.'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onViewResults} style={{
          background: '#6366F1', color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)', transition: 'all 0.15s ease', fontFamily: 'inherit',
        }}>View Rankings →</button>
        <button onClick={() => setShowShare(true)} style={{
          background: 'rgba(52,211,153,0.12)', color: '#34D399',
          border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12,
          padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.15s ease', fontFamily: 'inherit',
        }}>🔗 Share Results</button>
        <button onClick={onReset} style={{
          background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
          padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
        }}>↺ Restart</button>
      </div>
      {showShare && category && <ShareModal category={category} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
function HomeScreen({ categories, accentColor, onStart, onNewCategory, mobile, indexMap, pairsMap }) {
  const [showModal, setShowModal] = useState(false);

  const feats = [
    { icon: '⚔️', title: '1v1 Matchups',   desc: 'Two options at a time. No analysis paralysis.' },
    { icon: '📊', title: 'Live Rankings',   desc: 'Watch your true preferences emerge in real time.' },
    { icon: '✨', title: 'AI Categories',   desc: 'Generate any topic instantly with one word.' },
  ];

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', zIndex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: mobile ? '40px 16px 60px' : '60px 24px 80px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', animation: 'rankr-hero-in 0.7s ease forwards' }}>
          {/* Logo mark */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, boxShadow: '0 12px 48px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.3)',
          }}>⚡</div>

          <div style={{
            fontSize: mobile ? 56 : 76, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.06em', lineHeight: 0.95,
            fontFamily: "'Syne', sans-serif",
            background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Rankr</div>

          <div style={{
            fontSize: mobile ? 15 : 17, color: 'rgba(255,255,255,0.45)',
            marginTop: 16, lineHeight: 1.6, maxWidth: 320, margin: '16px auto 0',
          }}>
            Pick your favourite in 1v1 matchups.<br />Watch your true rankings emerge.
          </div>
        </div>

        {/* Feature trio */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 10, width: '100%',
          animation: 'rankr-stagger2 0.9s ease forwards',
        }}>
          {feats.map((f, i) => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '18px 16px',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: mobile ? 'row' : 'column',
              alignItems: mobile ? 'center' : 'flex-start',
              gap: mobile ? 12 : 10,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <div style={{ fontSize: mobile ? 22 : 24, width: mobile ? 32 : undefined, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Syne', sans-serif" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.45 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Category picker card */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 22, padding: '24px 20px',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', gap: 14,
          animation: 'rankr-stagger3 1.1s ease forwards',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pick a category to start
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categories.map((cat, i) => {
                const totalPairs = cat.items.length * (cat.items.length - 1) / 2;
                const done = indexMap?.[cat.id] || 0;
                const pct = totalPairs > 0 ? Math.min((done / totalPairs) * 100, 100) : 0;
                const isDone = done >= totalPairs && totalPairs > 0;
                return (
                <button key={cat.id} onClick={() => onStart(cat.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ProgressRing pct={pct} size={40} stroke={2.5} color={accentColor} emoji={cat.label.split(' ')[0]} done={isDone} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>
                        {cat.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                        {isDone ? '🎉 All done!' : done > 0 ? `${done} / ${totalPairs} matchups` : `${cat.items.length} items · ${totalPairs} matchups`}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, color: isDone ? '#34D399' : 'rgba(255,255,255,0.2)' }}>{isDone ? '✓' : '→'}</span>
                </button>
                );
              })}

            {/* AI generate row */}
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              border: '1px dashed rgba(99,102,241,0.35)',
              background: 'transparent', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderStyle = 'solid'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>✨</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#818CF8', letterSpacing: '-0.02em' }}>Generate with AI</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Type any topic — Claude builds it for you</div>
                </div>
              </div>
              <span style={{ fontSize: 15, color: '#818CF8' }}>→</span>
            </button>
          </div>
        </div>
      </div>

      {showModal && <AIModal onClose={() => setShowModal(false)} onAdd={(newCat) => { onNewCategory(newCat); setShowModal(false); onStart(newCat.id); }} accentColor={accentColor} />}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function RankrApp({ tweaks }) {
  const accentColor = tweaks?.accentColor || '#6366F1';
  const mobile = useIsMobileApp();

  const [categories, setCategories] = useState(() => loadState()?.categories || DEFAULT_CATEGORIES);

  const [activeCategoryId, setActiveCategoryId] = useState(tweaks?.categoryId || 'travel');

  const [pairsMap, setPairsMap] = useState(() => {
    const saved = loadState();
    if (saved?.pairsMap) return saved.pairsMap;
    const map = {};
    DEFAULT_CATEGORIES.forEach(cat => { map[cat.id] = generatePairs(cat.items); });
    return map;
  });

  const [indexMap, setIndexMap] = useState(() => loadState()?.indexMap || {});
  const [tab, setTab] = useState('rank');
  const [hasStarted, setHasStarted] = useState(() => {
    try { return !!localStorage.getItem('rankr_started'); } catch { return false; }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('rankr_onboarded'); } catch { return true; }
  });
  const [showShare, setShowShare] = useState(false);

  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];
  const pairs = pairsMap[activeCategoryId] || [];
  const currentIndex = indexMap[activeCategoryId] || 0;
  const isDone = currentIndex >= pairs.length;

  const resolvedPairs = pairs.map(([idA, idB]) => {
    const itemMap = Object.fromEntries(activeCategory.items.map(i => [i.id, i]));
    return [itemMap[idA], itemMap[idB]].filter(Boolean);
  }).filter(p => p.length === 2);

  useEffect(() => { saveState({ categories, pairsMap, indexMap }); }, [categories, pairsMap, indexMap]);

  const handleVote = useCallback((winnerId, loserId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== activeCategoryId) return cat;
      const winner = cat.items.find(i => i.id === winnerId);
      const loser  = cat.items.find(i => i.id === loserId);
      if (!winner || !loser) return cat;
      const { winnerElo, loserElo } = newElo(winner, loser);
      return {
        ...cat, items: cat.items.map(item => {
          if (item.id === winnerId) return { ...item, elo: winnerElo, wins: item.wins + 1, eloHistory: [...(item.eloHistory || [1200]), winnerElo].slice(-12) };
          if (item.id === loserId)  return { ...item, elo: loserElo, losses: item.losses + 1, eloHistory: [...(item.eloHistory || [1200]), loserElo].slice(-12) };
          return item;
        }),
      };
    }));
    setIndexMap(prev => ({ ...prev, [activeCategoryId]: (prev[activeCategoryId] || 0) + 1 }));
  }, [activeCategoryId]);

  const handleReset = useCallback((catId) => {
    const id = catId || activeCategoryId;
    setCategories(prev => prev.map(cat => cat.id !== id ? cat : {
      ...cat, items: cat.items.map(item => ({ ...item, elo: 1200, wins: 0, losses: 0, eloHistory: [1200] })),
    }));
    setPairsMap(prev => {
      const cat = categories.find(c => c.id === id);
      return { ...prev, [id]: cat ? generatePairs(cat.items) : [] };
    });
    setIndexMap(prev => ({ ...prev, [id]: 0 }));
  }, [activeCategoryId, categories]);

  const handleNewCategory = useCallback((newCat) => {
    setCategories(prev => [...prev, newCat]);
    setPairsMap(prev => ({ ...prev, [newCat.id]: generatePairs(newCat.items) }));
    setIndexMap(prev => ({ ...prev, [newCat.id]: 0 }));
  }, []);

  const handleRenameCategory = useCallback((catId, newLabel) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, label: newLabel } : c));
  }, []);

  const handleDeleteCategory = useCallback((catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    setPairsMap(prev => { const n = { ...prev }; delete n[catId]; return n; });
    setIndexMap(prev => { const n = { ...prev }; delete n[catId]; return n; });
    if (activeCategoryId === catId) {
      const remaining = categories.filter(c => c.id !== catId);
      if (remaining.length > 0) setActiveCategoryId(remaining[0].id);
      else setHasStarted(false);
    }
  }, [activeCategoryId, categories]);

  const handleStart = (catId) => {
    try { localStorage.setItem('rankr_started', '1'); } catch {}
    setActiveCategoryId(catId); setHasStarted(true); setTab('rank');
  };

  const handleCategoryChange = (id) => { setActiveCategoryId(id); setTab('rank'); };

  const topItem = [...activeCategory.items].sort((a, b) => {
    const wrA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const wrB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    return wrB - wrA;
  })[0];

  if (!hasStarted) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <AnimatedBackground />
        <HomeScreen categories={categories} accentColor={accentColor} mobile={mobile}
          onStart={handleStart} onNewCategory={handleNewCategory}
          indexMap={indexMap} pairsMap={pairsMap} />
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <AnimatedBackground />

      <div style={{
        minHeight: '100vh', position: 'relative', zIndex: 1,
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: mobile ? '16px 12px 60px' : '28px 16px 80px',
      }}>
        <div style={{ width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: mobile ? 'nowrap' : 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => { try { localStorage.removeItem('rankr_started'); } catch {} setHasStarted(false); }}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '6px 12px', fontSize: 12.5,
                  color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600, transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#818CF8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
              >← Home</button>

              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                }}>⚡</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>Rankr</div>
                  {!mobile && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.01em' }}>1v1 tournament ranking</div>}
                </div>
              </div>
            </div>
            <TabBar active={tab} onChange={setTab} accentColor={accentColor} mobile={mobile} />
          </div>

          {/* Category selector */}
          <CategorySelector categories={categories} activeId={activeCategoryId}
            onChange={handleCategoryChange} accentColor={accentColor}
            onNewCategory={handleNewCategory}
            onRename={handleRenameCategory}
            onDelete={handleDeleteCategory} />

          {/* Main content card */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: mobile ? 18 : 24,
            padding: mobile ? '18px 14px' : '28px 24px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
            minHeight: 400,
          }}>
            {tab === 'rank' ? (
              isDone ? (
                <DoneScreen onViewResults={() => setTab('board')}
                  onReset={() => handleReset(activeCategoryId)} accentColor={accentColor}
                  winner={topItem} category={activeCategory} />
              ) : (
                <MatchupScreen pairs={resolvedPairs} currentIndex={currentIndex}
                  onVote={handleVote} accentColor={accentColor} />
              )
            ) : (
              <Leaderboard items={activeCategory.items} accentColor={accentColor}
                onReset={() => handleReset(activeCategoryId)} />
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.01em' }}>
            Rankings update live · Progress auto-saved · Switch categories freely
          </div>
        </div>
      </div>

      {/* Onboarding hint — first time only */}
      {showOnboarding && tab === 'rank' && !isDone && (
        <OnboardingHint mobile={mobile} onDismiss={() => {
          try { localStorage.setItem('rankr_onboarded', '1'); } catch {}
          setShowOnboarding(false);
        }} />
      )}

      {/* Share modal */}
      {showShare && <ShareModal category={activeCategory} onClose={() => setShowShare(false)} />}
    </>
  );
}

Object.assign(window, { RankrApp });
