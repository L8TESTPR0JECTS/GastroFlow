export interface InboxEvent {
  id: string;
  eventId: string;
  eventType: string;
  restaurantId: string;

  processedAt: string;
}