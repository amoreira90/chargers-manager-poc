import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function Sessions() {
  return (
    <>
      <PageMeta
        title="Sesiones de Carga | EVSE Admin"
        description="Historial de sesiones de carga"
      />
      <PageBreadcrumb pageTitle="Sesiones" />
      
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-theme-xs p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Historial de Sesiones
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Próximamente: seguimiento de sesiones de carga, consumo energético y historial completo
          </p>
        </div>
      </div>
    </>
  );
}
