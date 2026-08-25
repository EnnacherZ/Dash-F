import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowDown, FaArrowUp, FaBoxOpen, FaChartLine, FaCoins, FaExclamationTriangle, FaShoppingBag, FaSyncAlt, FaUsers } from "react-icons/fa";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import apiInstance from "@/lib/api";
import { selectedLang } from "@/utils/i18n";
import { useLangContext } from "../contexts/LanguageContext";
import "../styles/Statistics.css";

type Period = "7d" | "30d" | "90d" | "12m";
type TrendKey = "revenue" | "orders" | "average_order_value" | "units_sold";

interface StatisticsData {
  period: Period;
  generated_at: string;
  currency: string;
  metrics: { revenue: number; orders: number; average_order_value: number; units_sold: number; customers: number; trends: Record<TrendKey, number | null> };
  timeline: Array<{ date: string; revenue: number; orders: number }>;
  orders: {
    status: { confirmed: number; cod: number; pending: number; failed: number };
    payment_methods: { online: number; cash_on_delivery: number };
    fulfillment: { delivered: number; awaiting_delivery: number };
  };
  top_products: Array<{ product_id: number; ref: string; name: string; units: number; revenue: number }>;
  top_categories: Array<{ category: string; product_type: string; units: number; revenue: number }>;
  inventory: {
    products: number;
    available_units: number;
    out_of_stock: number;
    low_stock: Array<{ product_id: number; ref: string; name: string; size: string; available: number }>;
  };
}

const PERIODS: Period[] = ["7d", "30d", "90d", "12m"];

