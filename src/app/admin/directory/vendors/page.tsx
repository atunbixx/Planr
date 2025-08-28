import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { VendorsTable } from './_components/vendors-table';

export const metadata = {
  title: 'Admin - Vendors | Planr',
};

const VendorsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Vendors" />
      <div className="flex flex-col gap-10">
        <VendorsTable />
      </div>
    </>
  );
};

export default VendorsPage;