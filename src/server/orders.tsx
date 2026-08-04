/**
 * dashboard/server/orders.tsx
 *
 * Data-fetching hook for the dashboard orders section.
 * All requests go through apiInstance which sends the httpOnly dashboard
 * cookie automatically.
 *
 * FIXES:
 *  - loading and error are now returned so pages can surface them to the user.
 */
import { useEffect, useState } from "react";
import apiInstance from "@/lib/api";
import i18n from "../contexts/LanguageContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardOrder {
  id:              number;
  order_id:        string;
  date:            string | null;
  amount:          number;
  currency:        string;
  is_paid:         "pending" | "confirmed" | "failed" | "cod";
  status:          boolean;
  delivered:       boolean;
  exception:       boolean;
  payment_mode:    boolean;
  transaction_id:  string | null;
  delivery_man:    string | null;
  client: {
    id:         number;
    first_name: string;
    last_name:  string;
    email:      string;
    phone:      string;
    city:       string;
    address:    string;
  };
  ordered_products: {
    id:           number;
    product_id:   number;
    product_type: string;
    category:     string;
    ref:          string;
    name:         string;
    size:         string;
    quantity:     number;
    price:        number;
    available:    boolean;
  }[];
}

interface OrdersResult {
  allOrders:             DashboardOrder[];
  remainingOrders:       DashboardOrder[];
  deliveredOrders:       DashboardOrder[];
  waitingDeliveryOrders: DashboardOrder[];
  loading:               boolean;
  error:                 string | null;
  refetch:               () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrders(): OrdersResult {
  const [allOrders,             setAll]       = useState<DashboardOrder[]>([]);
  const [remainingOrders,       setRemain]    = useState<DashboardOrder[]>([]);
  const [deliveredOrders,       setDelivered] = useState<DashboardOrder[]>([]);
  const [waitingDeliveryOrders, setWaiting]   = useState<DashboardOrder[]>([]);
  const [loading,               setLoading]   = useState(true);
  const [error,                 setError]     = useState<string | null>(null);
  const [tick,                  setTick]      = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiInstance
      .get<{
        allOrders:             DashboardOrder[];
        remainingOrders:       DashboardOrder[];
        deliveredOrders:       DashboardOrder[];
        waitingDeliveryOrders: DashboardOrder[];
      }>("db/orders/get")
      .then((res) => {
        if (cancelled) return;
        setAll(res.data.allOrders              ?? []);
        setRemain(res.data.remainingOrders     ?? []);
        setDelivered(res.data.deliveredOrders  ?? []);
        setWaiting(res.data.waitingDeliveryOrders ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(i18n.t("error.loadOrdersFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return {
    allOrders,
    remainingOrders,
    deliveredOrders,
    waitingDeliveryOrders,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}

// ── Delivery-man hook ───────────────────────────────────────────────────────
//
// Powers the dedicated delivery portal: orders assigned to the logged-in
// delivery account, confirmed for delivery but not yet delivered.

interface DeliveryManOrdersResult {
  orders:  DashboardOrder[];
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useDeliveryManOrders(): DeliveryManOrdersResult {
  const [orders,  setOrders]  = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiInstance
      .get<{ orders: DashboardOrder[] }>("db/mandeliveryOrders")
      .then((res) => {
        if (!cancelled) setOrders(res.data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(i18n.t("error.loadOrdersFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { orders, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ── Delivery history ─────────────────────────────────────────────────────────
//
// Past deliveries for the logged-in delivery account. The backend deliberately
// never includes amount/currency/is_paid in this response — once an order is
// delivered, payment info isn't this account's business anymore.

export interface DeliveryHistoryOrder {
  order_id: string;
  date:     string | null;
  client: {
    first_name: string;
    last_name:  string;
    phone:      string;
    address:    string;
    city:       string;
  };
}

interface DeliveryHistoryResult {
  orders:  DeliveryHistoryOrder[];
  loading: boolean;
  error:   string | null;
}

export function useDeliveryHistory(): DeliveryHistoryResult {
  const [orders,  setOrders]  = useState<DeliveryHistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiInstance
      .get<{ orders: DeliveryHistoryOrder[] }>("db/mandeliveryOrders/history")
      .then((res) => {
        if (!cancelled) setOrders(res.data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(i18n.t("error.loadOrdersFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { orders, loading, error };
}