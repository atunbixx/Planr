import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { VendorsAdminService } from '@/features/admin/vendors/vendors.service';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationTab } from './_components/verification-tab';
import { SanctionsTab } from './_components/sanctions-tab';
import { CreditsTab } from './_components/credits-tab';
// ... other tab imports

const service = new VendorsAdminService();

interface VendorProfilePageProps {
  params: {
    id: string;
  };
}

const VendorProfilePage = async ({ params }: VendorProfilePageProps) => {
  const vendor = await service.getVendorById(params.id);

  if (!vendor) {
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName={`Vendor: ${vendor.name}`} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{vendor.name}</CardTitle>
            {/* Add more summary details here */}
          </CardHeader>
          <CardContent>
            <p>Status: {vendor.status} | Verification: {vendor.verification}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="linked">Linked Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card><CardContent className="p-6">Overview content goes here.</CardContent></Card>
          </TabsContent>
          <TabsContent value="verification">
            <VerificationTab vendor={vendor} />
          </TabsContent>
          <TabsContent value="sanctions">
            <SanctionsTab vendor={vendor} />
          </TabsContent>
          <TabsContent value="credits">
            <CreditsTab vendor={vendor} />
          </TabsContent>
          <TabsContent value="timeline">
            <p>Timeline tab content goes here.</p>
          </TabsContent>
          <TabsContent value="linked">
            <p>Linked accounts graph goes here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default VendorProfilePage;

