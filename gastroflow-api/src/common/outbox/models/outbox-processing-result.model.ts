export interface OutboxProcessingResult {
  found: number;
  published: number;
  failed: number;
  pendingRetry: number;
}