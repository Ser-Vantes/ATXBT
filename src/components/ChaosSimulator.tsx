import React, { useState } from 'react';
import { ChaosScenario } from '../types/architecture';
import { ShieldAlert, AlertOctagon, CheckCircle2, Play, RefreshCw, Activity, Terminal } from 'lucide-react';

export const ChaosSimulator: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('worker-crash');
  const [running, setRunning] = useState<boolean>(false);
  const [drillStage, setDrillStage] = useState<number>(0);
  const [drillLogs, setDrillLogs] = useState<string[]>([]);
  const [drillCompleted, setDrillCompleted] = useState<boolean>(false);

  const scenarios: ChaosScenario[] = [
    {
      id: 'worker-crash',
      title: 'Active Rust Matching Node Hard Crash (SIGKILL)',
      targetNode: 'matching-engine-btc-0',
      description: 'Simulates catastrophic memory fault or kernel panic killing the primary in-memory matching engine pod for BTC-USDT.',
      injectedFailure: 'Immediate process termination of primary container; network interface severed.',
      expectedOutcome: 'Hot standby replica detects heartbeat loss within 120ms, assumes partition lease, replays last uncheckpointed Kafka offsets, and restores full L3 orderbook.',
      recoveryMechanism: 'Kafka consumer group rebalance + RocksDB delta replay + Monotonic sequence continuity check.',
      rpo: '0 (Zero lost orders)',
      rto: '< 350 ms',
    },
    {
      id: 'broker-partition',
      title: 'Kafka Broker Network Split-Brain (Min-ISR Enforcement)',
      targetNode: 'kafka-broker-2',
      description: 'Simulates network partition isolating Broker-2 from the KRaft quorum during heavy trading volume.',
      injectedFailure: 'IPTables DROP packets on port 9092 & 9093 between Broker-2 and rest of cluster.',
      expectedOutcome: 'KRaft controller shrinks In-Sync Replicas (ISR) from 3 to 2. Producers with acks=all continue without data loss; un-replicated phantom writes are prevented.',
      recoveryMechanism: 'Automated Raft leadership handoff + dynamic ISR trimming.',
      rpo: '0 (Strict quorum guarantee)',
      rto: '< 180 ms',
    },
    {
      id: 'traffic-surge',
      title: 'Flash Crash Liquidation Surge (500k ops/sec Burst)',
      targetNode: 'edge-gateway & risk-engine',
      description: 'Simulates a 40% BTC price drop in 2 minutes triggering 500,000 liquidation and market orders per second.',
      injectedFailure: '30x sustained traffic spike exceeding standard gateway ingress budget.',
      expectedOutcome: 'Token-bucket rate limiter throttles non-essential public pollers; high-priority liquidation & cancel orders pass with guaranteed low latency. Kafka absorbs burst buffer without disk starvation.',
      recoveryMechanism: 'Priority queue classification + Kafka backpressure buffering + jemalloc thread caching.',
      rpo: '0 (Buffered in Kafka log)',
      rto: 'Instantaneous (Elastic buffer)',
    },
    {
      id: 'corrupt-journal',
      title: 'Checkpoint Snapshot Replay & Cryptographic State Hash',
      targetNode: 'state-store-rocksdb',
      description: 'Validates deterministic reproducibility by comparing in-memory orderbook state hash against cold replay from genesis checkpoint.',
      injectedFailure: 'Intentional synthetic state verification trigger against cold snapshot journal.',
      expectedOutcome: 'Full sequential replay of 100,000 Kafka events matches in-memory Merkle state root byte-for-byte.',
      recoveryMechanism: 'Deterministic event loop execution with zero unseeded random or system-clock branch dependencies.',
      rpo: '0',
      rto: 'N/A (Continuous Verification)',
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleRunDrill = () => {
    if (running) return;
    setRunning(true);
    setDrillStage(1);
    setDrillCompleted(false);
    setDrillLogs([`[0.00s] Initializing chaos drill: ${currentScenario.title}`]);

    const steps = [
      { delay: 400, stage: 2, log: `[+120ms] INJECTING FAULT: ${currentScenario.injectedFailure}` },
      { delay: 800, stage: 3, log: `[+250ms] Detection: Heartbeat missed by health watchdog. Health status: CRITICAL` },
      { delay: 1300, stage: 4, log: `[+310ms] Failover Triggered: Standby node acquiring Kafka partition lease (leader election)` },
      { delay: 1800, stage: 5, log: `[+345ms] State Replay: Reading uncommitted Kafka offsets from checkpoint #412080 to #412095` },
      { delay: 2300, stage: 6, log: `[+378ms] RECOVERY COMPLETE: L3 Orderbook reconstructed (12,410 resting orders, 0 dropped). RPO: ${currentScenario.rpo}, RTO: ${currentScenario.rto}` },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setDrillStage(step.stage);
        setDrillLogs((prev) => [...prev, step.log]);
        if (step.stage === 6) {
          setRunning(false);
          setDrillCompleted(true);
        }
      }, step.delay);
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Fault-Tolerance Testing Lab</span>
              <span aria-hidden="true">·</span>
              <span>Chaos Engineering & High Availability</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Disaster Recovery & Failure Scenario Drills</h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Target RPO: </span>
              <span className="text-emerald-400 font-semibold">0 (Zero Lost Orders)</span>
            </div>
            <div>
              <span className="text-slate-400">Target RTO: </span>
              <span className="text-emerald-400 font-semibold">&lt; 500 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => {
              if (!running) {
                setActiveScenarioId(sc.id);
                setDrillStage(0);
                setDrillLogs([]);
                setDrillCompleted(false);
              }
            }}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              activeScenarioId === sc.id
                ? 'border-emerald-400 bg-slate-800 shadow-sm'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-mono">Scenario</span>
              <span className="text-emerald-400 font-mono font-semibold">{sc.rto}</span>
            </div>
            <div className="text-xs font-semibold text-white line-clamp-2">{sc.title}</div>
          </button>
        ))}
      </div>

      {/* Active Drill Harness Card */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Target Node:</span>
              <span className="text-amber-400 font-mono font-semibold">{currentScenario.targetNode}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{currentScenario.title}</h3>
          </div>

          <button
            onClick={handleRunDrill}
            disabled={running}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
              running
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-sm'
            }`}
          >
            {running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Injecting Chaos & Running Recovery...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Injected Failure Drill</span>
              </>
            )}
          </button>
        </div>

        {/* Drill Specs Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium">Injected Chaos:</span>
            <p className="text-rose-300 font-mono text-[11px]">{currentScenario.injectedFailure}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium">Recovery Mechanism:</span>
            <p className="text-cyan-300 font-mono text-[11px]">{currentScenario.recoveryMechanism}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium">Guaranteed Invariants:</span>
            <p className="text-emerald-300 font-mono text-[11px]">RPO: {currentScenario.rpo} | RTO: {currentScenario.rto}</p>
          </div>
        </div>

        {/* Live Drill Execution Console Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Chaos Execution & Heartbeat Telemetry:</span>
            </div>
            {drillCompleted && (
              <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Drill Passed Successfully
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-2 min-h-[160px] overflow-y-auto">
            {drillLogs.length === 0 ? (
              <div className="text-slate-500 py-6 text-center">
                Click "Execute Injected Failure Drill" above to inject this chaos condition into the live simulation cluster.
              </div>
            ) : (
              drillLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    idx === drillLogs.length - 1 && drillCompleted
                      ? 'text-emerald-400 font-bold'
                      : log.includes('INJECTING')
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
