import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardAdminService } from '@/features/admin/dashboard/dashboard.service';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Terminal } from 'lucide-react';

const service = new DashboardAdminService();

const KpiCard = ({ title, value, change, isStub }: { title: string; value: number | string; change?: string; isStub?: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {isStub && <span className="text-xs text-muted-foreground">Stub</span>}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && <p className="text-xs text-muted-foreground">{change} from last period</p>}
    </CardContent>
  </Card>
);

const AdminDashboardPage = async () => {
  const data = await service.getDashboardStats();

  return (
    <>
      <Breadcrumb pageName="Dashboard" />

      {data.incidentBanner.show && data.incidentBanner.isStub && (
        <Alert className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>{data.incidentBanner.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <KpiCard title="DAU" value={data.kpis.dau.value} change={data.kpis.dau.change} isStub={data.kpis.dau.isStub} />
        <KpiCard title="WAU" value={data.kpis.wau.value} change={data.kpis.wau.change} isStub={data.kpis.wau.isStub} />
        <KpiCard title="MAU" value={data.kpis.mau.value} change={data.kpis.mau.change} isStub={data.kpis.mau.isStub} />
        <KpiCard title="Open Tickets" value={data.kpis.openTickets.value} change={data.kpis.openTickets.change} isStub={data.kpis.openTickets.isStub} />
        <KpiCard title="Deliverability" value={`${data.kpis.deliverability.value}%`} change={data.kpis.deliverability.change} isStub={data.kpis.deliverability.isStub} />
        <KpiCard title="Sanctions Today" value={data.kpis.sanctionsToday.value} isStub={data.kpis.sanctionsToday.isStub} />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.vendorScoreDistribution.map((item) => (
                <div key={item.range} className="flex items-center">
                  <div className="w-24 text-sm text-muted-foreground">{item.range}</div>
                  <div className="flex-1 bg-secondary rounded-full h-4">
                    <div
                      className="bg-primary h-4 rounded-full"
                      style={{ width: `${item.count}%` }} // Note: This is a simple percentage, not scaled to max
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-bold">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboardPage;