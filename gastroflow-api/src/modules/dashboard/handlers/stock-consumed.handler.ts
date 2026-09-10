import { Inject, Injectable } from '@nestjs/common';
import type {
  Firestore,
  Transaction
} from 'firebase-admin/firestore';

import type { DomainEventEnvelope } from '../../../common/events/domain-event-envelope';
import type { DomainEventHandler } from '../../../common/events/domain-event-handler';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type { StockConsumedEventPayload } from '../../stock-consumptions/events/stock-consumed.event';
import type { RestaurantSalesSummary } from '../models/restaurant-sales-summary.model';

@Injectable()
export class StockConsumedHandler
  implements DomainEventHandler<StockConsumedEventPayload>
{
  readonly eventType = 'StockConsumed';

  private readonly collectionName = 'restaurant_sales_summaries';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore
  ) {}

  async handle(
    transaction: Transaction,
    event: DomainEventEnvelope<StockConsumedEventPayload>
  ): Promise<void> {
    const ref = this.firestore
      .collection(this.collectionName)
      .doc(event.restaurantId);

    const snapshot = await transaction.get(ref);

    const now = new Date().toISOString();

    if (!snapshot.exists) {
      const summary: RestaurantSalesSummary = {
        restaurantId: event.restaurantId,
        totalQuantitySold: event.payload.quantitySold,
        totalSalesRevenue: event.payload.totalSalesRevenue,
        totalInventoryCostConsumed:
          event.payload.inventoryCostConsumed,
        totalGrossProfit: event.payload.estimatedGrossProfit,
        processedStockConsumedEvents: 1,
        createdAt: now,
        updatedAt: now
      };

      transaction.create(ref, summary);

      return;
    }

    const current = snapshot.data() as RestaurantSalesSummary;

    transaction.update(ref, {
      totalQuantitySold:
        current.totalQuantitySold + event.payload.quantitySold,

      totalSalesRevenue:
        current.totalSalesRevenue +
        event.payload.totalSalesRevenue,

      totalInventoryCostConsumed:
        current.totalInventoryCostConsumed +
        event.payload.inventoryCostConsumed,

      totalGrossProfit:
        current.totalGrossProfit +
        event.payload.estimatedGrossProfit,

      processedStockConsumedEvents:
        current.processedStockConsumedEvents + 1,

      updatedAt: now
    });
  }
}