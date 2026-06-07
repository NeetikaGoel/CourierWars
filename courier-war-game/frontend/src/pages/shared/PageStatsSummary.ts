export interface PageStatsSummaryData {
    totalMatches?: number;
    totalWins?: number;
    totalLosses?: number;
    courierMatches?: number;
    courierWins?: number;
    saboteurMatches?: number;
    saboteurWins?: number;
    fastestDeliveryMs?: number | null;
    bestSaboteurDelayMs?: number | null;
  }
  
  export function pageStatsSummaryRender(container: HTMLElement, stats: PageStatsSummaryData): void {
    container.innerHTML = `
      <div class="page-stats-grid">
        <div><span>Total Matches</span><strong>${stats.totalMatches ?? 0}</strong></div>
        <div><span>Total Wins</span><strong>${stats.totalWins ?? 0}</strong></div>
        <div><span>Total Losses</span><strong>${stats.totalLosses ?? 0}</strong></div>
        <div><span>Courier Matches</span><strong>${stats.courierMatches ?? 0}</strong></div>
        <div><span>Courier Wins</span><strong>${stats.courierWins ?? 0}</strong></div>
        <div><span>Saboteur Matches</span><strong>${stats.saboteurMatches ?? 0}</strong></div>
        <div><span>Saboteur Wins</span><strong>${stats.saboteurWins ?? 0}</strong></div>
        <div><span>Fastest Delivery</span><strong>${stats.fastestDeliveryMs ?? "-"}</strong></div>
        <div><span>Best Saboteur Delay</span><strong>${stats.bestSaboteurDelayMs ?? "-"}</strong></div>
      </div>
    `;
  }