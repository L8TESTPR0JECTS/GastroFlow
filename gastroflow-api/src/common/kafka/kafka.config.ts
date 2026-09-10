export interface KafkaConfig {
  clientId: string;
  brokers: string[];
}

export function getKafkaConfig(): KafkaConfig {
  return {
    clientId: process.env.KAFKA_CLIENT_ID ?? 'gastroflow-api',
    brokers: (
      process.env.KAFKA_BROKERS ?? 'localhost:9092'
    )
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean)
  };
}