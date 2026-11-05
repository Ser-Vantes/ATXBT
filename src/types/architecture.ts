export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market' | 'ioc' | 'fok' | 'post_only';
export type OrderStatus = 'new' | 'partially_filled' | 'filled' | 'canceled' | 'rejected';

export interface Order {
  id: string;
  clientOrderId: string;
  accountId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  price: number;
  qty: number;
  filledQty: number;
  remainingQty: number;
  status: OrderStatus;
  timestampNs: number;
  sequenceId: number;
}

export interface MatchExecution {
  matchId: string;
  symbol: string;
  makerOrderId: string;
  takerOrderId: string;
  makerAccountId: string;
  takerAccountId: string;
  makerSide: OrderSide;
  price: number;
  qty: number;
  timestampNs: number;
  sequenceId: number;
}

export interface PriceLevel {
  price: number;
  totalQty: number;
  orderCount: number;
  orders: Order[];
}

export interface OrderBookSnapshot {
  symbol: string;
  timestampNs: number;
  sequenceId: number;
  bids: PriceLevel[];
  asks: PriceLevel[];
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadBps: number;
}

export interface KafkaMessage {
  id: string;
  topic: string;
  partition: number;
  offset: number;
  key: string;
  timestamp: string;
  payload: Record<string, any>;
  sizeBytes: number;
  latencyUs: number;
}

export interface MicroserviceNode {
  id: string;
  name: string;
  role: string;
  tech: string;
  status: 'healthy' | 'degraded' | 'recovering' | 'standby';
  p99LatencyUs: number;
  throughputKops: number;
  cpuPercent: number;
  memoryMb: number;
  description: string;
  keyResponsibilities: string[];
}

export interface ChaosScenario {
  id: string;
  title: string;
  targetNode: string;
  description: string;
  injectedFailure: string;
  expectedOutcome: string;
  recoveryMechanism: string;
  rpo: string;
  rto: string;
}

export interface NexusComparisonMetric {
  category: string;
  nexusOlaXbt: {
    approach: string;
    throughput: string;
    latency: string;
    faultTolerance: string;
    tradeoffs: string;
  };
  ourRustKafkaArchitecture: {
    approach: string;
    throughput: string;
    latency: string;
    faultTolerance: string;
    advantages: string;
  };
}
