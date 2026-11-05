import React, { useState } from 'react';
import { KafkaEventPipeline, KafkaTopicStats } from '../engine/kafkaPipeline';
import { KafkaMessage } from '../types/architecture';
import { Database, Filter, Layers, Server, Clock, HardDrive, RefreshCw } from 'lucide-react';

interface KafkaEventInspectorProps {
  pipeline: KafkaEventPipeline;
  onRefresh?: () => void;
}

export const KafkaEventInspector: React.FC<KafkaEventInspectorProps> = ({ pipeline }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<KafkaMessage | null>(null);

  const topicStats: KafkaTopicStats[] = pipeline.getTopicStats();
  const recentMessages: KafkaMessage[] = pipeline.getRecentMessages(selectedTopic);

  const topicsList = [
    { id: 'all', label: 'All Topics' },
    { id: 'orders.inbound', label: 'orders.inbound' },
    { id: 'sequencer.partitioned', label: 'sequencer.partitioned' },
    { id: 'engine.matches', label: 'engine.matches' },
    { id: 'marketdata.l2.delta', label: 'marketdata.l2.delta' },
    { id: 'ledger.clearing', label: 'ledger.clearing' },
    { id: 'nexus.mcp.telemetry', label: 'nexus.mcp.telemetry' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Event-Sourcing Backbone</span>
              <span aria-hidden="true">·</span>
              <span>Apache Kafka / Redpanda Raft Log</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">KRaft Cluster (3 Brokers)</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Replicated Partition Event Log & Offsets</h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ISR: 3/3 Replicas</span>
            </div>
            <div>
              <span className="text-slate-400">Min ISR: </span>
              <span className="text-white font-semibold">2</span>
            </div>
            <div>
              <span className="text-slate-400">Acks: </span>
              <span className="text-emerald-400 font-semibold">all (-1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topicStats.map((stat) => (
          <button
            key={stat.topic}
            onClick={() => setSelectedTopic(stat.topic)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedTopic === stat.topic
                ? 'border-emerald-400 bg-slate-800/80 shadow-sm'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-white truncate font-mono" title={stat.topic}>
              {stat.topic}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-2 space-y-0.5">
              <div>Offset: <span className="text-slate-200 font-semibold">{stat.currentOffset.toLocaleString()}</span></div>
              <div>Partitions: <span className="text-slate-200">{stat.partitionCount}</span></div>
              <div className="text-emerald-400">Flush: {stat.p99FlushLatencyUs}μs</div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Split: Event Stream & Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Message Stream (7 cols) */}
        <div className="lg:col-span-7 border border-slate-800 bg-slate-900/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Partition Event Commit Log</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Showing {recentMessages.length} records
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {topicsList.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`px-2.5 py-1 text-xs rounded transition-colors font-mono ${
                  selectedTopic === t.id
                    ? 'bg-emerald-400 text-slate-950 font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Messages Table */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {recentMessages.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">No messages in selected topic yet.</div>
            ) : (
              recentMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-2.5 rounded border transition-all text-xs font-mono space-y-1 ${
                      isSelected
                        ? 'border-emerald-400 bg-slate-800'
                        : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{msg.topic}</span>
                        <span className="text-slate-500">P{msg.partition}:O{msg.offset}</span>
                      </div>
                      <span className="text-slate-400">{msg.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Key: <span className="text-white">{msg.key}</span></span>
                      <span className="text-slate-400">Latency: <span className="text-emerald-400">{msg.latencyUs}μs</span></span>
                    </div>

                    <div className="text-slate-400 truncate text-[11px]">
                      {JSON.stringify(msg.payload)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message Payload & Zero-Copy Schema (5 cols) */}
        <div className="lg:col-span-5 border border-slate-800 bg-slate-900/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-white">Protobuf / FlatBuffers Inspector</span>
            <span className="text-xs text-slate-400 font-mono">Zero-Copy Serialization</span>
          </div>

          {selectedMessage ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-emerald-400 font-semibold">{selectedMessage.id}</div>
                <div className="text-slate-400">Topic: <span className="text-white">{selectedMessage.topic}</span></div>
                <div className="text-slate-400">Partition: <span className="text-white">{selectedMessage.partition}</span> | Offset: <span className="text-white">{selectedMessage.offset}</span></div>
                <div className="text-slate-400">Payload Wire Size: <span className="text-white">{selectedMessage.sizeBytes} bytes</span></div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-300 mb-1.5">Parsed JSON Payload:</div>
                <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[220px]">
                  {JSON.stringify(selectedMessage.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 rounded border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <p>Select any event in the commit log on the left to inspect its zero-copy wire layout and partition metadata.</p>
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="text-slate-200 font-semibold">Kafka Topic Partitioning Design:</div>
                <p>• <strong>orders.inbound:</strong> Keyed by Symbol (e.g. BTC-USDT). Strict FIFO order guaranteed per trading pair.</p>
                <p>• <strong>engine.matches:</strong> Keyed by MatchId. Consumed asynchronously by Clearing Ledger and Market Data Broadcaster.</p>
                <p>• <strong>nexus.mcp.telemetry:</strong> Keyed by AgentId or MetricType. Provides real-time feature parity with OlaXBT Nexus.</p>
              </div>
            </div>
          )}

          {/* Schema Definition Snippet */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Protobuf Schema Definition (order_event.proto):</div>
            <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{`syntax = "proto3";
package trading.engine.v1;

message OrderCommand {
  uint64 sequence_id = 1;
  string order_id = 2;
  string account_id = 3;
  string symbol = 4;
  enum Side { BUY = 0; SELL = 1; }
  Side side = 5;
  enum OrderType { LIMIT = 0; MARKET = 1; POST_ONLY = 2; IOC = 3; FOK = 4; }
  OrderType type = 6;
  int64 price_ticks = 7;
  int64 qty_lots = 8;
  int64 timestamp_ns = 9;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
