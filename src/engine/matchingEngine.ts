import { Order, OrderBookSnapshot, MatchExecution, PriceLevel, OrderSide, OrderType } from '../types/architecture';

export class DeterministicRustStyleEngine {
  public symbol: string;
  private bids: Map<number, PriceLevel> = new Map(); // sorted descending
  private asks: Map<number, PriceLevel> = new Map(); // sorted ascending
  private ordersMap: Map<string, Order> = new Map();
  public sequenceId: number = 100000;
  public totalMatches: number = 0;
  public totalVolume: number = 0;
  public lastTradedPrice: number = 96450.0;
  public recentMatches: MatchExecution[] = [];

  constructor(symbol: string = 'BTC-USDT') {
    this.symbol = symbol;
    this.seedInitialBook();
  }

  private seedInitialBook() {
    const basePrice = 96450.0;
    // Pre-populate 10 bids
    for (let i = 1; i <= 10; i++) {
      const price = Math.round((basePrice - i * 2.5) * 10) / 10;
      const qty = Math.round((0.5 + Math.random() * 2.8) * 1000) / 1000;
      this.insertDirectOrder({
        id: `ord-seed-bid-${i}`,
        clientOrderId: `cl-seed-b${i}`,
        accountId: `acc-mm-${(i % 3) + 1}`,
        symbol: this.symbol,
        side: 'buy',
        orderType: 'limit',
        price,
        qty,
        filledQty: 0,
        remainingQty: qty,
        status: 'new',
        timestampNs: Date.now() * 1_000_000 - (10 - i) * 50_000,
        sequenceId: ++this.sequenceId,
      });
    }

    // Pre-populate 10 asks
    for (let i = 1; i <= 10; i++) {
      const price = Math.round((basePrice + i * 2.5) * 10) / 10;
      const qty = Math.round((0.4 + Math.random() * 2.6) * 1000) / 1000;
      this.insertDirectOrder({
        id: `ord-seed-ask-${i}`,
        clientOrderId: `cl-seed-a${i}`,
        accountId: `acc-mm-${(i % 3) + 1}`,
        symbol: this.symbol,
        side: 'sell',
        orderType: 'limit',
        price,
        qty,
        filledQty: 0,
        remainingQty: qty,
        status: 'new',
        timestampNs: Date.now() * 1_000_000 - (10 - i) * 50_000,
        sequenceId: ++this.sequenceId,
      });
    }
  }

  private insertDirectOrder(order: Order) {
    this.ordersMap.set(order.id, order);
    const book = order.side === 'buy' ? this.bids : this.asks;
    let level = book.get(order.price);
    if (!level) {
      level = {
        price: order.price,
        totalQty: 0,
        orderCount: 0,
        orders: [],
      };
      book.set(order.price, level);
    }
    level.orders.push(order);
    level.totalQty = Math.round((level.totalQty + order.remainingQty) * 10000) / 10000;
    level.orderCount = level.orders.length;
  }

  public getBestBid(): number | null {
    if (this.bids.size === 0) return null;
    let highest = -Infinity;
    for (const price of this.bids.keys()) {
      if (price > highest) highest = price;
    }
    return highest === -Infinity ? null : highest;
  }

  public getBestAsk(): number | null {
    if (this.asks.size === 0) return null;
    let lowest = Infinity;
    for (const price of this.asks.keys()) {
      if (price < lowest) lowest = price;
    }
    return lowest === Infinity ? null : lowest;
  }

