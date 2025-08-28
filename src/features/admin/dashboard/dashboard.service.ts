import { DashboardAdminRepository } from './dashboard.repository';

export class DashboardAdminService {
  private repository: DashboardAdminRepository;

  constructor() {
    this.repository = new DashboardAdminRepository();
  }

  async getDashboardStats() {
    // Fetch real data in parallel
    const [sanctionsToday, vendorScoreDistribution] = await Promise.all([
      this.repository.getSanctionsTodayCount(),
      this.repository.getVendorScoreDistribution(),
    ]);

    // Return combined data with stubs
    return {
      kpis: {
        dau: { value: 1234, change: '+5%', isStub: true },
        wau: { value: 8765, change: '+2%', isStub: true },
        mau: { value: 25432, change: '+1%', isStub: true },
        openTickets: { value: 42, change: '-3', isStub: true },
        deliverability: { value: 99.8, change: '+0.1%', isStub: true },
        sanctionsToday: { value: sanctionsToday, isStub: false },
      },
      vendorScoreDistribution,
      incidentBanner: {
        show: true,
        message: 'We are currently investigating degraded performance on vendor searches.',
        isStub: true,
      },
    };
  }
}
