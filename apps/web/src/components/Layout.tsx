import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import i18n from '../i18n';
import api from '../lib/api';
import { fmt, useBalances, useOnline } from '../lib/hooks';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import { Logo, Mascot } from './Mascot';

const NAV = [
  { to: '/', key: 'lobby', end: true },
  { to: '/roulette', key: 'roulette' },
  { to: '/raffles', key: 'raffles' },
  { to: '/bonuses', key: 'bonuses' },
  { to: '/vip', key: 'vip' },
  { to: '/referrals', key: 'referrals' },
];

// Secondary destinations surfaced in the mobile "More" sheet.
const MORE_LINKS = [
  { to: '/bonuses', key: 'bonuses', icon: '🎁' },
  { to: '/promo', key: 'promo', icon: '🏷' },
  { to: '/vip', key: 'vip', icon: '👑' },
  { to: '/referrals', key: 'referrals', icon: '🤝' },
  { to: '/cashback', key: 'cashback', icon: '💸' },
  { to: '/notifications', key: 'notifications', icon: '🔔' },
  { to: '/profile', key: 'profile', icon: '🦄' },
  { to: '/support', key: 'support', icon: '🛟' },
];

function LangSwitch({ className = '' }: { className?: string }) {
  const [, force] = useState(0);
  const set = (lng: string) => {
    i18n.changeLanguage(lng);
    force((x) => x + 1);
  };
  return (
    <div className={`flex overflow-hidden rounded-xl border border-white/10 text-xs ${className}`}>
      {['ru', 'en'].map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          className={`px-2.5 py-1.5 uppercase transition ${
            i18n.language?.startsWith(l) ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ModeBalance({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { mode, setMode, currency } = useUI();
  const { data: balances } = useBalances();
  const bal = balances?.find((b) => b.mode === mode && b.currency === currency);
  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/30 p-1 pl-1.5">
      <div className="flex overflow-hidden rounded-lg text-[11px] font-bold">
        <button
          onClick={() => setMode('DEMO')}
          className={`px-1.5 py-1 transition ${mode === 'DEMO' ? 'bg-lav/30 text-white' : 'text-white/45'}`}
          title={t('common.demo')}
        >
          {compact ? 'D' : t('common.demo')}
        </button>
        <button
          onClick={() => setMode('REAL')}
          className={`px-1.5 py-1 transition ${mode === 'REAL' ? 'bg-mint/25 text-white' : 'text-white/45'}`}
          title={t('common.real')}
        >
          {compact ? 'R' : t('common.real')}
        </button>
      </div>
      <Link to="/wallet" className="px-1 text-sm font-bold tabular-nums">
        {fmt(bal?.amount ?? '0', compact ? 2 : 4)} <span className="text-white/40">{currency}</span>
      </Link>
      <Link to="/wallet" className="btn-primary !rounded-xl !px-2.5 !py-1 text-sm">
        +
      </Link>
    </div>
  );
}

function Bell() {
  const { data } = useQuery({
    queryKey: ['unread'],
    queryFn: async () => (await api.get('/notifications/unread-count')).data,
    refetchInterval: 20_000,
  });
  const count = data?.count ?? 0;
  return (
    <Link to="/notifications" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-white/5">
      <span className="text-lg">🔔</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-bubble px-1 text-[11px] font-bold text-night">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

function AccountMenu() {
  const { user, clear } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: useAuth.getState().refreshToken });
    } catch {
      /* ignore */
    }
    clear();
    navigate('/');
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-1 pl-1 pr-3 hover:bg-white/10"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-holo text-night">
          <Mascot size={22} />
        </span>
        <span className="hidden text-sm font-semibold sm:block">{user?.username}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-surface-2 shadow-card" onMouseLeave={() => setOpen(false)}>
          <div className="border-b border-white/10 px-4 py-3 text-xs text-white/50">
            ID #{user?.accountId} · {user?.role}
          </div>
          {[
            ['/profile', 'Профиль / Profile'],
            ['/wallet', 'Кошелёк / Wallet'],
            ['/cashback', 'Кешбэк / Cashback'],
            ['/support', 'Поддержка / Support'],
          ].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">
              {label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-sun hover:bg-white/5">
              ⚙ Admin
            </Link>
          )}
          <button onClick={logout} className="block w-full px-4 py-2.5 text-left text-sm text-bubble hover:bg-white/5">
            Выйти / Log out
          </button>
        </div>
      )}
    </div>
  );
}

/** Mobile bottom tab bar. 4 primary destinations + a "More" sheet trigger. */
function BottomNav({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const { t } = useTranslation();
  const authed = !!useAuth((s) => s.accessToken);
  const tabs = [
    { to: '/', key: 'lobby', icon: '🏠', end: true },
    { to: '/roulette', key: 'roulette', icon: '🎯' },
    { to: '/raffles', key: 'raffles', icon: '🎉' },
    authed ? { to: '/wallet', key: 'wallet', icon: '💼' } : { to: '/bonuses', key: 'bonuses', icon: '🎁' },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 glass border-t border-white/10 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tb) => (
          <NavLink
            key={tb.to}
            to={tb.to}
            end={(tb as any).end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] transition ${
                isActive && !moreOpen ? 'text-white' : 'text-white/55'
              }`
            }
          >
            <span className="text-xl leading-none">{tb.icon}</span>
            {t(`nav.${tb.key}`)}
          </NavLink>
        ))}
        <button
          onClick={onMore}
          className={`flex flex-col items-center gap-0.5 py-2 text-[11px] transition ${moreOpen ? 'text-white' : 'text-white/55'}`}
        >
          <span className="text-xl leading-none">☰</span>
          Ещё
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { user, clear } = useAuth();
  const authed = !!user;
  const navigate = useNavigate();
  const logout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: useAuth.getState().refreshToken });
    } catch {
      /* ignore */
    }
    clear();
    onClose();
    navigate('/');
  };
  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-surface-2 p-5 transition-transform duration-200 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        {authed ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-holo text-night">
              <Mascot size={26} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-bold">{user?.username}</div>
              <div className="text-xs text-white/50">ID #{user?.accountId} · {user?.role}</div>
            </div>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Link to="/login" onClick={onClose} className="btn-ghost">
              {t('common.login')}
            </Link>
            <Link to="/register" onClick={onClose} className="btn-primary">
              {t('common.register')}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {MORE_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl border border-white/10 py-3 text-xs ${
                  isActive ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/70'
                }`
              }
            >
              <span className="text-xl">{l.icon}</span>
              {t(`nav.${l.key}`)}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] py-3 text-xs text-sun"
            >
              <span className="text-xl">⚙</span>
              Admin
            </NavLink>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link to="/page/about" onClick={onClose} className="text-white/55 hover:text-white">
              {t('nav.about')}
            </Link>
            <Link to="/page/responsible-gaming" onClick={onClose} className="text-white/55 hover:text-white">
              {t('nav.responsible')}
            </Link>
            <Link to="/page/contacts" onClick={onClose} className="text-white/55 hover:text-white">
              {t('nav.contacts')}
            </Link>
          </div>
          <LangSwitch />
        </div>

        {authed && (
          <button onClick={logout} className="btn-ghost mt-4 w-full text-bubble">
            {t('common.logout')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Layout() {
  const { t } = useTranslation();
  const authed = !!useAuth((s) => s.accessToken);
  const online = useOnline();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  // close the mobile sheet on navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        {/* Desktop header */}
        <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:flex">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `nav-link !py-2 text-sm ${isActive ? 'nav-link-active' : ''}`}
              >
                {t(`nav.${n.key}`)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="chip">
              <span className="h-2 w-2 rounded-full bg-mint shadow-glow-mint" />
              {Math.max(online.sockets, 1)} {t('common.online')}
            </span>
            {authed && <ModeBalance />}
            <LangSwitch />
            {authed && <Bell />}
            {authed ? (
              <AccountMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  {t('common.register')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile header (slim) */}
        <div className="flex h-14 items-center justify-between gap-2 px-3 lg:hidden">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex min-w-0 items-center gap-1.5">
            {authed ? (
              <>
                <ModeBalance compact />
                <Bell />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !px-3 !py-1.5 text-sm">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="btn-primary !px-3 !py-1.5 text-sm">
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-4 sm:py-6">
        <Outlet />
      </main>

      <Footer />

      <BottomNav onMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      {/* spacer so fixed bottom nav never hides content on mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-10 border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-white/50">{t('brand.tagline')}. 18+. Provably-fair · RTP 99%.</p>
        </div>
        <FooterCol title={t('nav.lobby')} links={[['/', t('nav.lobby')], ['/roulette', t('nav.roulette')], ['/raffles', t('nav.raffles')], ['/vip', t('nav.vip')]]} />
        <FooterCol title={t('nav.profile')} links={[['/wallet', t('nav.wallet')], ['/bonuses', t('nav.bonuses')], ['/promo', t('nav.promo')], ['/referrals', t('nav.referrals')]]} />
        <FooterCol
          title="Инфо / Info"
          links={[
            ['/page/about', t('nav.about')],
            ['/page/responsible-gaming', t('nav.responsible')],
            ['/page/private-game', 'Приватная игра'],
            ['/page/contacts', t('nav.contacts')],
            ['/page/terms', 'Условия / Terms'],
          ]}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} KuKuMBA · Играйте ответственно · Demo & Real
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-white/80">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="text-white/50 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
