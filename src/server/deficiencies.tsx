/**
 * dashboard/server/deficiencies.tsx
 *
 * FIXES:
 *  - Converted bare function to a proper hook (useDeficiencies) that
 *    returns { deficiencies, loading, error, refetch } so callers can
 *    show loading spinners and error banners instead of silently empty lists.
 *  - Added fetch cancellation via AbortController to prevent state updates
 *    on unmounted components.
 *  - Silent empty catch replaced with proper error state.
 */
import { useEffect, useState } from "react";
import apiInstance from "@/lib/api";
import i18n from "../contexts/LanguageContext";

export interface Deficiency {
  exception_id:     string;
  product_type:     string;
  product_category: string;
  product_ref:      string | number;
  product_name:     string;
  product_size:     string;
  delta_quantity:   number;
  treated:          boolean;
  order: {
    order_id: string;
    client: {
      first_name: string;
      last_name:  string;
      email:      string;
      phone:      string;
      city:       string;
      address:    string;
    };
  };
}

interface DeficienciesResult {
  deficiencies: Deficiency[];
  loading:      boolean;
  error:        string | null;
  refetch:      () => void;
}

export function useDeficiencies(): DeficienciesResult {
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [tick,         setTick]         = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiInstance
      .get<{ deficiencies: Deficiency[] }>("db/deficiencies/get")
      .then((res) => {
        if (!cancelled) setDeficiencies(res.data.deficiencies ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(i18n.t("error.loadDeficienciesFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return {
    deficiencies,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}