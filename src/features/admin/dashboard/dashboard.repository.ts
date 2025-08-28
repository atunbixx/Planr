import { BaseRepository } from '@/lib/repositories/BaseRepository';
import { startOfDay } from 'date-fns';

export class DashboardAdminRepository extends BaseRepository {
  async getSanctionsTodayCount(): Promise<number> {
    const today = startOfDay(new Date());
    try {
      return await this.db.sanction.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      });
    } catch (e) {
      console.error("Failed to get sanctions count", e);
      return 0;
    }
  }

  async getVendorScoreDistribution(): Promise<{ range: string; count: number }[]> {
    try {
      // This is a complex query. A raw query is often best for this kind of aggregation.
      const result: { range: string; count: bigint }[] = await this.db.$queryRaw`
        SELECT
          CASE
            WHEN score >= 90 THEN '90-100'
            WHEN score >= 80 THEN '80-89'
            WHEN score >= 70 THEN '70-79'
            WHEN score >= 60 THEN '60-69'
            ELSE 'Below 60'
          END as range,
          COUNT(*) as count
        FROM vendors
        GROUP BY range
        ORDER BY range DESC;
      `;

      // Convert BigInt to Number
      return result.map(r => ({ ...r, count: Number(r.count) }));
    } catch (e) {
      console.error("Failed to get vendor score distribution", e);
      return [];
    }
  }
}