const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const { currentLang } = useLangContext();
  const language = selectedLang(currentLang);
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStatistics = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const response = await apiInstance.get<StatisticsData>("db/statistics/overview/", { params: { period }, signal });
      setData(response.data);
    } catch {
      if (signal?.aborted) return;
      setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStatistics(controller.signal);
    return () => controller.abort();
  }, [loadStatistics]);

  const locale = language === "ar" ? "ar-MA" : language === "fr" ? "fr-MA" : "en-MA";
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const money = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency: data?.currency || "MAD", maximumFractionDigits: 2 }), [data?.currency, locale]);
  const shortDate = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }), [locale]);
  const chartDate = (value: string) => shortDate.format(new Date(`${value}${value.length === 7 ? "-01" : ""}T12:00:00`));

  const cards = data ? [
    { key: "revenue" as TrendKey, label: t("statisticsUi.revenue"), value: money.format(data.metrics.revenue), icon: <FaCoins />, tone: "blue" },
    { key: "orders" as TrendKey, label: t("statisticsUi.orders"), value: numbers.format(data.metrics.orders), icon: <FaShoppingBag />, tone: "violet" },
    { key: "average_order_value" as TrendKey, label: t("statisticsUi.averageOrder"), value: money.format(data.metrics.average_order_value), icon: <FaChartLine />, tone: "green" },
    { key: "units_sold" as TrendKey, label: t("statisticsUi.unitsSold"), value: numbers.format(data.metrics.units_sold), icon: <FaBoxOpen />, tone: "amber" },
  ] : [];

  const maxRevenue = Math.max(...(data?.timeline.map((point) => point.revenue) || [0]), 1);
  const labelInterval = Math.max(1, Math.ceil((data?.timeline.length || 1) / 6));
  const totalPayments = data ? data.orders.payment_methods.online + data.orders.payment_methods.cash_on_delivery : 0;
  const onlineShare = totalPayments && data ? Math.round(data.orders.payment_methods.online / totalPayments * 100) : 0;
  const donutStyle = { "--online-share": `${onlineShare}%` } as CSSProperties;

  return <>
    <Sidebar />
    <div className={`db-statistics ${language === "ar" ? "rtl" : ""}`}>
      <DbHeader />
      <main className="statistics-page">
        <header className="statistics-hero">
          <div className="statistics-hero__copy">
            <span className="statistics-hero__icon"><FaChartLine /></span>
            <div><span className="statistics-hero__eyebrow">{t("statisticsUi.eyebrow")}</span><h1>{t("statisticsUi.title")}</h1><p>{t("statisticsUi.description")}</p></div>
          </div>
          <div className="statistics-period" aria-label={t("statisticsUi.periodLabel")}>
            {PERIODS.map((item) => <button type="button" key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)} aria-pressed={period === item}>{t(`statisticsUi.periods.${item}`)}</button>)}
          </div>
        </header>

        {error && !loading && <section className="statistics-error" role="alert"><FaExclamationTriangle /><div><strong>{t("statisticsUi.loadError")}</strong><p>{t("statisticsUi.loadErrorHint")}</p></div><button type="button" onClick={() => void loadStatistics()}><FaSyncAlt /> {t("statisticsUi.retry")}</button></section>}

        {loading && !data ? <div className="statistics-loading" aria-label={t("statisticsUi.loading")}><div /><div /><div /><div /><span /><span /></div> : data && <>
          <section className="statistics-metrics" aria-label={t("statisticsUi.summary")}>
            {cards.map((card) => {
              const trend = data.metrics.trends[card.key];
              return <article className={`statistics-metric statistics-metric--${card.tone}`} key={card.key}>
                <div className="statistics-metric__top"><span className="statistics-metric__icon">{card.icon}</span><span className={`statistics-trend ${trend !== null && trend < 0 ? "negative" : ""}`}>{trend === null ? "—" : <>{trend >= 0 ? <FaArrowUp /> : <FaArrowDown />}{Math.abs(trend)}%</>}</span></div>
                <strong>{card.value}</strong><span>{card.label}</span><small>{trend === null ? t("statisticsUi.noPreviousData") : t("statisticsUi.vsPrevious")}</small>
              </article>;
            })}
          </section>

          <section className="statistics-grid statistics-grid--primary">
            <article className="statistics-panel statistics-revenue-chart">
              <div className="statistics-panel__header"><div><h2>{t("statisticsUi.revenueTrend")}</h2><p>{t("statisticsUi.revenueTrendHint")}</p></div><span className="statistics-customer-chip"><FaUsers /> {numbers.format(data.metrics.customers)} {t("statisticsUi.customers")}</span></div>
              <div className="statistics-bars" role="img" aria-label={t("statisticsUi.revenueChartLabel")}>
                {data.timeline.map((point, index) => <div className="statistics-bar-slot" key={point.date} title={`${chartDate(point.date)} · ${money.format(point.revenue)}`}><div className="statistics-bar-track"><span style={{ height: `${Math.max(point.revenue > 0 ? 5 : 0, point.revenue / maxRevenue * 100)}%` }} /></div><small>{index % labelInterval === 0 || index === data.timeline.length - 1 ? chartDate(point.date) : ""}</small></div>)}
              </div>
              {!data.timeline.some((point) => point.revenue > 0) && <div className="statistics-chart-empty">{t("statisticsUi.noSalesPeriod")}</div>}
            </article>

            <article className="statistics-panel statistics-order-mix">
              <div className="statistics-panel__header"><div><h2>{t("statisticsUi.paymentMethods")}</h2><p>{t("statisticsUi.paymentMethodsHint")}</p></div></div>
              <div className="statistics-donut-row"><div className="statistics-donut" style={donutStyle}><span><strong>{totalPayments}</strong><small>{t("statisticsUi.orders")}</small></span></div><div className="statistics-legend"><div><i /><span>{t("statisticsUi.online")}</span><strong>{data.orders.payment_methods.online}</strong></div><div><i className="cash" /><span>{t("statisticsUi.cash")}</span><strong>{data.orders.payment_methods.cash_on_delivery}</strong></div></div></div>
              <div className="statistics-fulfillment"><div><span>{t("statisticsUi.delivered")}</span><strong>{data.orders.fulfillment.delivered}</strong></div><div><span>{t("statisticsUi.awaitingDelivery")}</span><strong>{data.orders.fulfillment.awaiting_delivery}</strong></div></div>
              <div className="statistics-statuses">
                <span><i className="confirmed" />{t("statisticsUi.confirmedOrders")}<b>{data.orders.status.confirmed}</b></span>
                <span><i className="cod" />{t("statisticsUi.codOrders")}<b>{data.orders.status.cod}</b></span>
                <span><i className="pending" />{t("statisticsUi.pendingOrders")}<b>{data.orders.status.pending}</b></span>
                <span><i className="failed" />{t("statisticsUi.failedOrders")}<b>{data.orders.status.failed}</b></span>
              </div>
            </article>
          </section>

          <section className="statistics-grid statistics-grid--secondary">
            <article className="statistics-panel statistics-products">
              <div className="statistics-panel__header"><div><h2>{t("statisticsUi.topProducts")}</h2><p>{t("statisticsUi.topProductsHint")}</p></div></div>
              {data.top_products.length ? <div className="statistics-table-wrap"><table><thead><tr><th>{t("statisticsUi.product")}</th><th>{t("statisticsUi.units")}</th><th>{t("statisticsUi.revenue")}</th></tr></thead><tbody>{data.top_products.map((product, index) => <tr key={`${product.product_id}-${product.ref}`}><td><span className="statistics-rank">{index + 1}</span><span><strong>{product.name}</strong><small>{product.ref}</small></span></td><td>{numbers.format(product.units)}</td><td>{money.format(product.revenue)}</td></tr>)}</tbody></table></div> : <div className="statistics-empty"><FaShoppingBag /><p>{t("statisticsUi.noSalesPeriod")}</p></div>}
              {!!data.top_categories.length && <div className="statistics-categories"><strong>{t("statisticsUi.topCategories")}</strong><div>{data.top_categories.map((category) => <span key={`${category.product_type}-${category.category}`}>{category.category}<small>{category.units} {t("statisticsUi.units")}</small></span>)}</div></div>}
            </article>

            <article className="statistics-panel statistics-inventory">
              <div className="statistics-panel__header"><div><h2>{t("statisticsUi.inventory")}</h2><p>{t("statisticsUi.inventoryHint")}</p></div></div>
              <div className="statistics-inventory-summary"><div><strong>{numbers.format(data.inventory.products)}</strong><span>{t("statisticsUi.products")}</span></div><div><strong>{numbers.format(data.inventory.available_units)}</strong><span>{t("statisticsUi.availableUnits")}</span></div><div className={data.inventory.out_of_stock ? "danger" : ""}><strong>{numbers.format(data.inventory.out_of_stock)}</strong><span>{t("statisticsUi.outOfStock")}</span></div></div>
              <div className="statistics-low-stock"><h3><FaExclamationTriangle /> {t("statisticsUi.lowStock")}</h3>{data.inventory.low_stock.length ? data.inventory.low_stock.map((item) => <div className="statistics-stock-row" key={`${item.product_id}-${item.size}`}><span><strong>{item.name}</strong><small>{item.ref} · {t("product.size")}: {item.size}</small></span><b className={item.available === 0 ? "empty" : ""}>{item.available} {t("statisticsUi.remaining")}</b></div>) : <div className="statistics-healthy"><FaBoxOpen /> {t("statisticsUi.healthyStock")}</div>}</div>
            </article>
          </section>
          <footer className="statistics-updated">{t("statisticsUi.lastUpdated", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generated_at)) })}</footer>
        </>}
      </main>
    </div>
  </>;
};

export default Statistics;
