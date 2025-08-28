import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { ApprovalsTable } from './_components/approvals-table';

export const metadata = {
  title: 'Admin - Approval Queue | Planr',
};

const ApprovalsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Approval Queue" />
      <div className="flex flex-col gap-10">
        <ApprovalsTable />
      </div>
    </>
  );
};

export default ApprovalsPage;
