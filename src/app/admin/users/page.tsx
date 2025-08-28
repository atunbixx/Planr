import { UsersTable } from './_components/users-table';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';

export const metadata = {
  title: 'Admin - Users | Planr',
};

const UsersPage = () => {
  return (
    <>
      <Breadcrumb pageName="Users" />
      <div className="flex flex-col gap-10">
        <UsersTable />
      </div>
    </>
  );
};

export default UsersPage;