import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { fetchChargers, createCharger, runChargerAction } from "../api";
import { Charger, ChargerStatus, ChargerAction, CreateChargerPayload } from "../types";

export default function Chargers() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharger, setNewCharger] = useState<CreateChargerPayload>({
    name: "",
    address: "",
    latitude: 0,
    longitude: 0,
    powerKilowatts: 22,
  });

  useEffect(() => {
    loadChargers();
    const interval = setInterval(loadChargers, 15000); // Actualizar cada 15s
    return () => clearInterval(interval);
  }, []);

  const loadChargers = async () => {
    try {
      const data = await fetchChargers();
      setChargers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar cargadores");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCharger(newCharger);
      setNewCharger({ name: "", address: "", latitude: 0, longitude: 0, powerKilowatts: 22 });
      setShowCreateForm(false);
      await loadChargers();
    } catch (err: any) {
      setError(err.message || "Error al crear cargador");
    }
  };

  const handleAction = async (chargerId: string, action: ChargerAction) => {
    try {
      await runChargerAction(chargerId, action);
      await loadChargers();
    } catch (err: any) {
      setError(err.message || `Error al ejecutar ${action}`);
    }
  };

  const getStatusBadge = (status: ChargerStatus) => {
    const colors: Record<ChargerStatus, string> = {
      AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      CHARGING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      OUT_OF_SERVICE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando cargadores...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Gestión de Cargadores | EVSE Admin"
        description="Panel de administración de cargadores de vehículos eléctricos"
      />
      <PageBreadcrumb pageTitle="Cargadores" />

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-300 dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus:ring-brand-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cargador
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-theme-xs">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Crear Nuevo Cargador</h3>
          <form onSubmit={handleCreateCharger} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={newCharger.name}
                onChange={(e) => setNewCharger({ ...newCharger, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white dark:focus:border-brand-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={newCharger.address}
                onChange={(e) => setNewCharger({ ...newCharger, address: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white dark:focus:border-brand-800"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={newCharger.latitude}
                  onChange={(e) => setNewCharger({ ...newCharger, latitude: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white dark:focus:border-brand-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={newCharger.longitude}
                  onChange={(e) => setNewCharger({ ...newCharger, longitude: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white dark:focus:border-brand-800"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Potencia (kW)
              </label>
              <input
                type="number"
                value={newCharger.powerKilowatts}
                onChange={(e) => setNewCharger({ ...newCharger, powerKilowatts: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white dark:focus:border-brand-800"
                min="1"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-300"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-theme-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Nombre</th>
                <th scope="col" className="px-6 py-3">Dirección</th>
                <th scope="col" className="px-6 py-3">Potencia</th>
                <th scope="col" className="px-6 py-3">Estado</th>
                <th scope="col" className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {chargers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay cargadores registrados
                  </td>
                </tr>
              ) : (
                chargers.map((charger) => (
                  <tr key={charger.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {charger.id}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {charger.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {charger.address}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {charger.powerKilowatts} kW
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(charger.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {charger.status === "OUT_OF_SERVICE" && (
                          <button
                            onClick={() => handleAction(charger.id, "activate")}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Activar
                          </button>
                        )}
                        {charger.status === "AVAILABLE" && (
                          <>
                            <button
                              onClick={() => handleAction(charger.id, "deactivate")}
                              className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                            >
                              Desactivar
                            </button>
                            <button
                              onClick={() => handleAction(charger.id, "start-charging")}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Iniciar Carga
                            </button>
                          </>
                        )}
                        {charger.status === "CHARGING" && (
                          <button
                            onClick={() => handleAction(charger.id, "stop-charging")}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Detener Carga
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
