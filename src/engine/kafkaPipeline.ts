import { KafkaMessage } from '../types/architecture';

export interface KafkaTopicStats {
  topic: string;
  partitionCount: number;
  totalMessages: number;
  currentOffset: number;
  retentionHours: number;
  consumerLag: number;
  p99FlushLatencyUs: number;
}

export class KafkaEventPipeline {
  private messages: KafkaMessage[] = [];
  private currentOffsets: Record<string, number> = {
    'orders.inbound': 412095,
    'sequencer.partitioned': 412095,
    'engine.matches': 189420,
    'marketdata.l2.delta': 389104,
    'ledger.clearing': 189420,
    'nexus.mcp.telemetry': 95400,
  };

  constructor() {
    this.seedInitialMessages();
  }

  private seedInitialMessages() {
    const topics = [
      { topic: 'orders.inbound', key: 'BTC-USDT', payload: { action: 'PLACE', type: 'LIMIT', side: 'BUY', price: 96420, qty: 1.5, account: 'acc-401' } },
      { topic: 'sequencer.partitioned', key: 'BTC-USDT', payload: { seq_id: 100045, partition: 3, leader: 'broker-1', term: 4 } },
      { topic: 'engine.matches', key: 'BTC-USDT', payload: { match_id: 'mat-100045', price: 96420, qty: 1.5, maker: 'acc-mm-1', taker: 'acc-401' } },
      { topic: 'marketdata.l2.delta', key: 'BTC-USDT', payload: { depth_change: 'BID_REMOVE', price: 96420, new_qty: 0.8 } },
      { topic: 'ledger.clearing', key: 'acc-401', payload: { locked_usdt: -144630, credited_btc: 1.5, fee_usdt: 14.46 } },
      { topic: 'nexus.mcp.telemetry', key: 'agent-olaxbt-1', payload: { agent: 'alpha-arb-vault', signal: 'LONG_VOL', confidence: 0.94 } },
    ];

    topics.forEach((t, i) => {
      this.publish(t.topic, t.key, t.payload, 18 + Math.floor(Math.random() * 12));
    });
  }

  public publish(topic: string, key: string, payload: Record<string, any>, latencyUs: number = 22): KafkaMessage {
    const currentOffset = (this.currentOffsets[topic] || 1000) + 1;
    this.currentOffsets[topic] = currentOffset;

    // Partition calculation by hash of key modulo 8 (standard 8-partition setup per symbol)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const partition = Math.abs(hash) % 8;

    const message: KafkaMessage = {
      id: `kmsg-${topic}-${currentOffset}`,
      topic,
      partition,
      offset: currentOffset,
      key,
      timestamp: new Date().toISOString().split('T')[1].replace('Z', ''),
      payload,
      sizeBytes: JSON.stringify(payload).length + 64,
      latencyUs,
    };

    this.messages.unshift(message);
    if (this.messages.length > 80) this.messages.pop();
    return message;
  }

  public getRecentMessages(filterTopic?: string): KafkaMessage[] {
    if (!filterTopic || filterTopic === 'all') return this.messages;
    return this.messages.filter((m) => m.topic === filterTopic);
  }

  public getTopicStats(): KafkaTopicStats[] {
    return [
      {
        topic: 'orders.inbound',
        partitionCount: 16,
        totalMessages: this.currentOffsets['orders.inbound'] || 0,
        currentOffset: this.currentOffsets['orders.inbound'] || 0,
        retentionHours: 72,
        consumerLag: 0,
        p99FlushLatencyUs: 18,
      },
      {
        topic: 'sequencer.partitioned',
        partitionCount: 16,
        totalMessages: this.currentOffsets['sequencer.partitioned'] || 0,
        currentOffset: this.currentOffsets['sequencer.partitioned'] || 0,
        retentionHours: 168,
        consumerLag: 0,
        p99FlushLatencyUs: 14,
      },
      {
        topic: 'engine.matches',
        partitionCount: 16,
        totalMessages: this.currentOffsets['engine.matches'] || 0,
        currentOffset: this.currentOffsets['engine.matches'] || 0,
        retentionHours: 720,
        consumerLag: 1,
        p99FlushLatencyUs: 16,
      },
      {
        topic: 'marketdata.l2.delta',
        partitionCount: 32,
        totalMessages: this.currentOffsets['marketdata.l2.delta'] || 0,
        currentOffset: this.currentOffsets['marketdata.l2.delta'] || 0,
        retentionHours: 24,
        consumerLag: 0,
        p99FlushLatencyUs: 11,
      },
      {
        topic: 'ledger.clearing',
        partitionCount: 16,
        totalMessages: this.currentOffsets['ledger.clearing'] || 0,
        currentOffset: this.currentOffsets['ledger.clearing'] || 0,
        retentionHours: 8760,
        consumerLag: 2,
        p99FlushLatencyUs: 24,
      },
      {
        topic: 'nexus.mcp.telemetry',
        partitionCount: 8,
        totalMessages: this.currentOffsets['nexus.mcp.telemetry'] || 0,
        currentOffset: this.currentOffsets['nexus.mcp.telemetry'] || 0,
        retentionHours: 168,
        consumerLag: 0,
        p99FlushLatencyUs: 32,
      },
    ];
  }
}