  public submitOrder(
    side: OrderSide,
    orderType: OrderType,
    price: number,
    qty: number,
    accountId: string = 'acc-trader-1',
    clientOrderId?: string
  ): { order: Order; matches: MatchExecution[]; rejectedReason?: string } {
    const seq = ++this.sequenceId;
    const orderId = `ord-${Date.now().toString(36)}-${seq.toString().slice(-4)}`;
    const clId = clientOrderId || `cli-${seq}`;
    const timestampNs = Date.now() * 1_000_000;

    const newOrder: Order = {
      id: orderId,
      clientOrderId: clId,
      accountId,
      symbol: this.symbol,
      side,
      orderType,
      price,
      qty,
      filledQty: 0,
      remainingQty: qty,
      status: 'new',
      timestampNs,
      sequenceId: seq,
    };

    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();

    // 1. Post-only validation: must not cross spread
    if (orderType === 'post_only') {
      if (side === 'buy' && bestAsk !== null && price >= bestAsk) {
        newOrder.status = 'rejected';
        return { order: newOrder, matches: [], rejectedReason: `Post-only violation: Limit price $${price} crosses best ask $${bestAsk}` };
      }
      if (side === 'sell' && bestBid !== null && price <= bestBid) {
        newOrder.status = 'rejected';
        return { order: newOrder, matches: [], rejectedReason: `Post-only violation: Limit price $${price} crosses best bid $${bestBid}` };
      }
    }

    // 2. FOK (Fill-or-Kill) validation: must be fully fillable right now
    if (orderType === 'fok') {
      const canFill = this.checkFillability(side, price, qty);
      if (!canFill) {
        newOrder.status = 'rejected';
        return { order: newOrder, matches: [], rejectedReason: 'FOK (Fill-Or-Kill) condition failed: insufficient immediate liquidity' };
      }
    }

    // 3. Execution Matching Loop
    const matches: MatchExecution[] = [];
    const oppositeBook = side === 'buy' ? this.asks : this.bids;

    // Sort candidate opposite price levels
    // For buy orders, taker matches asks ascending (lowest price first)
    // For sell orders, taker matches bids descending (highest price first)
    const sortedOppositePrices = Array.from(oppositeBook.keys()).sort((a, b) =>
      side === 'buy' ? a - b : b - a
    );

    for (const oppPrice of sortedOppositePrices) {
      if (newOrder.remainingQty <= 0.000001) break;

      // Price limit check for limit/ioc/fok
      if (orderType !== 'market') {
        if (side === 'buy' && oppPrice > price) break; // ask is too expensive
        if (side === 'sell' && oppPrice < price) break; // bid is too cheap
      }

      const level = oppositeBook.get(oppPrice);
      if (!level || level.orders.length === 0) continue;

      // Match against orders in FIFO queue
      let orderIdx = 0;
      while (orderIdx < level.orders.length && newOrder.remainingQty > 0.000001) {
        const makerOrder = level.orders[orderIdx];
        const matchQty = Math.round(Math.min(newOrder.remainingQty, makerOrder.remainingQty) * 10000) / 10000;

        if (matchQty > 0) {
          const matchSeq = ++this.sequenceId;
          const match: MatchExecution = {
            matchId: `mat-${matchSeq}`,
            symbol: this.symbol,
            makerOrderId: makerOrder.id,
            takerOrderId: newOrder.id,
            makerAccountId: makerOrder.accountId,
            takerAccountId: newOrder.accountId,
            makerSide: makerOrder.side,
            price: oppPrice,
            qty: matchQty,
            timestampNs: Date.now() * 1_000_000,
            sequenceId: matchSeq,
          };

          matches.push(match);
          this.recentMatches.unshift(match);
          if (this.recentMatches.length > 50) this.recentMatches.pop();

          this.totalMatches++;
          this.totalVolume = Math.round((this.totalVolume + matchQty) * 1000) / 1000;
          this.lastTradedPrice = oppPrice;

          // Update maker order
          makerOrder.remainingQty = Math.round((makerOrder.remainingQty - matchQty) * 10000) / 10000;
          makerOrder.filledQty = Math.round((makerOrder.filledQty + matchQty) * 10000) / 10000;
          makerOrder.status = makerOrder.remainingQty <= 0.000001 ? 'filled' : 'partially_filled';

          // Update taker order
          newOrder.remainingQty = Math.round((newOrder.remainingQty - matchQty) * 10000) / 10000;
          newOrder.filledQty = Math.round((newOrder.filledQty + matchQty) * 10000) / 10000;
          newOrder.status = newOrder.remainingQty <= 0.000001 ? 'filled' : 'partially_filled';

          // Update level total
          level.totalQty = Math.round((level.totalQty - matchQty) * 10000) / 10000;

          if (makerOrder.status === 'filled') {
            this.ordersMap.delete(makerOrder.id);
            level.orders.splice(orderIdx, 1);
          } else {
            orderIdx++;
          }
        } else {
          orderIdx++;
        }
      }

      level.orderCount = level.orders.length;
      if (level.orders.length === 0 || level.totalQty <= 0.000001) {
        oppositeBook.delete(oppPrice);
      }
    }

    // 4. Handle remaining quantity based on order type
    if (newOrder.remainingQty > 0.000001) {
      if (orderType === 'market' || orderType === 'ioc') {
        newOrder.status = newOrder.filledQty > 0 ? 'partially_filled' : 'canceled';
      } else if (orderType === 'limit' || orderType === 'post_only') {
        // Place residual into book
        this.insertDirectOrder(newOrder);
      }
    } else {
      newOrder.status = 'filled';
    }

    return { order: newOrder, matches };
  }

