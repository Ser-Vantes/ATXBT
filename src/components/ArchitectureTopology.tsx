import React, { useState } from 'react';
import { MicroserviceNode } from '../types/architecture';
import { Server, ArrowRight, Play, CheckCircle, Database, Network, Cpu, Shield, RefreshCw } from 'lucide-react';

export const ArchitectureTopology: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('matching-engine');
  const [tracingOrder, setTracingOrder] = useState<boolean>(false);
  const [traceStep, setTraceStep] = useState<number>(-1);

  const nodes: MicroserviceNode[] = [
    {
      id: 'edge-gateway',
      name: 'API & WS Edge Gateway',
      role: 'Ingress & Protocol Termination',
      tech: 'Rust / Tokio / Actix-Web / epoll',
      status: 'healthy',
      p99LatencyUs: 15,
      throughputKops: 320,
      cpuPercent: 34,
      memoryMb: 512,
      description: 'Terminates client connections, verifies EIP-712 wallet signatures and HMAC API keys, enforces token-bucket rate limiting per IP/Account.',
      keyResponsibilities: [
        'TLS termination & WebSocket frame multiplexing (100k+ concurrent connections)',
        'EIP-712 cryptographic signature verification (secp256k1 / ed25519)',
        'Sliding-window token bucket rate limiter (preventing DDoS)',
        'Protobuf serialization of inbound raw orders',
      ],
    },
    {
      id: 'risk-engine',
      name: 'Pre-Trade Risk Engine',
      role: 'Margin & Account Sanity Checks',
      tech: 'Rust / Memory-mapped balances / SIMD',
      status: 'healthy',
      p99LatencyUs: 8,
      throughputKops: 480,
      cpuPercent: 28,
      memoryMb: 1024,
      description: 'Executes ultra-low-latency margin calculations before orders enter the matching pipeline. Verifies available collateral, position leverage limits, and max notional size.',
      keyResponsibilities: [
        'Atomic lock-free balance reservation (cross-margin & isolated margin)',
        'Dynamic maintenance margin requirement (MMR) validation',
        'Global exchange circuit breaker & price collar sanity bounds',
        'Sub-10 microsecond execution time with zero heap allocation',
      ],
    },
    {
      id: 'sequencer',
      name: 'Deterministic Sequencer',
      role: 'Total Event Order Serialization',
      tech: 'Rust / Atomic RingBuffer / KRaft',
      status: 'healthy',
      p99LatencyUs: 12,
      throughputKops: 550,
      cpuPercent: 42,
      memoryMb: 768,
      description: 'Stamps every valid inbound order with a monotonically increasing 64-bit sequence ID per symbol partition. Guarantees deterministic state reproducibility across all replicas.',
      keyResponsibilities: [
        'Monotonically increasing sequence numbering (seq_id: 1, 2, 3...)',
        'Partitioning to Kafka topic: orders.inbound.{symbol}',
        'Deduplication cache by client_order_id with 24-hour TTL',
        'Active-passive leader election with sub-second heartbeats',
      ],
    },
    {
      id: 'kafka-backbone',
      name: 'Kafka Event Log Cluster',
      role: 'Persistent Replicated Event Bus',
      tech: 'Apache Kafka / Redpanda (C++ Raft)',
      status: 'healthy',
      p99LatencyUs: 18,
      throughputKops: 600,
      cpuPercent: 55,
      memoryMb: 4096,
      description: 'The central immutable source of truth. Partitioned by trading pair (BTC-USDT, ETH-USDT). Configured with min-insync-replicas=2 and acks=all.',
      keyResponsibilities: [
        'Append-only immutable commit log for all orders, matches, and cancels',
        'Zero-copy sendfile network transfer to consumers',
        'Log compaction for order status topics and snapshot checkpoints',
        'Guaranteed strict partition ordering for deterministic replay',
      ],
    },
    {
      id: 'matching-engine',
      name: 'Distributed Rust Matching Engine',
      role: 'L2/L3 Order Matching Core',
      tech: 'Rust / BTreeMap / FlatBuffers / jemalloc',
      status: 'healthy',
      p99LatencyUs: 0.85,
      throughputKops: 620,
      cpuPercent: 62,
      memoryMb: 2048,
      description: 'High-frequency in-memory orderbook. Single-threaded event loop pinned to dedicated CPU cores (taskset) with NUMA node optimization.',
      keyResponsibilities: [
        'Price-Time Priority (FIFO) matching algorithm',
        'Supports Limit, Market, Post-Only, FOK, IOC, and Iceberg orders',
        'Zero-allocation memory arenas for active price levels and order structs',
        'Sub-microsecond matching latency (p99 < 850 nanoseconds)',
      ],
    },
    {
      id: 'market-data-broadcaster',
      name: 'Market Data WS Broadcaster',
      role: 'L2/L3 Feed Fanout',
      tech: 'Rust / WebSocket / Epoll / zstd',
      status: 'healthy',
      p99LatencyUs: 25,
      throughputKops: 400,
      cpuPercent: 48,
      memoryMb: 1536,
      description: 'Aggregates matching engine delta events into 10ms L2 diffs and streams full L3 trade feeds to external HFT subscribers and web clients.',
      keyResponsibilities: [
        'L2 orderbook snapshot + delta streaming (10ms intervals)',
        'Public L3 real-time trade feed broadcasting',
        'Epoll socket event loop scaling to 250,000 concurrent client streams',
        'Zstandard compressed binary protocol over WebSocket',
      ],
    },
    {
      id: 'clearing-ledger',
      name: 'Clearing & Double-Entry Ledger',
      role: 'Post-Trade Settlement & Balances',
      tech: 'Go / PostgreSQL / TimescaleDB',
      status: 'healthy',
      p99LatencyUs: 65,
      throughputKops: 180,
      cpuPercent: 38,
      memoryMb: 3072,
      description: 'Asynchronously consumes execution events from Kafka, performs double-entry bookkeeping, calculates trading fees, and updates user account balances.',
      keyResponsibilities: [
        'Strict double-entry financial ledger (Assets = Liabilities + Equity)',
        'Tiered maker/taker fee tier calculation and rebate distribution',
        'Periodic state reconciliation against matching engine snapshots',
        'Batch export to on-chain settlement vaults and audit storage',
      ],
    },
    {
      id: 'nexus-mcp-bridge',
      name: 'OlaXBT Nexus MCP Agent Bridge',
      role: 'Agentic Model Context Protocol Gateway',
      tech: 'TypeScript / Rust / JSON-RPC 2.0',
      status: 'healthy',
      p99LatencyUs: 45,
      throughputKops: 95,
      cpuPercent: 22,
      memoryMb: 512,
      description: 'Provides native MCP (Model Context Protocol) tool endpoints compatible with nexus.olaxbt AI agents. Allows quant bots to stream whale telemetry, query book depth, and place algorithmic orders.',
      keyResponsibilities: [
        'Exposes MCP tool schema: get_depth, submit_agent_order, get_whale_flows',
        'Translates agent natural language & JSON-RPC into internal Protobuf commands',
        'Enforces agent execution quotas and risk guardrails',
        'Bridges on-chain intelligence telemetry to the exchange matching pipeline',
      ],
    },
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[4];

  const handleStartTrace = () => {
    if (tracingOrder) return;
    setTracingOrder(true);
    setTraceStep(0);

    const steps = [0, 1, 2, 3, 4, 5, 6];
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setTraceStep(step);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setTracingOrder(false);
            setTraceStep(-1);
          }, 1500);
        }
      }, (idx + 1) * 600);
    });
  };

  const getTraceStatus = (nodeIndex: number) => {
    if (!tracingOrder) return '';
    if (traceStep === nodeIndex) return 'ring-2 ring-emerald-400 bg-emerald-950/40';
    if (traceStep > nodeIndex) return 'border-emerald-500/50';
    return '';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header and Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Distributed Microservices Mesh</span>
            <span aria-hidden="true">·</span>
            <span>Sub-Millisecond Pipeline</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">High-Traffic System Topology & Event Flow</h2>
        </div>

        <button
          onClick={handleStartTrace}
          disabled={tracingOrder}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            tracingOrder
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-sm'
          }`}
        >
          {tracingOrder ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Tracing Order Packet ({traceStep + 1}/7)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate End-to-End Order Flow</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Topology Graph */}
      <div className="border border-slate-800 bg-slate-900/30 rounded-lg p-6 space-y-6">
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>Click any microservice node below to inspect internal metrics, stack details, and failure recovery protocols:</span>
          {tracingOrder && (
            <span className="text-emerald-400 font-mono animate-pulse">
              Packet Active in Pipeline: Step {traceStep + 1}
            </span>
          )}
        </div>

        {/* Pipeline Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Column 1: Ingress & Pre-Trade */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              Phase 1: Ingress & Risk
            </div>

            <button
              onClick={() => setSelectedNodeId('edge-gateway')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'edge-gateway'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(0)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Edge Gateway</span>
                <span className="text-slate-400 font-mono">15μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Tokio WebSocket edge, EIP-712 auth, token bucket</p>
            </button>

            <button
              onClick={() => setSelectedNodeId('risk-engine')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'risk-engine'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(1)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Pre-Trade Risk</span>
                <span className="text-slate-400 font-mono">8μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Lock-free margin check, MMR bounds, circuit breaker</p>
            </button>

            <button
              onClick={() => setSelectedNodeId('nexus-mcp-bridge')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'nexus-mcp-bridge'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300">Nexus MCP Bridge</span>
                <span className="text-slate-400 font-mono">45μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">OlaXBT AI Agent tool schema & telemetry ingress</p>
            </button>
          </div>

          {/* Column 2: Event Log & Sequencing */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              Phase 2: Sequencing & Bus
            </div>

            <button
              onClick={() => setSelectedNodeId('sequencer')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'sequencer'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(2)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Sequencer</span>
                <span className="text-slate-400 font-mono">12μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Monotonic seq_id stamp, partition key routing</p>
            </button>

            <button
              onClick={() => setSelectedNodeId('kafka-backbone')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'kafka-backbone'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(3)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">Kafka Event Bus</span>
                <span className="text-slate-400 font-mono">18μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Replicated topic partitions, zero-copy replay</p>
            </button>
          </div>

          {/* Column 3: Matching Core */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              Phase 3: Execution Core
            </div>

            <button
              onClick={() => setSelectedNodeId('matching-engine')}
              className={`w-full text-left p-4 border rounded-lg transition-all ${
                selectedNodeId === 'matching-engine'
                  ? 'border-emerald-400 bg-slate-800 shadow-sm ring-1 ring-emerald-400/40'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(4)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">Rust Matching Engine</span>
                <span className="text-emerald-400 font-mono font-bold">0.85μs</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                In-memory L3 orderbook. BTreeMap price levels with zero-allocation FIFO doubly-linked lists. Pinned core.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Peak: 620k ops/sec</span>
                <span>·</span>
                <span>p99: &lt;850ns</span>
              </div>
            </button>
          </div>

          {/* Column 4: Post-Trade & Broadcast */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              Phase 4: Egress & Clearing
            </div>

            <button
              onClick={() => setSelectedNodeId('market-data-broadcaster')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'market-data-broadcaster'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(5)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Market Data WS</span>
                <span className="text-slate-400 font-mono">25μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">L2 diff snapshots & L3 public trade fanout</p>
            </button>

            <button
              onClick={() => setSelectedNodeId('clearing-ledger')}
              className={`w-full text-left p-3.5 border rounded-lg transition-all ${
                selectedNodeId === 'clearing-ledger'
                  ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              } ${getTraceStatus(6)}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Clearing Ledger</span>
                <span className="text-slate-400 font-mono">65μs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Double-entry accounting & on-chain vault sync</p>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Node Detailed Specification Panel */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Selected Microservice Specification</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">{selectedNode.id}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">{selectedNode.name}</h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">p99 Latency: </span>
              <span className="text-emerald-400 font-semibold">{selectedNode.p99LatencyUs} μs</span>
            </div>
            <div>
              <span className="text-slate-400">Throughput: </span>
              <span className="text-white font-semibold">{selectedNode.throughputKops}k ops/s</span>
            </div>
            <div>
              <span className="text-slate-400">Tech Stack: </span>
              <span className="text-slate-200">{selectedNode.tech}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.description}</p>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">Key Engineering Responsibilities:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            {selectedNode.keyResponsibilities.map((resp, i) => (
              <div key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800/80">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{resp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Budget Breakdown Table */}
        <div className="pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">Total System Latency Budget (End-to-End Ingestion to Execution):</div>
          <div className="w-full bg-slate-950 h-3 rounded overflow-hidden flex border border-slate-800">
            <div style={{ width: '15%' }} title="Gateway: 15μs" className="bg-sky-500 h-full" />
            <div style={{ width: '8%' }} title="Risk Engine: 8μs" className="bg-amber-500 h-full" />
            <div style={{ width: '12%' }} title="Sequencer: 12μs" className="bg-indigo-500 h-full" />
            <div style={{ width: '20%' }} title="Kafka Commit: 18μs" className="bg-emerald-500 h-full" />
            <div style={{ width: '3%' }} title="Rust Match: 0.85μs" className="bg-rose-500 h-full" />
            <div style={{ width: '22%' }} title="WS Fanout: 25μs" className="bg-purple-500 h-full" />
            <div style={{ width: '20%' }} title="Clearing: Async" className="bg-slate-700 h-full" />
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono mt-2">
            <span>Gateway: 15μs</span>
            <span>Risk: 8μs</span>
            <span>Sequencer: 12μs</span>
            <span>Kafka Inbound: 18μs</span>
            <span className="text-emerald-300 font-bold">Rust Matching: 0.85μs</span>
            <span>WS Fanout: 25μs</span>
            <span className="text-white font-semibold">Total Critical Path: ~78.85 μs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
