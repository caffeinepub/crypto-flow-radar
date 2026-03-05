
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Char "mo:core/Char";
import Timer "mo:core/Timer";
import OutCall "http-outcalls/outcall";
import Blob "mo:core/Blob";


actor {
  // Types
  type Float = Float.Float;
  type Timestamp = Int;
  type MarketSnapshot = {
    timestamp : Int;
    exchange : Text;
    price : Float;
    fundingRate : Float;
    openInterest : Float;
  };

  type ExchangeFlow = {
    timestamp : Int;
    exchange : Text;
    inflowBTC : Float;
    outflowBTC : Float;
  };

  type OrderBookDepth = {
    timestamp : Int;
    exchange : Text;
    bidDepth01 : Float;
    askDepth01 : Float;
    bidDepth05 : Float;
    askDepth05 : Float;
    bidDepth1 : Float;
    askDepth1 : Float;
  };

  type LiquidationEvent = {
    timestamp : Int;
    exchange : Text;
    side : Text; // "long" or "short"
    amountUSD : Float;
  };

  type ImpulseEvent = {
    id : Nat;
    timestamp : Int;
    eventType : Text;
    exchanges : [Text];
    magnitude : Float;
    description : Text;
  };

  type SynchronizedImpulseEvent = {
    id : Nat;
    timestamp : Int;
    direction : Text; // "buy" or "sell"
    exchanges : [Text];
    priceChangePct : Float;
    volumeSpikeFactor : Float;
    description : Text;
  };

  type NetflowPoint = {
    timestamp : Int;
    exchange : Text;
    inflow : Float;
    outflow : Float;
    netflow : Float;
    isSpike : Bool;
  };

  type LiquidationWindow = {
    window : Text; // "5min", "15min", "1h"
    longLiquidations : Float;
    shortLiquidations : Float;
    totalVolume : Float;
    isCluster : Bool;
  };

  type SpreadSnapshot = {
    timestamp : Int;
    highestExchange : Text;
    lowestExchange : Text;
    highestPrice : Float;
    lowestPrice : Float;
    spreadPct : Float;
    isAbnormal : Bool;
  };

  type VolumeMetric = {
    timestamp : Int;
    exchange : Text;
    volume1min : Float;
    volume60minAvg : Float;
    relativeVolume : Float;
    isSpike : Bool;
  };

  type DataFreshnessRecord = {
    metricName : Text;
    exchange : Text;
    lastUpdated : Int;
    latencyMs : Int;
    isStale : Bool;
  };

  type LiquidityScore = {
    score : Nat;
    fundingScore : Nat;
    oiScore : Nat;
    orderBookScore : Nat;
    impulseScore : Nat;
  };

  type AlertTrigger = {
    timestamp : Int;
    alertId : Nat;
    message : Text;
  };

  type Alert = {
    id : Nat;
    alertType : Text;
    threshold : Float;
    active : Bool;
    note : Text;
  };

  type EventReplay = {
    event : ?ImpulseEvent;
    priceHistory : [MarketSnapshot];
    liquidations : [LiquidationEvent];
    flows : [ExchangeFlow];
  };

  // Store sizes
  let marketSnapshotCapacity = 1440; // 24h, 1min resolution
  let liquidationCapacity = 500;
  let exchangeFlowCapacity = 500;
  let orderBookCapacity = 500;
  let impulseCapacity = 500;
  let netflowCapacity = 2880; // 2 days of 1-min data

  // Persistent Stores
  var nextAlertId = 1;
  var nextEventId = 1;
  var hasLiveData = false;
  var lastBinancePrice : Float = 0.0;
  var lastFundingRate : Float = 0.0;
  var lastOpenInterest : Float = 0.0;

  let alerts = List.empty<Alert>();
  let alertTriggers = List.empty<AlertTrigger>();
  let marketSnapshots = Map.empty<Text, List.List<MarketSnapshot>>();
  let exchangeFlows = List.empty<ExchangeFlow>();
  let orderBookDepths = List.empty<OrderBookDepth>();
  let liquidationEvents = List.empty<LiquidationEvent>();
  let impulseEvents = List.empty<ImpulseEvent>();
  let synchronizedImpulseEvents = List.empty<SynchronizedImpulseEvent>();
  let netflows = List.empty<NetflowPoint>();
  let liquidationWindows = List.empty<LiquidationWindow>();
  let volumeMetrics = List.empty<VolumeMetric>();
  let dataFreshness = List.empty<DataFreshnessRecord>();
  let spreadSnapshots = List.empty<SpreadSnapshot>();

  // Helper for ring buffer
  func addToRingBuffer<T>(buffer : List.List<T>, newElement : T, capacity : Nat) : () {
    if (buffer.size() >= capacity) {
      let array = buffer.toArray();
      buffer.clear();
      buffer.addAll(array.sliceToArray(1, array.size()).values());
      buffer.add(newElement);
    } else {
      buffer.add(newElement);
    };
  };

  func compareSnapshotByTimestamp(a : MarketSnapshot, b : MarketSnapshot) : Order.Order {
    Int.compare(a.timestamp, b.timestamp);
  };

  // Data Refresh
  public func isLiveData() : async Bool {
    hasLiveData;
  };

  // Market Data
  func getLatestSnapshotSync(exchange : Text) : ?MarketSnapshot {
    switch (marketSnapshots.get(exchange)) {
      case (null) { null };
      case (?buffer) {
        if (buffer.size() > 0) {
          buffer.last();
        } else {
          null;
        };
      };
    };
  };

  public func getLatestPrices() : async [(Text, Float)] {
    let exchanges = marketSnapshots.keys().toArray();
    let prices = exchanges.map(
      func(exchange) {
        switch (getLatestSnapshotSync(exchange)) {
          case (null) { (exchange, 0.0) };
          case (?snapshot) { (exchange, snapshot.price) };
        };
      }
    );
    prices;
  };

  public query ({ caller }) func getPriceHistory(exchange : Text, limit : Nat) : async [MarketSnapshot] {
    switch (marketSnapshots.get(exchange)) {
      case (null) { [] };
      case (?buffer) {
        let size = if (buffer.size() > limit) { limit } else {
          buffer.size();
        };
        if (size > 0) {
          buffer.toArray().sliceToArray(0, size).reverse();
        } else {
          [];
        };
      };
    };
  };

  // Funding Rates
  func getLatestFundingRateSync(exchange : Text) : Float {
    switch (marketSnapshots.get(exchange)) {
      case (null) { 0.0 };
      case (?buffer) {
        if (buffer.size() > 0) {
          switch (buffer.last()) {
            case (null) { 0.0 };
            case (?snapshot) { snapshot.fundingRate };
          };
        } else {
          0.0;
        };
      };
    };
  };

  public query ({ caller }) func getFundingRates() : async [(Text, Float)] {
    let exchanges = marketSnapshots.keys().toArray();
    let rates = exchanges.map(
      func(exchange) {
        (exchange, getLatestFundingRateSync(exchange));
      }
    );
    rates;
  };

  // Open Interest
  func getLatestOpenInterestSync(exchange : Text) : Float {
    switch (marketSnapshots.get(exchange)) {
      case (null) { 0.0 };
      case (?buffer) {
        if (buffer.size() > 0) {
          switch (buffer.last()) {
            case (null) { 0.0 };
            case (?snapshot) { snapshot.openInterest };
          };
        } else {
          0.0;
        };
      };
    };
  };

  public query ({ caller }) func getOpenInterest() : async [(Text, Float)] {
    let exchanges = marketSnapshots.keys().toArray();
    let ois = exchanges.map(
      func(exchange) {
        (exchange, getLatestOpenInterestSync(exchange));
      }
    );
    ois;
  };

  // Liquidations
  public query ({ caller }) func getLiquidations(limit : Nat) : async [LiquidationEvent] {
    let size = if (liquidationEvents.size() > limit) { limit } else {
      liquidationEvents.size();
    };
    if (size > 0) {
      liquidationEvents.toArray().sliceToArray(0, size);
    } else {
      [];
    };
  };

  // Exchange Flows
  public query ({ caller }) func getExchangeFlows(limit : Nat) : async [ExchangeFlow] {
    let size = if (exchangeFlows.size() > limit) { limit } else {
      exchangeFlows.size();
    };
    if (size > 0) {
      exchangeFlows.toArray().sliceToArray(0, size);
    } else {
      [];
    };
  };

  // Order Book Depth
  func getLatestOrderBookSync(exchange : Text) : ?OrderBookDepth {
    let filtered = orderBookDepths.toArray().filter(
      func(depth) { depth.exchange == exchange }
    );
    if (filtered.size() > 0) {
      ?filtered[0];
    } else {
      null;
    };
  };

  func emptyOrderBookForExchange(exchange : Text) : OrderBookDepth {
    {
      timestamp = 0;
      exchange;
      bidDepth01 = 0.0;
      askDepth01 = 0.0;
      bidDepth05 = 0.0;
      askDepth05 = 0.0;
      bidDepth1 = 0.0;
      askDepth1 = 0.0;
    };
  };

  public query ({ caller }) func getOrderBookDepth() : async [(Text, OrderBookDepth)] {
    let exchanges = marketSnapshots.keys().toArray();
    let depths = exchanges.map(
      func(exchange) {
        switch (getLatestOrderBookSync(exchange)) {
          case (null) { (exchange, emptyOrderBookForExchange(exchange)) };
          case (?depth) { (exchange, depth) };
        };
      }
    );
    depths;
  };

  // Impulse Events
  public query ({ caller }) func getImpulseEvents(limit : Nat) : async [ImpulseEvent] {
    let size = if (impulseEvents.size() > limit) { limit } else {
      impulseEvents.size();
    };
    let events = impulseEvents.toArray();
    if (size > 0) {
      events.sliceToArray(0, size).reverse();
    } else {
      [];
    };
  };

  // Synchronized Events
  public query ({ caller }) func getSynchronizedImpulseEvents(limit : Nat) : async [SynchronizedImpulseEvent] {
    let size = if (synchronizedImpulseEvents.size() > limit) { limit } else {
      synchronizedImpulseEvents.size();
    };
    if (size > 0) {
      synchronizedImpulseEvents.toArray().sliceToArray(0, size);
    } else {
      [];
    };
  };

  // Netflow History
  public query ({ caller }) func getNetflowHistory(exchange : Text, window : Text) : async [NetflowPoint] {
    let filtered = netflows.toArray().filter(
      func(flow) { flow.exchange == exchange }
    );
    let limit = switch (window) {
      case ("1h") { 60 };
      case ("6h") { 360 };
      case ("24h") { 1440 };
      case ("full") { filtered.size() };
      case (_) { 60 };
    };
    let size = if (filtered.size() > limit) { limit } else {
      filtered.size();
    };
    if (size > 0) {
      filtered.sliceToArray(0, size).reverse();
    } else {
      [];
    };
  };

  // Liquidation Windows
  public query ({ caller }) func getLiquidationWindows() : async [LiquidationWindow] {
    liquidationWindows.toArray();
  };

  // Spread Snapshot
  public query ({ caller }) func getSpreadSnapshot() : async ?SpreadSnapshot {
    if (spreadSnapshots.size() > 0) {
      switch (spreadSnapshots.last()) {
        case (null) { null };
        case (?snapshot) { ?snapshot };
      };
    } else {
      null;
    };
  };

  // Volume Metrics
  public query ({ caller }) func getVolumeMetrics() : async [VolumeMetric] {
    volumeMetrics.toArray();
  };

  // Data Freshness
  public query ({ caller }) func getDataFreshness() : async [DataFreshnessRecord] {
    dataFreshness.toArray();
  };

  // Liquidity Score
  public query ({ caller }) func getLiquidityScore() : async LiquidityScore {
    calculateLiquidityScoreSync();
  };

  func calculateLiquidityScoreSync() : LiquidityScore {
    {
      score = 0;
      fundingScore = 0;
      oiScore = 0;
      orderBookScore = 0;
      impulseScore = 0;
    };
  };

  // Alerts
  public query ({ caller }) func getAlerts() : async [Alert] {
    alerts.toArray();
  };

  public query ({ caller }) func getAlertTriggers(limit : Nat) : async [AlertTrigger] {
    let size = if (alertTriggers.size() > limit) { limit } else {
      alertTriggers.size();
    };
    if (size > 0) {
      alertTriggers.toArray().sliceToArray(0, size);
    } else {
      [];
    };
  };

  // Replay
  public query ({ caller }) func getEventReplay(impulseEventId : Nat) : async EventReplay {
    {
      event = null;
      priceHistory = [];
      liquidations = [];
      flows = [];
    };
  };

  // Alert Management
  public shared ({ caller }) func addAlert(alertType : Text, threshold : Float, note : Text) : async Nat {
    let newAlert = {
      id = nextAlertId;
      alertType;
      threshold;
      active = true;
      note;
    };
    alerts.add(newAlert);
    nextAlertId += 1;
    newAlert.id;
  };

  public shared ({ caller }) func updateAlert(id : Nat, active : Bool) : async Bool {
    let array = alerts.toArray();
    alerts.clear();
    alerts.addAll(
      array.values().enumerate().map(
        func((i, alert)) {
          if (i == id) {
            {
              id = alert.id;
              alertType = alert.alertType;
              threshold = alert.threshold;
              active;
              note = alert.note;
            };
          } else {
            alert;
          };
        }
      )
    );
    true;
  };

  public shared ({ caller }) func deleteAlert(id : Nat) : async Bool {
    let filtered = alerts.toArray().filter(
      func(alert) { alert.id != id }
    );
    alerts.clear();
    alerts.addAll(filtered.values());
    true;
  };

  // Transformation function for HTTP outcall
  public query ({ caller }) func transformHttpResponse(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Manual Data Fetch using OutCall component
  public shared ({ caller }) func triggerManualRefresh() : async Text {
    let url = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";
    await OutCall.httpGetRequest(url, [], transformHttpResponse);
  };

  // HTTP GET Binance Price
  public shared ({ caller }) func getBinanceBTCPrice() : async Text {
    let url = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";
    await OutCall.httpGetRequest(url, [], transformHttpResponse);
  };

  // Periodic Data Fetching
  public shared ({ caller }) func startDataFetching() : async () {
    ignore Timer.recurringTimer<system>(
      #seconds 60,
      func() : async () {
        await fetchDataCycle();
      },
    );
  };

  public shared ({ caller }) func fetchDataCycle() : async () {};

  // Actor initialization
  public shared ({ caller }) func init() : async () {
    await startDataFetching();
  };

  // System Timers (auto-start after deploy)
  ignore Timer.setTimer<system>(#seconds 5, func() : async () { await fetchDataCycle() }); // Changed to setTimer
  ignore Timer.recurringTimer<system>(#seconds 60, func() : async () { await fetchDataCycle() });
};
