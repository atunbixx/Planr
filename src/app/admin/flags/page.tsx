import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { FlagsTable } from './_components/flags-table';

export const metadata = {
  title: 'Admin - Feature Flags | Planr',
};

const FlagsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Feature Flags" />
      <div className="flex flex-col gap-10">
        <FlagsTable />
      </div>
    </>
  );
};

export default FlagsPage;
