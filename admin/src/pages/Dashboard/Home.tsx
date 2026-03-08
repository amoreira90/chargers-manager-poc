import { useEffect, useMemo, useState } from 'react';
import { fetchChargers, toApiError } from '../../api';
import PageMeta from '../../components/common/PageMeta';
import type { Charger } from '../../types';

const formatKw = (value: number): string =>
  new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{value}</h3>
      {hint ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

export default function Home() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchChargers();
        if (!mounted) {
          return;
        }
        setChargers(data);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(toApiError(err));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const metrics = useMemo(() => {
    const total = chargers.length;
    const inUse = chargers.filter((charger) => charger.status === 'CHARGING').length;
    const outOfService = chargers.filter((charger) => charger.status === 'OUT_OF_SERVICE').length;
    const active = total - outOfService;
    const installedPower = chargers.reduce((sum, charger) => sum + charger.powerKilowatts, 0);
    const powerInUse = chargers
      .filter((charger) => charger.status === 'CHARGING')
      .reduce((sum, charger) => sum + charger.powerKilowatts, 0);

    return {
      total,
      active,
      inUse,
      outOfService,
      installedPower,
      powerInUse,
    };
  }, [chargers]);

  const lastUpdated = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <PageMeta
        title="Dashboard de Cargadores | EVSE Admin"
        description="Panel operativo con métricas de cargadores en tiempo real"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Dashboard de Operación
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Actualizado a las {lastUpdated}
            </p>
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            {loading ? 'Sincronizando...' : 'Conectado al backend'}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Equipos registrados"
            value={String(metrics.total)}
            hint="Total de cargadores ingresados"
          />
          <MetricCard
            label="Equipos activos"
            value={String(metrics.active)}
            hint="Disponibles + en uso"
          />
          <MetricCard label="Equipos en uso" value={String(metrics.inUse)} hint="Estado CHARGING" />
          <MetricCard
            label="Fuera de servicio"
            value={String(metrics.outOfService)}
            hint="Estado OUT_OF_SERVICE"
          />
          <MetricCard label="Potencia instalada" value={`${formatKw(metrics.installedPower)} kW`} />
          <MetricCard
            label="kW en uso"
            value={`${formatKw(metrics.powerInUse)} kW`}
            hint="Consumo instantáneo estimado"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 xl:col-span-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Estado de la Red
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Distribución operativa de cargadores
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Disponibles</span>
                  <span>
                    {metrics.total > 0
                      ? Math.round(((metrics.active - metrics.inUse) / metrics.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{
                      width: `${metrics.total > 0 ? ((metrics.active - metrics.inUse) / metrics.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>En carga</span>
                  <span>
                    {metrics.total > 0 ? Math.round((metrics.inUse / metrics.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${metrics.total > 0 ? (metrics.inUse / metrics.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Fuera de servicio</span>
                  <span>
                    {metrics.total > 0
                      ? Math.round((metrics.outOfService / metrics.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{
                      width: `${metrics.total > 0 ? (metrics.outOfService / metrics.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Cobertura actual
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {chargers.length > 0
                    ? `${chargers.length} cargadores registrados en ${new Set(chargers.map((charger) => charger.address.split(',').slice(-1)[0]?.trim() || 'Sin ciudad')).size} ciudad(es).`
                    : 'Aún no hay cargadores para mostrar cobertura.'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-600" /> Disponible
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> En carga
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-600" /> Fuera de servicio
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 xl:col-span-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Resumen rápido
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Estado actual de la red</p>

            <div className="mt-4 space-y-3">
              {chargers.slice(0, 8).map((charger) => (
                <div
                  key={charger.id}
                  className="rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {charger.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{charger.address}</p>
                  <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-300">
                    {charger.status} · {formatKw(charger.powerKilowatts)} kW
                  </p>
                </div>
              ))}
              {chargers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Todavía no hay cargadores registrados.
                </p>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              Ingresos y kWh históricos: pendiente de endpoint en backend.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
