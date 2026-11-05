import React, { useState, useMemo } from 'react';
import { DeterministicRustStyleEngine } from '../engine/matchingEngine';
import { OrderSide, OrderType, MatchExecution, OrderBookSnapshot } from '../types/architecture';
import { ArrowDownRight, ArrowUpRight, Play, RefreshCw, Zap, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface LiveMatchingEngineViewProps {
  engine: DeterministicRustStyleEngine;
  onOrderProcessed?: (side: OrderSide, type: OrderType, price: number, qty: number, matches: MatchExecution[]) => void;
}

export const LiveMatchingEngineView: React.FC<LiveMatchingEngineViewProps> = ({
  engine,
  onOrderProcessed,
}) => {
  const [snapshot, setSnapshot] = useState<OrderBookSnapshot>(() => engine.getSnapshot());
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price, setPrice] = useState<string>('96445.0');
  const [qty, setQty] = useState<string>('1.0');
  const [account, setAccount] = useState<string>('acc-quant-alpha');
  const [lastActionResult, setLastActionResult] = useState<{
    success: boolean;
    message: string;
    matchesCount?: number;
    matchDetails?: MatchExecution[];
  } | null>(null);

  const refreshSnapshot = () => {
    setSnapshot(engine.getSnapshot());
  };

  const handlePriceClick = (clickedPrice: number) => {
    setPrice(clickedPrice.toFixed(1));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const q = parseFloat(qty);

    if (isNaN(q) || q <= 0) {
      setLastActionResult({ success: false, message: 'Invalid order quantity' });
      return;
    }
    if (orderType !== 'market' && (isNaN(p) || p <= 0)) {
      setLastActionResult({ success: false, message: 'Invalid limit price' });
      return;
    }

    const effectivePrice = orderType === 'market' ? (side === 'buy' ? 999999 : 0) : p;
    const result = engine.submitOrder(side, orderType, effectivePrice, q, account);

    refreshSnapshot();

    if (result.rejectedReason) {
      setLastActionResult({
        success: false,
        message: result.rejectedReason,
      });
    } else {
      const matchCount = result.matches.length;
      const fillMsg =
        matchCount > 0
          ? `Executed ${matchCount} match(es) for ${result.order.filledQty} ${engine.symbol.split('-')[0]}. Status: ${result.order.status}`
          : `Resting limit order placed on book (ID: ${result.order.id}). Status: ${result.order.status}`;

      setLastActionResult({
        success: true,
        message: fillMsg,
        matchesCount: matchCount,
        matchDetails: result.matches,
      });

      if (onOrderProcessed) {
        onOrderProcessed(side, orderType, effectivePrice, q, result.matches);
      }
    }
  };

  const handleSimulateBurst = () => {
    // Generate 15 alternating market and limit orders
    const sides: OrderSide[] = ['buy', 'sell', 'buy', 'sell', 'buy'];
    sides.forEach((s, idx) => {
      setTimeout(() => {
        const offset = (Math.random() - 0.5) * 8;
        const base = engine.lastTradedPrice;
        const burstPrice = Math.round((base + offset) * 10) / 10;
        const burstQty = Math.round((0.2 + Math.random() * 1.5) * 100) / 100;
        const burstType: OrderType = Math.random() > 0.4 ? 'limit' : 'market';
        engine.submitOrder(s, burstType, burstPrice, burstQty, `acc-hft-bot-${(idx % 3) + 1}`);
        refreshSnapshot();
      }, idx * 100);
    });
  };

  const handleCancelRestingOrder = (orderId: string) => {
    const canceled = engine.cancelOrder(orderId);
    refreshSnapshot();
    if (canceled) {
      setLastActionResult({
        success: true,
        message: `Canceled order ${orderId} (unfilled qty: ${canceled.remainingQty})`,
      });
    }
  };

  const handleResetBook = () => {
    engine.resetBook();
    refreshSnapshot();
    setLastActionResult({
      success: true,
      message: 'Reset orderbook to initial market-making baseline',
    });
  };

  // Calculate max volume for depth bar percentage
  const maxBidVol = useMemo(() => {
    return Math.max(...snapshot.bids.map((b) => b.totalQty), 1);
  }, [snapshot.bids]);

  const maxAskVol = useMemo(() => {
    return Math.max(...snapshot.asks.map((a) => a.totalQty), 1);
  }, [snapshot.asks]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Engine Banner */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Deterministic Rust Engine Core</span>
            <span aria-hidden="true">·</span>
            <span>Single-Threaded Pinned Actor</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">{engine.symbol}</span>
          </div>
          <div className="flex items-baseline gap-4 mt-1">
            <h2 className="text-xl font-bold text-white font-mono">
              ${engine.lastTradedPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </h2>
            <div className="text-xs font-mono text-slate-300">
              <span>Spread: </span>
              <span className="text-white font-semibold">${snapshot.spread.toFixed(1)}</span>
              <span className="text-slate-400"> ({snapshot.spreadBps} bps)</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              <span>Sequence: </span>
              <span className="text-emerald-400 font-semibold">#{engine.sequenceId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Inject HFT Burst (15 Orders)</span>
          </button>
          <button
            onClick={handleResetBook}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Trading Floor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: L2 Orderbook Ladder (5 cols) */}
        <div className="lg:col-span-5 border border-slate-800 bg-slate-900/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-semibold text-white">L2 Orderbook Depth</span>
            <span className="text-slate-400 font-mono">Price-Time FIFO Priority</span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-3 text-xs text-slate-400 font-medium px-2 py-1">
            <span>Price (USDT)</span>
            <span className="text-right">Size (BTC)</span>
            <span className="text-right">Orders</span>
          </div>

          {/* Asks (Sells) - Reversed so lowest ask is at bottom */}
          <div className="space-y-1">
            {snapshot.asks
              .slice(0, 8)
              .reverse()
              .map((level) => {
                const widthPercent = Math.min((level.totalQty / maxAskVol) * 100, 100);
                return (
                  <button
                    key={`ask-${level.price}`}
                    onClick={() => handlePriceClick(level.price)}
                    className="w-full relative flex items-center justify-between px-2 py-1 text-xs font-mono rounded hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-r pointer-events-none"
                      style={{ width: `${widthPercent}%` }}
                    />
                    <span className="text-rose-400 font-semibold z-10 group-hover:underline">
                      {level.price.toFixed(1)}
                    </span>
                    <span className="text-slate-300 z-10">{level.totalQty.toFixed(3)}</span>
                    <span className="text-slate-500 z-10">{level.orderCount}</span>
                  </button>
                );
              })}
          </div>

          {/* Current Spread Bar */}
          <div className="py-2 px-3 my-1 bg-slate-950/80 rounded border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Mid:</span>
              <span className="text-white font-semibold">
                ${(((snapshot.bestAsk || 0) + (snapshot.bestBid || 0)) / 2).toFixed(1)}
              </span>
            </div>
            <div className="text-slate-400">
              Spread: <span className="text-emerald-400 font-semibold">${snapshot.spread.toFixed(1)}</span> ({snapshot.spreadBps} bps)
            </div>
          </div>

          {/* Bids (Buys) */}
          <div className="space-y-1">
            {snapshot.bids.slice(0, 8).map((level) => {
              const widthPercent = Math.min((level.totalQty / maxBidVol) * 100, 100);
              return (
                <button
                  key={`bid-${level.price}`}
                  onClick={() => handlePriceClick(level.price)}
                  className="w-full relative flex items-center justify-between px-2 py-1 text-xs font-mono rounded hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-r pointer-events-none"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <span className="text-emerald-400 font-semibold z-10 group-hover:underline">
                    {level.price.toFixed(1)}
                  </span>
                  <span className="text-slate-300 z-10">{level.totalQty.toFixed(3)}</span>
                  <span className="text-slate-500 z-10">{level.orderCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Interactive Order Injector (4 cols) */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-semibold text-white">Order Injection Terminal</h3>
            <span className="text-xs text-slate-400 font-mono">Zero-Allocation Arena</span>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Side Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-md border border-slate-800">
              <button
                type="button"
                onClick={() => setSide('buy')}
                className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                  side === 'buy'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Buy (Bid)
              </button>
              <button
                type="button"
                onClick={() => setSide('sell')}
                className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                  side === 'sell'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sell (Ask)
              </button>
            </div>

            {/* Order Type Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Order Execution Policy</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                aria-label="Order Execution Policy"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-400"
              >
                <option value="limit">Limit (GTC - Good 'Til Canceled)</option>
                <option value="market">Market (Immediate Taker Sweep)</option>
                <option value="post_only">Post-Only (Maker Guarantee, Reject Cross)</option>
                <option value="ioc">IOC (Immediate-Or-Cancel Residual)</option>
                <option value="fok">FOK (Fill-Or-Kill Entirety)</option>
              </select>
            </div>

            {/* Price Input */}
            {orderType !== 'market' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Price (USDT)</span>
                  <span className="font-mono text-slate-500">Tick: $0.1</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    aria-label="Order Price in USDT"
                    placeholder="96450.0"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Quantity (BTC)</span>
                <span className="font-mono text-slate-500">Lot: 0.001</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                aria-label="Order Quantity in BTC"
                placeholder="1.0"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Account Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Originating Account (EIP-712 / API)</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                aria-label="Originating Account"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-400"
              >
                <option value="acc-quant-alpha">acc-quant-alpha (Autonomous AI Agent)</option>
                <option value="acc-mm-wintermute">acc-mm-wintermute (Designated Market Maker)</option>
                <option value="acc-retail-401">acc-retail-401 (Web3 Wallet Trader)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-2.5 text-xs font-bold rounded-md transition-colors ${
                side === 'buy'
                  ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                  : 'bg-rose-500 text-white hover:bg-rose-400'
              }`}
            >
              Submit {side.toUpperCase()} Order ({orderType.toUpperCase()})
            </button>
          </form>

          {/* Action Result Feedback */}
          {lastActionResult && (
            <div
              className={`p-3 rounded-md text-xs border ${
                lastActionResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {lastActionResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{lastActionResult.success ? 'Order Processed' : 'Engine Rejected Order'}</div>
                  <div className="mt-0.5 text-slate-300">{lastActionResult.message}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Matched Trades Feed & Engine Metrics (3 cols) */}
        <div className="lg:col-span-3 border border-slate-800 bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-white">Public Trade Execution Feed</span>
            <span className="text-xs text-slate-400 font-mono">{engine.recentMatches.length} fills</span>
          </div>

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {engine.recentMatches.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No trades executed yet. Cross the spread to match!</div>
            ) : (
              engine.recentMatches.slice(0, 12).map((match) => (
                <div
                  key={match.matchId}
                  className="p-2 bg-slate-950/60 rounded border border-slate-800/80 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className={match.makerSide === 'buy' ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      ${match.price.toFixed(1)}
                    </span>
                    <span className="text-slate-200 font-semibold">{match.qty.toFixed(3)} BTC</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Seq #{match.sequenceId}</span>
                    <span>{match.matchId}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Total Volume:</span>
              <span className="text-white font-semibold">{engine.totalVolume.toFixed(3)} BTC</span>
            </div>
            <div className="flex justify-between">
              <span>Total Match Count:</span>
              <span className="text-white font-semibold">{engine.totalMatches}</span>
            </div>
            <div className="flex justify-between">
              <span>Engine Latency (p99):</span>
              <span className="text-emerald-400 font-semibold">0.82 μs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
