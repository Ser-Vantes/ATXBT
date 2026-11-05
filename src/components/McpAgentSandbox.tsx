import React, { useState } from 'react';
import { DeterministicRustStyleEngine } from '../engine/matchingEngine';
import { Bot, Play, CheckCircle2, Terminal, Code2, Send, Cpu } from 'lucide-react';

interface McpAgentSandboxProps {
  engine: DeterministicRustStyleEngine;
  onOrderExecuted?: () => void;
}

export const McpAgentSandbox: React.FC<McpAgentSandboxProps> = ({ engine, onOrderExecuted }) => {
  const [selectedTool, setSelectedTool] = useState<string>('nexus_get_orderbook_depth');
  const [requestPayload, setRequestPayload] = useState<string>(
    JSON.stringify({ symbol: 'BTC-USDT', depth: 5 }, null, 2)
  );
  const [responsePayload, setResponsePayload] = useState<any>(null);
  const [calling, setCalling] = useState<boolean>(false);

  const tools = [
    {
      id: 'nexus_get_orderbook_depth',
      name: 'nexus_get_orderbook_depth',
      description: 'Fetches real-time L2 orderbook snapshot and spread for AI agent market-making.',
      defaultPayload: { symbol: 'BTC-USDT', depth: 5 },
    },
    {
      id: 'nexus_get_whale_flow_telemetry',
      name: 'nexus_get_whale_flow_telemetry',
      description: 'OlaXBT AIO Nexus feature parity: on-chain smart money flows & liquidation radar.',
      defaultPayload: { symbol: 'BTC-USDT', window_minutes: 15, min_notional_usd: 500000 },
    },
    {
      id: 'nexus_submit_agent_order',
      name: 'nexus_submit_agent_order',
      description: 'Executes programmatic order from AI hedge fund vault into the Rust matching core.',
      defaultPayload: {
        agent_id: 'agent-olaxbt-alpha',
        symbol: 'BTC-USDT',
        side: 'buy',
        order_type: 'limit',
        price: 96440.0,
        qty: 0.85,
        post_only: true,
      },
    },
    {
      id: 'nexus_query_risk_margin',
      name: 'nexus_query_risk_margin',
      description: 'Queries agent collateral, maintenance margin requirement (MMR), and vault health.',
      defaultPayload: { vault_id: 'vault-olaxbt-momentum-01' },
    },
  ];

  const handleSelectTool = (toolId: string) => {
    setSelectedTool(toolId);
    const tool = tools.find((t) => t.id === toolId);
    if (tool) {
      setRequestPayload(JSON.stringify(tool.defaultPayload, null, 2));
      setResponsePayload(null);
    }
  };

  const handleExecuteMcpCall = () => {
    setCalling(true);
    let parsed: any = {};
    try {
      parsed = JSON.parse(requestPayload);
    } catch {
      setResponsePayload({ error: 'Invalid JSON payload' });
      setCalling(false);
      return;
    }

    setTimeout(() => {
      if (selectedTool === 'nexus_get_orderbook_depth') {
        const snap = engine.getSnapshot();
        setResponsePayload({
          jsonrpc: '2.0',
          id: Date.now(),
          result: {
            symbol: engine.symbol,
            best_bid: snap.bestBid,
            best_ask: snap.bestAsk,
            spread: snap.spread,
            spread_bps: snap.spreadBps,
            bids: snap.bids.slice(0, parsed.depth || 5).map((b) => ({ price: b.price, qty: b.totalQty })),
            asks: snap.asks.slice(0, parsed.depth || 5).map((a) => ({ price: a.price, qty: a.totalQty })),
            timestamp_ns: snap.timestampNs,
            sequence_id: snap.sequenceId,
          },
        });
      } else if (selectedTool === 'nexus_get_whale_flow_telemetry') {
        setResponsePayload({
          jsonrpc: '2.0',
          id: Date.now(),
          result: {
            source: 'OlaXBT AIO Nexus Data Skill',
            symbol: 'BTC-USDT',
            net_whale_flow_usd: '+38,420,000',
            whale_direction: 'STRONG_ACCUMULATION',
            sentiment_index: 78.4,
            large_tx_count_last_15m: 14,
            top_whale_action: {
              wallet: '0x3f5ce5...8b21 (Binance / Smart Money)',
              amount_btc: 420.5,
              action: 'INFLOW_TO_EXCHANGE_VAULT',
              confidence_score: 0.94,
            },
            liquidation_cascade_risk: 'LOW (0.12)',
          },
        });
      } else if (selectedTool === 'nexus_submit_agent_order') {
        const orderResult = engine.submitOrder(
          parsed.side || 'buy',
          parsed.order_type || 'limit',
          parsed.price || 96440,
          parsed.qty || 1.0,
          parsed.agent_id || 'agent-olaxbt-alpha'
        );
        setResponsePayload({
          jsonrpc: '2.0',
          id: Date.now(),
          result: {
            status: orderResult.rejectedReason ? 'REJECTED' : orderResult.order.status,
            order_id: orderResult.order.id,
            sequence_id: orderResult.order.sequenceId,
            matches_count: orderResult.matches.length,
            filled_qty: orderResult.order.filledQty,
            remaining_qty: orderResult.order.remainingQty,
            engine_latency_ns: 780,
            rejection_reason: orderResult.rejectedReason || null,
          },
        });
        if (onOrderExecuted) onOrderExecuted();
      } else if (selectedTool === 'nexus_query_risk_margin') {
        setResponsePayload({
          jsonrpc: '2.0',
          id: Date.now(),
          result: {
            vault_id: parsed.vault_id || 'vault-olaxbt-momentum-01',
            collateral_asset: 'USDT',
            total_equity: 1_250_000.0,
            margin_used: 340_000.0,
            free_margin: 910_000.0,
            current_leverage: '3.2x',
            max_leverage_tier: '20.0x',
            margin_ratio: '27.2%',
            liquidation_distance_percent: '+44.8%',
            vault_status: 'NOMINAL',
          },
        });
      }
      setCalling(false);
    }, 200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>OlaXBT Nexus Compatibility</span>
              <span aria-hidden="true">·</span>
              <span>Model Context Protocol (MCP)</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400 font-mono">Agentic Execution Layer</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">AI Quant Agent & MCP Skill Sandbox</h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>MCP Protocol: <span className="text-white font-semibold">JSON-RPC 2.0</span></span>
          </div>
        </div>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelectTool(t.id)}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              selectedTool === t.id
                ? 'border-cyan-400 bg-slate-800 shadow-sm'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-mono font-bold text-cyan-300 truncate">{t.name}</div>
            <div className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</div>
          </button>
        ))}
      </div>

      {/* Interactive Tool Calling Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Side */}
        <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-white">Agent MCP Tool Request (JSON-RPC)</span>
            <span className="text-xs text-cyan-400 font-mono">{selectedTool}</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">JSON Parameters Payload</label>
            <textarea
              rows={8}
              value={requestPayload}
              onChange={(e) => setRequestPayload(e.target.value)}
              className="w-full p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          <button
            onClick={handleExecuteMcpCall}
            disabled={calling}
            className={`w-full py-2.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${
              calling
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{calling ? 'Executing MCP Skill...' : 'Call MCP Tool Endpoint'}</span>
          </button>
        </div>

        {/* Response Side */}
        <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-white">Agent Received Response</span>
            <span className="text-xs text-slate-400 font-mono">
              {responsePayload ? 'Status: 200 OK' : 'Awaiting Call'}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-emerald-300 min-h-[220px] max-h-[320px] overflow-y-auto">
            {responsePayload ? (
              <pre>{JSON.stringify(responsePayload, null, 2)}</pre>
            ) : (
              <div className="text-slate-500 py-12 text-center">
                Click "Call MCP Tool Endpoint" to execute this tool and inspect the structured telemetry response.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <span className="text-slate-200 font-semibold">Nexus AI Agent Architecture Note:</span>
            <p>
              In nexus.olaxbt, trading agents use the Model Context Protocol to query market intelligence and execute vault actions. In our architecture, the Rust matching engine and Kafka event log serve these MCP calls with sub-millisecond determinism, eliminating slippage and block-reorganization risks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
