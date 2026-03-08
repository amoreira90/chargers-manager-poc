import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';

export default function Users() {
  return (
    <>
      <PageMeta
        title="Gestión de Usuarios | EVSE Admin"
        description="Administración de usuarios del sistema"
      />
      <PageBreadcrumb pageTitle="Usuarios" />

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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Próximamente: administración de usuarios, roles y permisos del sistema
          </p>
        </div>
      </div>
    </>
  );
}
