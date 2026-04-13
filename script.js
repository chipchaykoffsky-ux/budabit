/* ============ NORI — landing scripts ============ */

/* sticky header */
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* reveal on scroll */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* form */
const form = document.getElementById('regisztracio');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.firstName || !data.lastName || !data.email || !data.phone) {
    alert('Kérjük, töltse ki az összes mezőt.');
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Küldés...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '✓ Köszönjük!';
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      form.reset();
    }, 2200);
  }, 800);
});

/* ============ LIVE PRICES (CoinGecko, cached fallback) ============ */
const COINS = [
  { id:'bitcoin',    sym:'BTC', name:'Bitcoin',  icon:'₿' },
  { id:'ethereum',   sym:'ETH', name:'Ethereum', icon:'Ξ' },
  { id:'solana',     sym:'SOL', name:'Solana',   icon:'◆' },
  { id:'ripple',     sym:'XRP', name:'XRP',      icon:'✕' },
  { id:'cardano',    sym:'ADA', name:'Cardano',  icon:'₳' },
  { id:'dogecoin',   sym:'DOGE',name:'Dogecoin', icon:'Ð' },
];

const FALLBACK = {
  bitcoin:   { eur: 58420,  change: 2.4 },
  ethereum:  { eur: 2847,   change: 1.8 },
  solana:    { eur: 142,    change: -0.6 },
  ripple:    { eur: 0.52,   change: 3.1 },
  cardano:   { eur: 0.41,   change: -1.2 },
  dogecoin:  { eur: 0.084,  change: 5.7 },
};

const fmt = (n) => {
  if (n >= 1000) return n.toLocaleString('hu-HU', { maximumFractionDigits: 0 });
  if (n >= 1)    return n.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
  return n.toLocaleString('hu-HU', { maximumFractionDigits: 4 });
};

const renderTickers = (data) => {
  const grid = document.getElementById('tickerGrid');
  if (!grid) return;
  grid.innerHTML = COINS.map(c => {
    const d = data[c.id] || FALLBACK[c.id];
    const price = d.eur ?? d.price;
    const change = d.change;
    const up = change >= 0;
    return `
      <div class="ticker-card">
        <div class="tc-top">
          <div class="tc-name">
            <div class="tc-icon">${c.icon}</div>
            <div>
              <div>${c.name}</div>
              <div class="tc-symbol">${c.sym}/EUR</div>
            </div>
          </div>
        </div>
        <div class="tc-price">€ ${fmt(price)}</div>
        <div class="tc-change ${up ? 'tc-up' : 'tc-down'}">
          ${up ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
        </div>
      </div>`;
  }).join('');
};

const fetchPrices = async () => {
  try {
    const ids = COINS.map(c => c.id).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('api');
    const j = await r.json();
    const out = {};
    COINS.forEach(c => {
      if (j[c.id]) out[c.id] = { eur: j[c.id].eur, change: j[c.id].eur_24h_change ?? 0 };
    });
    renderTickers(out);
  } catch {
    renderTickers(FALLBACK);
  }
};

fetchPrices();
setInterval(fetchPrices, 60_000);
