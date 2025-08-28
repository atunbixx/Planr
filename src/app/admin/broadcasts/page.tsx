import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { BroadcastForm } from './_components/broadcast-form';

export const metadata = {
  title: 'Admin - Broadcasts | Planr',
};

const BroadcastsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Broadcasts" />
      <div className="flex flex-col gap-10">
        <BroadcastForm />
      </div>
    </>
  );
};

export default BroadcastsPage;
