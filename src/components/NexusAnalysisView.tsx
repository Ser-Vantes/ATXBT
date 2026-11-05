import React, { useState } from 'react';
import { Layers, ShieldCheck, Cpu, Zap, ArrowRight, CheckCircle2, AlertTriangle, GitBranch, Terminal } from 'lucide-react';

interface NexusAnalysisViewProps {
  onNavigateToEngine: () => void;
  onNavigateToRoadmap: () => void;
}

export const NexusAnalysisView: React.FC<NexusAnalysisViewProps> = ({
  onNavigateToEngine,
  onNavigateToRoadmap,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<'overview' | 'comparison' | 'decisions'>('overview');

  const comparisonData = [
    {
      dimension: 'Core Execution Paradigm',
      nexusOlaXbt: 'Smart-contract/RPC vault execution & off-chain signal aggregation for BNB/Web3',
      nexusCoreTarget: 'In-memory deterministic matching engine in Rust with sub-microsecond L3 FIFO',
      impact: 'Reduces execution latency from ~800ms (block-bound) to <50 microseconds end-to-end',
    },
    {
      dimension: 'Peak Throughput (TPS)',
      nexusOlaXbt: 'Estimated 2,000 – 10,000 ops/sec (governed by chain RPC limits & batch sizes)',
      nexusCoreTarget: '500,000+ orders/sec per symbol partition using lock-free Rust data structures',
      impact: 'Eliminates orderbook starvation and slippage during severe market liquidation storms',
    },
    {
      dimension: 'Data & Event Backbone',
      nexusOlaXbt: 'Event pollers, WebSocket relays, and on-chain oracle aggregators',
      nexusCoreTarget: 'Apache Kafka / Redpanda Raft event log with strict partition ordering & zero-copy transfer',
      impact: 'Guarantees strictly deterministic event sequence (seq_id) and exact-once replay semantics',
    },
    {
      dimension: 'AI Agent Integration',
      nexusOlaXbt: 'Model Context Protocol (MCP) data skills, wallet-signature auth, whale tracking',
      nexusCoreTarget: 'Native MCP Gateway + ultra-low latency WebSocket stream with full Nexus tool compatibility',
      impact: 'Maintains 100% developer compatibility with nexus.olaxbt agent ecosystem while accelerating execution',
    },
    {
      dimension: 'Disaster Recovery (RTO/RPO)',
      nexusOlaXbt: 'Dependent on blockchain finality and centralized cloud cache sync (RTO ~minutes)',
      nexusCoreTarget: 'Zero-downtime hot standby engine replay from Kafka offset (RPO = 0, RTO < 400ms)',
      impact: 'Survives catastrophic worker pod crashes without dropping a single resting limit order',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Hero */}
      <section className="border border-slate-800 bg-slate-900/60 rounded-lg p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Senior Architectural Evaluation</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">RFC-089</span>
              <span aria-hidden="true">·</span>
              <span>High-Traffic Crypto Platform</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              Deconstructing nexus.olaxbt: Building an Ultra-High-Throughput Exchange with Rust and Kafka
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              OlaXBT's Nexus platform operates as an agentic data layer and Web3 intelligence ecosystem, providing on-chain whale tracking, sentiment telemetry, and Model Context Protocol (MCP) interfaces for autonomous trading vaults. To scale this concept into an institutional high-traffic exchange handling 500,000+ orders/sec, we architected a microservices mesh featuring an in-memory deterministic Rust matching engine and an event-sourced Kafka backbone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={onNavigateToEngine}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors text-center whitespace-nowrap"
            >
              Launch Live Engine Simulator
            </button>
            <button
              onClick={onNavigateToRoadmap}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors text-center whitespace-nowrap border border-slate-700"
            >
              View 5-Phase Implementation Plan
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSelectedTopic('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTopic === 'overview'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Architectural Teardown & Capabilities
        </button>
        <button
          onClick={() => setSelectedTopic('comparison')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTopic === 'comparison'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Comparative Matrix (Nexus vs Target)
        </button>
        <button
          onClick={() => setSelectedTopic('decisions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedTopic === 'decisions'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Key Architectural Trade-Offs (ADR)
        </button>
      </div>

      {/* Content Section 1: Overview */}
      {selectedTopic === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-200">1. nexus.olaxbt Core Functions</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">·</span>
                  <span><strong>AIO Nexus Data Layer:</strong> Standardizes on-chain smart money flows, whale wallet alerts, and liquidation heatmaps.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">·</span>
                  <span><strong>MCP Protocol Integration:</strong> Standardizes AI agent tooling so autonomous bots query signals via JSON-RPC.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">·</span>
                  <span><strong>EIP-712 Signature Auth:</strong> Nonce verification and cryptographic wallet auth without centralized passwords.</span>
                </li>
              </ul>
            </div>

            <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-200">2. High-Traffic Bottlenecks</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong>RPC Latency Limits:</strong> Block-time confirmation (300ms - 3s) causes high slippage during volatile dumps.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong>Lack of Deterministic L3 FIFO:</strong> On-chain pools do not support high-frequency microsecond limit orderbooks.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong>State Desync on Crashes:</strong> Without a dedicated Raft sequencer, node failovers lose inflight order states.</span>
                </li>
              </ul>
            </div>

            <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-200">3. Target Rust + Kafka Solution</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">·</span>
                  <span><strong>Sub-Microsecond Matching:</strong> Zero-allocation Rust BTreeMap orderbook achieving p99 &lt; 850ns.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">·</span>
                  <span><strong>Strict Sequence Sourcing:</strong> Kafka partitioned by trading pair gives deterministic replay for 100% auditability.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">·</span>
                  <span><strong>Complete Agent Compatibility:</strong> MCP microservice bridges OlaXBT agent skills directly into the low-latency core.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Deep Architectural Blueprint Description */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">System Architecture Blueprint</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To achieve both the agentic intelligence of nexus.olaxbt and the speed of top-tier centralized exchanges (like Binance or Bybit), the platform is segmented into distinct asynchronous microservices interacting over high-throughput Kafka topics:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="border border-slate-800/80 bg-slate-950/60 rounded p-4 space-y-2">
                <div className="text-emerald-400 font-semibold">Inbound Path (Order Ingestion & Sequencer)</div>
                <p>
                  1. <strong>Gateway Edge:</strong> Terminates WebSocket and REST connections via Tokio/Actix-Web, validating wallet signatures (EIP-712/Ed25519) and API keys.<br />
                  2. <strong>Pre-Trade Risk Engine:</strong> In-memory margin checks verify account equity, leverage tiers, and position limits in &lt;10μs before writing to Kafka.<br />
                  3. <strong>Deterministic Sequencer:</strong> Assigns monotonically increasing 64-bit sequence IDs per trading pair partition, establishing a strict, immutable total order.
                </p>
              </div>

              <div className="border border-slate-800/80 bg-slate-950/60 rounded p-4 space-y-2">
                <div className="text-cyan-400 font-semibold">Execution Path (Rust Matching & Clearing)</div>
                <p>
                  4. <strong>Rust Matching Engine:</strong> A single-threaded event loop per partition. Memory cache-line aligned order structs, BTreeMap price levels, intrusive FIFO doubly-linked lists.<br />
                  5. <strong>Kafka Outbound Pub/Sub:</strong> Emits execution matches, cancelled orders, and L2/L3 delta diffs to respective Kafka topics.<br />
                  6. <strong>Double-Entry Ledger & Vaults:</strong> Asynchronously clears account balances, updates margin collateral, and syncs periodic rollup state on-chain.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section 2: Comparison Table */}
      {selectedTopic === 'comparison' && (
        <div className="border border-slate-800 bg-slate-900/40 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Direct Technical Comparison</h2>
            <p className="text-xs text-slate-400 mt-1">
              Comparing nexus.olaxbt's current agentic data architecture with our proposed institutional Rust/Kafka trading core.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Architecture Dimension</th>
                  <th className="py-3 px-4">nexus.olaxbt (Web3 Agent Layer)</th>
                  <th className="py-3 px-4">Our Proposed Engine (Rust + Kafka)</th>
                  <th className="py-3 px-4">Engineering Business Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">{row.dimension}</td>
                    <td className="py-3.5 px-4 text-slate-300">{row.nexusOlaXbt}</td>
                    <td className="py-3.5 px-4 text-emerald-300 font-medium">{row.nexusCoreTarget}</td>
                    <td className="py-3.5 px-4 text-slate-400">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Section 3: Architecture Decision Records (ADRs) */}
      {selectedTopic === 'decisions' && (
        <div className="space-y-4">
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">ADR-001: Why Rust for the Matching Engine instead of Go or C++?</span>
              <span className="text-xs text-emerald-400 font-mono">ACCEPTED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Context & Decision:</strong> High-frequency order matching requires sub-microsecond determinism. Go's garbage collector pauses (Stop-The-World STW) introduce latency spikes exceeding 5ms–20ms, which is unacceptable for HFT market makers. While C++ provides raw performance, Rust delivers zero-cost abstractions, predictable memory layout without GC, and strict compile-time memory safety eliminating data races and buffer overflows in multithreaded queue ingestion.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">ADR-002: Why Kafka / Redpanda over Redis Streams or RabbitMQ?</span>
              <span className="text-xs text-emerald-400 font-mono">ACCEPTED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Context & Decision:</strong> Redis in-memory streams cannot handle multi-terabyte uncompacted order history without ballooning RAM costs, and failover snapshotting can lose inflight buffer states. Kafka guarantees persistent, immutable append-only commit logs with strict partition ordering. A single Kafka partition per symbol guarantees that orders are processed in exact arrival sequence, enabling instant state reconstitution upon pod reboot.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">ADR-003: Deterministic Sequencer vs Active-Active Paxos in Matching Path</span>
              <span className="text-xs text-emerald-400 font-mono">ACCEPTED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Context & Decision:</strong> Running distributed consensus (Raft/Paxos) synchronously inside the matching loop introduces 2-10ms network round-trip overhead per order. Instead, we use an active-passive hot standby model: a Sequencer stamps orders with monotonically increasing sequence IDs into Kafka. The active Rust engine consumes from this log. If the active engine crashes, the standby replica replays from the last confirmed checkpoint in &lt;400ms without dropped state.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
