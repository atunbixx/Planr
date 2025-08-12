import { Vendor } from '@prisma/client'

export class VendorService {
  static getVendorStats(vendors: Vendor[]) {
    const statusGroups = vendors.reduce((acc, vendor) => {
      const status = vendor.status || 'potential'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: vendors.length,
      byStatus: {
        potential: statusGroups.potential || 0,
        contacted: statusGroups.contacted || 0,
        quoted: statusGroups.quoted || 0,
        booked: statusGroups.booked || 0,
        completed: statusGroups.completed || 0
      },
      costs: {
        estimated: vendors.reduce((sum, v) => sum + Number(v.estimatedCost || 0), 0),
        actual: vendors.reduce((sum, v) => sum + Number(v.actualCost || 0), 0)
      },
      contractsSigned: vendors.filter(v => v.contractSigned).length
    }
  }

  static calculateBudgetImpact(vendors: Vendor[], totalBudget: number) {
    const totalEstimated = vendors.reduce((sum, v) => sum + Number(v.estimatedCost || 0), 0)
    const totalActual = vendors.reduce((sum, v) => sum + Number(v.actualCost || 0), 0)
    
    return {
      estimatedPercentage: totalBudget > 0 ? Math.round(((totalEstimated / totalBudget) * 100) * 100) / 100 : 0,
      actualPercentage: totalBudget > 0 ? Math.round(((totalActual / totalBudget) * 100) * 100) / 100 : 0,
      variance: totalActual - totalEstimated,
      remainingBudget: totalBudget - totalActual
    }
  }
}