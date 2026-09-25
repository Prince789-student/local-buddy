/**
 * StorePulse - Inventory Analytics & Metrics Engine
 * Computes valuation, health indices, stock alerts, and category stats
 */

class AnalyticsService {
  constructor(storageService) {
    this.storage = storageService;
  }

  getMetrics() {
    const items = this.storage.getInventory();
    
    let totalSKUs = items.length;
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categoryBreakdown = {};

    items.forEach(item => {
      const stock = parseInt(item.stock, 10) || 0;
      const cost = parseFloat(item.costPrice) || 0;
      const selling = parseFloat(item.sellingPrice) || 0;
      const threshold = parseInt(item.lowStockThreshold, 10) || 5;

      totalUnits += stock;
      totalCostValuation += stock * cost;
      totalRetailValuation += stock * selling;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= threshold) {
        lowStockCount++;
      }

      const cat = item.category || 'Uncategorized';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    const potentialGrossProfit = Math.max(0, totalRetailValuation - totalCostValuation);
    const profitMarginPercent = totalRetailValuation > 0 
      ? Math.round((potentialGrossProfit / totalRetailValuation) * 100) 
      : 0;

    return {
      totalSKUs,
      totalUnits,
      totalCostValuation: Math.round(totalCostValuation),
      totalRetailValuation: Math.round(totalRetailValuation),
      potentialGrossProfit: Math.round(potentialGrossProfit),
      profitMarginPercent,
      lowStockCount,
      outOfStockCount,
      categoryBreakdown
    };
  }

  getLowStockItems() {
    const items = this.storage.getInventory();
    return items.filter(item => {
      const stock = parseInt(item.stock, 10) || 0;
      const threshold = parseInt(item.lowStockThreshold, 10) || 5;
      return stock > 0 && stock <= threshold;
    });
  }

  getOutOfStockItems() {
    const items = this.storage.getInventory();
    return items.filter(item => (parseInt(item.stock, 10) || 0) === 0);
  }
}

window.analyticsService = new AnalyticsService(window.storageService);
