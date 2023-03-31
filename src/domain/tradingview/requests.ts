import { getServerUrl } from "config/backend";
import { getTokenBySymbol, getWrappedToken } from "config/tokens";
import { getChainlinkChartPricesFromGraph, getChartPricesFromStats, timezoneOffset } from "domain/prices";
import { CHART_PERIODS } from "lib/legacy";

function getCurrentBarTimestamp(periodSeconds) {
  return Math.floor(Date.now() / (periodSeconds * 1000)) * (periodSeconds * 1000);
}

export const getTokenChartPrice = async (chainId: number, symbol: string, period: string) => {
  let prices;
  try {
    prices = await getChartPricesFromStats(chainId, symbol, period);
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.warn(ex, "Switching to graph chainlink data");
    try {
      prices = await getChainlinkChartPricesFromGraph(symbol, period);
    } catch (ex2) {
      // eslint-disable-next-line no-console
      console.warn("getChainlinkChartPricesFromGraph failed", ex2);
      prices = [];
    }
  }
  return prices;
};

export async function getCurrentPriceOfToken(chainId: number, symbol: string) {
  try {
    const indexPricesUrl = getServerUrl(chainId, "/prices");
    const response = await fetch(indexPricesUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const indexPrices = await response.json();
    // const indexPrices = {
    //   "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f": BigNumber.from("28465979476500000000000000000000000"),
    //   "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": BigNumber.from("1797698130750000000000000000000000"),
    //   "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4": BigNumber.from("7316230770000000000000000000000"),
    //   "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0": BigNumber.from("5942812005000000000000000000000"),
    // };

    let symbolInfo = getTokenBySymbol(chainId, symbol);
    if (symbolInfo.isNative) {
      symbolInfo = getWrappedToken(chainId);
    }
    return indexPrices[symbolInfo.address];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

export function fillBarGaps(prices, periodSeconds) {
  if (prices.length < 2) return prices;

  const currentBarTimestamp = getCurrentBarTimestamp(periodSeconds) / 1000 + timezoneOffset;
  let lastBar = prices[prices.length - 1];

  if (lastBar.time !== currentBarTimestamp) {
    prices.push({
      ...lastBar,
      time: currentBarTimestamp,
    });
  }

  const newPrices = [prices[0]];
  let prevTime = prices[0].time;

  for (let i = 1; i < prices.length; i++) {
    const { time, open } = prices[i];
    if (prevTime) {
      const numBarsToFill = Math.floor((time - prevTime) / periodSeconds) - 1;
      for (let j = numBarsToFill; j > 0; j--) {
        const newBar = {
          time: time - j * periodSeconds,
          open,
          close: open,
          high: open * 1.0003,
          low: open * 0.9996,
        };
        newPrices.push(newBar);
      }
    }
    prevTime = time;
    newPrices.push(prices[i]);
  }

  return newPrices;
}

export function getStableCoinPrice(period: string, from: number, to: number) {
  const periodSeconds = CHART_PERIODS[period];
  const fromCandle = Math.floor(from / periodSeconds) * periodSeconds;
  const toCandle = Math.floor(to / periodSeconds) * periodSeconds;
  let priceData: any = [];
  for (let candleTime = fromCandle; candleTime <= toCandle; candleTime += periodSeconds) {
    priceData.push({
      time: candleTime,
      open: 1,
      close: 1,
      high: 1,
      low: 1,
    });
  }
  return priceData.filter((candle) => candle.time >= from && candle.time <= to);
}
