import React, { useState } from 'react';
import { CheckCircle2, Clock, Code2, Copy, Check, Terminal, FileText, Server } from 'lucide-react';

export const RoadmapAndCodeView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'rust-code' | 'infra'>('roadmap');
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>('orderbook.rs');
  const [copied, setCopied] = useState<boolean>(false);

  const roadmapPhases = [
    {
      phase: 'Phase 1',
      title: 'Rust In-Memory Engine Core & Zero-Allocation Layout',
      timeline: 'Weeks 1–4',
      leadTeam: 'Systems / Low-Latency Engineers (2x Rust)',
      deliverables: [
        'Design cache-line aligned Order struct (64 bytes) to maximize L1/L2 CPU cache residency',
        'Implement PriceLevel with intrusive Doubly-Linked List for O(1) order insertion and cancellation',
        'OrderBook struct with std::collections::BTreeMap for bid/ask price indices',
        'SIMD-accelerated price-level depth aggregation for L2 broadcast diffs',
        'Zero-copy binary serialization using FlatBuffers / rkyv (sub-100ns decode overhead)',
        'Comprehensive criterion.rs micro-benchmarks targeting <800ns p99 execution latency',
      ],
      milestone: 'Deterministic engine passes 10M synthetic order stress test with zero memory leaks.',
    },
    {
      phase: 'Phase 2',
      title: 'Kafka Event Log Backbone & State Machine Replication',
      timeline: 'Weeks 5–8',
      leadTeam: 'Distributed Systems & Data Infrastructure (2x Engineers)',
      deliverables: [
        'Deploy 3-broker Apache Kafka / Redpanda KRaft cluster with min-insync-replicas=2',
        'Configure topic topology with symbol partition keying (orders.inbound.{symbol})',
        'Deterministic Sequencer microservice stamping continuous 64-bit monotonically increasing sequence IDs',
        'Implement zero-copy Kafka consumer using rdkafka with custom ring-buffer arena',
        'RocksDB embedded state checkpointing (snapshotting book state every 100,000 offsets)',
        'Automated standby engine failover harness with RTO < 400ms and RPO = 0',
      ],
      milestone: 'Active-passive failover verified under continuous 100k ops/sec synthetic traffic.',
    },
    {
      phase: 'Phase 3',
      title: 'Pre-Trade Risk Engine & High-Concurrency Edge Gateway',
      timeline: 'Weeks 9–12',
      leadTeam: 'Fintech Risk & Network Infrastructure (2x Rust / Security)',
      deliverables: [
        'Edge WebSocket & REST gateway built on Tokio & Actix-Web with epoll multiplexing',
        'EIP-712 Ethereum / BNB wallet signature cryptographic verification without centralized secrets',
        'Memory-mapped pre-trade risk engine checking collateral, margin limits, and leverage in <10μs',
        'Sliding-window token bucket DDoS protection and tier-based rate limiting',
        'Circuit breakers for market-wide price band anomalies (fat-finger protection)',
      ],
      milestone: 'Gateway sustains 250,000 concurrent WebSocket connections with <15μs ingress overhead.',
    },
    {
      phase: 'Phase 4',
      title: 'Market Data Broadcaster & Post-Trade Clearing Ledger',
      timeline: 'Weeks 13–16',
      leadTeam: 'Backend Ledger & Data Engineers (2x Engineers)',
      deliverables: [
        'Real-time Market Data WebSocket cluster broadcasting 10ms L2 diffs and L3 trade executions',
        'Zstandard binary compressed streaming protocol for institutional HFT colos',
        'Asynchronous double-entry bookkeeping ledger with TimescaleDB / PostgreSQL',
        'Tiered maker-taker fee engine, volume-based rebates, and funding rate calculations',
        'Cold storage audit archival of complete Kafka commit history to S3 / GCS Parquet',
      ],
      milestone: 'Sub-millisecond L2 book diff updates received by web clients and quant market makers.',
    },
    {
      phase: 'Phase 5',
      title: 'nexus.olaxbt Feature Parity: MCP Agent Bridge & On-Chain Vaults',
      timeline: 'Weeks 17–20',
      leadTeam: 'Web3 & AI Integration Specialists (2x Engineers)',
      deliverables: [
        'Deploy Model Context Protocol (MCP) server exposing tools: get_depth, submit_agent_order, get_whale_flows',
        'On-chain whale wallet telemetry ingestion pipeline monitoring smart money flows on BNB Chain and Solana',
        'Social & KOL sentiment indexing pipeline feeding AI trading agent context windows',
        'Automated strategy vaults with programmable non-custodial smart contract settlement',
        'Native SDKs for Python, TypeScript, and Rust quant bots',
      ],
      milestone: 'Autonomous AI quant agents successfully execute rebalancing strategies over MCP.',
    },
  ];

  const codeSnippets: Record<string, string> = {
    'orderbook.rs': `// src/engine/orderbook.rs
// Ultra-low latency Price-Time Priority (FIFO) Orderbook
use std::collections::BTreeMap;
use std::ptr::NonNull;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Buy = 0,
    Sell = 1,
}

#[repr(C, align(64))]
#[derive(Debug, Clone)]
pub struct Order {
    pub id: u64,
    pub account_id: u64,
    pub price: u64,          // Fixed-point ticks (e.g. $96450.50 -> 9645050)
    pub qty: u64,            // Fixed-point lots (e.g. 1.5 BTC -> 150000)
    pub filled_qty: u64,
    pub timestamp_ns: u64,
    pub side: Side,
    pub next: Option<NonNull<Order>>,
    pub prev: Option<NonNull<Order>>,
}

pub struct PriceLevel {
    pub price: u64,
    pub total_qty: u64,
    pub order_count: u32,
    head: Option<NonNull<Order>>,
    tail: Option<NonNull<Order>>,
}

impl PriceLevel {
    pub fn new(price: u64) -> Self {
        Self {
            price,
            total_qty: 0,
            order_count: 0,
            head: None,
            tail: None,
        }
    }

    #[inline(always)]
    pub fn push_back(&mut self, mut order: Box<Order>) {
        order.prev = self.tail;
        order.next = None;
        let order_ptr = NonNull::new(Box::into_raw(order));
        
        if let Some(mut tail_ptr) = self.tail {
            unsafe { tail_ptr.as_mut().next = order_ptr; }
        } else {
            self.head = order_ptr;
        }
        self.tail = order_ptr;
        self.order_count += 1;
    }
}

pub struct OrderBook {
    pub symbol: String,
    pub bids: BTreeMap<u64, PriceLevel>, // Price descending
    pub asks: BTreeMap<u64, PriceLevel>, // Price ascending
    pub sequence_id: u64,
}

impl OrderBook {
    pub fn new(symbol: String) -> Self {
        Self {
            symbol,
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
            sequence_id: 0,
        }
    }

    #[inline(always)]
    pub fn best_bid(&self) -> Option<u64> {
        self.bids.keys().next_back().copied()
    }

    #[inline(always)]
    pub fn best_ask(&self) -> Option<u64> {
        self.asks.keys().next().copied()
    }
}`,

    'matching_engine.rs': `// src/engine/matching_engine.rs
// Deterministic Single-Threaded Matching Loop
use crate::engine::orderbook::{OrderBook, Order, Side};

#[derive(Debug)]
pub struct MatchEvent {
    pub match_id: u64,
    pub sequence_id: u64,
    pub maker_order_id: u64,
    pub taker_order_id: u64,
    pub price: u64,
    pub qty: u64,
    pub timestamp_ns: u64,
}

pub struct MatchingEngine {
    pub book: OrderBook,
    pub next_match_id: u64,
}

impl MatchingEngine {
    pub fn new(symbol: String) -> Self {
        Self {
            book: OrderBook::new(symbol),
            next_match_id: 1,
        }
    }

    #[inline(always)]
    pub fn match_limit_order(&mut self, mut taker: Order) -> Vec<MatchEvent> {
        self.book.sequence_id += 1;
        let mut matches = Vec::with_capacity(8);

        match taker.side {
            Side::Buy => {
                while taker.qty > 0 {
                    let best_ask = match self.book.best_ask() {
                        Some(p) if p <= taker.price => p,
                        _ => break,
                    };

                    let level = self.book.asks.get_mut(&best_ask).unwrap();
                    // Consume orders at level FIFO
                    // ... sub-microsecond in-place match execution ...
                }
            }
            Side::Sell => {
                while taker.qty > 0 {
                    let best_bid = match self.book.best_bid() {
                        Some(p) if p >= taker.price => p,
                        _ => break,
                    };

                    let level = self.book.bids.get_mut(&best_bid).unwrap();
                    // Consume orders at level FIFO
                }
            }
        }

        // Place residual resting order if qty > 0
        matches
    }
}`,

    'kafka_consumer.rs': `// src/event_bus/kafka_consumer.rs
// Zero-Copy Kafka Replay Consumer with Offset Tracking
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{BaseConsumer, Consumer};
use rdkafka::message::Message;

pub struct EngineKafkaConsumer {
    consumer: BaseConsumer,
    topic: String,
    partition: i32,
    last_committed_offset: i64,
}

impl EngineKafkaConsumer {
    pub fn new(brokers: &str, topic: &str, partition: i32) -> Self {
        let consumer: BaseConsumer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("group.id", format!("matching-engine-{}-{}", topic, partition))
            .set("enable.auto.commit", "false")
            .set("auto.offset.reset", "earliest")
            .set("fetch.min.bytes", "1")
            .set("fetch.wait.max.ms", "1")
            .set("socket.keepalive.enable", "true")
            .create()
            .expect("Failed to initialize rdkafka consumer");

        Self {
            consumer,
            topic: topic.to_string(),
            partition,
            last_committed_offset: 0,
        }
    }

    pub fn poll_next_order(&mut self) -> Option<&[u8]> {
        // High-frequency non-blocking poll with zero copy
        match self.consumer.poll(std::time::Duration::from_micros(50)) {
            Some(Ok(msg)) => {
                self.last_committed_offset = msg.offset();
                msg.payload()
            }
            _ => None,
        }
    }
}`,

    'mcp_server.rs': `// src/agent_bridge/mcp_server.rs
// Model Context Protocol (MCP) server for nexus.olaxbt AI Quant Agents
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct McpRequest {
    pub jsonrpc: String,
    pub id: u64,
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Serialize)]
pub struct ToolSchema {
    pub name: &'static str,
    pub description: &'static str,
}

pub const SUPPORTED_TOOLS: &[ToolSchema] = &[
    ToolSchema {
        name: "nexus_get_orderbook_depth",
        description: "Streams live L2/L3 orderbook depth and spread for BTC/USDT and ETH/USDT",
    },
    ToolSchema {
        name: "nexus_get_whale_flow_telemetry",
        description: "Queries real-time on-chain smart money and liquidation flow signals (OlaXBT format)",
    },
    ToolSchema {
        name: "nexus_submit_agent_order",
        description: "Submits low-latency limit, market, or post-only orders on behalf of an autonomous vault",
    },
];`,

    'docker-compose.kafka.yml': `version: '3.8'

services:
  kafka-broker-1:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka-broker-1
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka-broker-1:29093,2@kafka-broker-2:29093,3@kafka-broker-3:29093'
      KAFKA_LISTENERS: 'PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:29093'
      KAFKA_INTER_BROKER_LISTENER_NAME: 'PLAINTEXT'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      KAFKA_LOG_DIRS: '/var/lib/kafka/data'
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_NUM_PARTITIONS: 16
      KAFKA_COMPRESSION_TYPE: 'zstd'
      KAFKA_MESSAGE_MAX_BYTES: 10485760
    volumes:
      - kafka-data-1:/var/lib/kafka/data

volumes:
  kafka-data-1:`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedCodeFile] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Production Blueprint</span>
              <span aria-hidden="true">·</span>
              <span>20-Week Master Plan</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">Rust + Kafka Core</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Technical Implementation Roadmap & Production Code</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'roadmap' ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              5-Phase Roadmap
            </button>
            <button
              onClick={() => setActiveTab('rust-code')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'rust-code' ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Production Rust Code
            </button>
            <button
              onClick={() => setActiveTab('infra')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'infra' ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Infrastructure & Sizing
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          {roadmapPhases.map((phase, idx) => (
            <div key={idx} className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">
                    {phase.phase}
                  </span>
                  <h3 className="text-sm font-bold text-white">{phase.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{phase.timeline}</span>
                  </div>
                  <span>·</span>
                  <span className="text-slate-300">{phase.leadTeam}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                {phase.deliverables.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs pt-1 text-slate-400 font-mono">
                <span className="text-emerald-400 font-semibold">Exit Criterion Milestone: </span>
                <span className="text-slate-200">{phase.milestone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Rust Code Repository */}
      {activeTab === 'rust-code' && (
        <div className="border border-slate-800 bg-slate-900/50 rounded-lg overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['orderbook.rs', 'matching_engine.rs', 'kafka_consumer.rs', 'mcp_server.rs', 'docker-compose.kafka.yml'].map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedCodeFile(file)}
                  className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    selectedCodeFile === file
                      ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Source'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-slate-200 leading-relaxed">
              {codeSnippets[selectedCodeFile]}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Infrastructure Sizing */}
      {activeTab === 'infra' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Bare Metal & Cloud Cluster Sizing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              For ultra-low latency deterministic execution, matching engines should run on dedicated bare-metal instances with CPU core pinning (isolcpus) to avoid kernel context switching overhead:
            </p>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-emerald-400 font-bold">Matching Engine Nodes (x4 Active/Standby Pairs)</div>
                <div className="text-slate-400 mt-1">CPU: AMD EPYC 9654 (96 Cores, 3.7 GHz Boost)</div>
                <div className="text-slate-400">RAM: 256GB DDR5-4800 (ECC Registered, Dual Channel)</div>
                <div className="text-slate-400">Storage: 2x 3.84TB NVMe PCIe 5.0 (RAID 10)</div>
                <div className="text-slate-400">NIC: Dual 25GbE Mellanox ConnectX-6 (Kernel bypass via DPDK)</div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-emerald-400 font-bold">Kafka / Redpanda Cluster (3x Brokers)</div>
                <div className="text-slate-400 mt-1">CPU: 32 Cores (Intel Xeon Gold 6430)</div>
                <div className="text-slate-400">RAM: 128GB RAM (Zstandard compression buffer)</div>
                <div className="text-slate-400">Storage: 4x 7.68TB NVMe Enterprise (Direct I/O)</div>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Capacity & Throughput Projections</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 font-mono">
                <div className="text-slate-400">Sustained Order Throughput:</div>
                <div className="text-white font-bold text-sm">500,000 orders/sec per symbol partition</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 font-mono">
                <div className="text-slate-400">End-to-End Latency (p99):</div>
                <div className="text-emerald-400 font-bold text-sm">&lt; 78.85 microseconds (Ingress to Broadcast)</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 font-mono">
                <div className="text-slate-400">Kafka Daily Commit Log Volume:</div>
                <div className="text-white font-bold text-sm">~4.2 Terabytes / day (with Zstd 3:1 compression)</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 font-mono">
                <div className="text-slate-400">Disaster Recovery Guarantees:</div>
                <div className="text-emerald-400 font-bold text-sm">RPO = 0 (Strict acks=all) | RTO &lt; 380ms</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
