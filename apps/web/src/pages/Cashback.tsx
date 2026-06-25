import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgePercent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiError } from '../lib/api';
import { fmt } from '../lib/hooks';
import { toast } from '../store/toast';

export default function Cashback({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['cashback'], queryFn: async () => (await api.get('/cashback/status')).data });

  const claim = async () => {
    try {
      await api.post('/cashback/claim');
      toast.success(t('common.done'));
      qc.invalidateQueries({ queryKey: ['cashback'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const items = data?.claimable ?? [];
  const has = items.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {!embedded && (
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <BadgePercent size={24} className="text-mint" /> {t('nav.cashback')}
        </h1>
      )}
      <div className="card space-y-4 p-6 text-center">
        <div className="text-sm text-white/50">Ваш процент кешбэка (от VIP-уровня)</div>
        <div className="holo-text text-5xl font-extrabold">{data?.percent ?? 0}%</div>
        {has ? (
          <div className="space-y-2">
            {items.map((i: any) => (
              <div key={i.currency + i.mode} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2">
                <span className="text-white/60">Доступно ({i.currency} {i.mode})</span>
                <span className="font-bold text-mint">+{fmt(i.cashback, 4)} {i.currency}</span>
              </div>
            ))}
            <button onClick={claim} className="btn-primary w-full">{t('common.claim')}</button>
          </div>
        ) : (
          <div className="text-white/40">Нет доступного кешбэка. Делайте ставки, чтобы накопить.</div>
        )}
      </div>
      <p className="text-center text-xs text-white/40">
        Кешбэк рассчитывается от чистых потерь с момента последнего получения.
      </p>
    </div>
  );
}
