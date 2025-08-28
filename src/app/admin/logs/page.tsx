import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { LogsTable } from './_components/logs-table';

export const metadata = {
  title: 'Admin - Audit Logs | Planr',
};

const AuditLogsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Audit Logs" />
      <div className="flex flex-col gap-10">
        <LogsTable />
      </div>
    </>
  );
};

export default AuditLogsPage;