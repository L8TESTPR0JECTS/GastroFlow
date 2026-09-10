export const RABBITMQ_CONNECTION = Symbol('RABBITMQ_CONNECTION');
export const RABBITMQ_CHANNEL = Symbol('RABBITMQ_CHANNEL');

export const GASTROFLOW_TASKS_EXCHANGE = 'gastroflow.tasks';

export const REPLENISHMENT_REPORT_QUEUE =
  'gastroflow.replenishment-report';

export const REPLENISHMENT_REPORT_ROUTING_KEY =
  'replenishment.report.generate';

export const GASTROFLOW_DEAD_LETTER_EXCHANGE =
  'gastroflow.dead-letter';

export const REPLENISHMENT_REPORT_DLQ =
  'gastroflow.replenishment-report.dlq';

export const REPLENISHMENT_REPORT_FAILED_ROUTING_KEY =
  'replenishment.report.failed';