  private checkFillability(side: OrderSide, price: number, targetQty: number): boolean {
    const oppositeBook = side === 'buy' ? this.asks : this.bids;
    let accumulatedQty = 0;
    const sortedPrices = Array.from(oppositeBook.keys()).sort((a, b) =>
      side === 'buy' ? a - b : b - a
    );

    for (const p of sortedPrices) {
      if (side === 'buy' && p > price) break;
      if (side === 'sell' && p < price) break;
      const level = oppositeBook.get(p);
      if (level) {
        accumulatedQty += level.totalQty;
        if (accumulatedQty >= targetQty) return true;
      }
    }
    return false;
  }

  public cancelOrder(orderId: string): Order | null {
    const order = this.ordersMap.get(orderId);
    if (!order) return null;

    const book = order.side === 'buy' ? this.bids : this.asks;
    const level = book.get(order.price);
    if (level) {
      const idx = level.orders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        level.orders.splice(idx, 1);
        level.totalQty = Math.round((level.totalQty - order.remainingQty) * 10000) / 10000;
        level.orderCount = level.orders.length;
        if (level.orders.length === 0 || level.totalQty <= 0.000001) {
          book.delete(order.price);
        }
      }
    }

    this.ordersMap.delete(orderId);
    order.status = 'canceled';
    return order;
  }

  public getSnapshot(): OrderBookSnapshot {
    const bestBid = this.getBestBid() || 0;
    const bestAsk = this.getBestAsk() || 0;
    const spread = bestAsk > 0 && bestBid > 0 ? Math.round((bestAsk - bestBid) * 100) / 100 : 0;
    const mid = (bestAsk + bestBid) / 2;
    const spreadBps = mid > 0 ? Math.round(((spread / mid) * 10000) * 10) / 10 : 0;

    // Sorted bids descending
    const sortedBids: PriceLevel[] = Array.from(this.bids.entries())
      .filter(([_, lvl]) => lvl.totalQty > 0.0001)
      .sort((a, b) => b[0] - a[0])
      .map(([_, lvl]) => ({
        price: lvl.price,
        totalQty: Math.round(lvl.totalQty * 1000) / 1000,
        orderCount: lvl.orderCount,
        orders: [...lvl.orders],
      }))
      .slice(0, 15);

    // Sorted asks ascending
    const sortedAsks: PriceLevel[] = Array.from(this.asks.entries())
      .filter(([_, lvl]) => lvl.totalQty > 0.0001)
      .sort((a, b) => a[0] - b[0])
      .map(([_, lvl]) => ({
        price: lvl.price,
        totalQty: Math.round(lvl.totalQty * 1000) / 1000,
        orderCount: lvl.orderCount,
        orders: [...lvl.orders],
      }))
      .slice(0, 15);

    return {
      symbol: this.symbol,
      timestampNs: Date.now() * 1_000_000,
      sequenceId: this.sequenceId,
      bids: sortedBids,
      asks: sortedAsks,
      bestBid,
      bestAsk,
      spread,
      spreadBps,
    };
  }

  public resetBook() {
    this.bids.clear();
    this.asks.clear();
    this.ordersMap.clear();
    this.recentMatches = [];
    this.seedInitialBook();
  }
}
