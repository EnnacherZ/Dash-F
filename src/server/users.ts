/**
 * dashboard/server/users.ts
 *
 * Data-fetching hook for dashboard user lookups (currently just the
 * delivery-men list used by the "assign delivery man" picker in
 * OrderDetails).
 */
import { useEffect, useState } from "react";
import apiInstance from "@/lib/api";
import i18n from "../contexts/LanguageContext";

export interface DeliveryMan {
  username:   string;
  first_name: string;
  last_name:  string;
}

interface DeliveryMenResult {
  deliveryMen: DeliveryMan[];
  loading:     boolean;
  error:       string | null;
}

export function useDeliveryMen(): DeliveryMenResult {
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiInstance
      .get<{ deliveryMen: DeliveryMan[] }>("db/users/deliverymen/get")
      .then((res) => {
        if (!cancelled) setDeliveryMen(res.data.deliveryMen ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(i18n.t("error.loadDeliveryMenFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { deliveryMen, loading, error };
}
