/**
 * src/components/modals/ModalSwitcher.tsx
 *
 * Deficiency processing posts to the backend's canonical process route.
 *      but the backend route is `db/deficiencies/process`.
 *      URL corrected on line marked with // FIX.
 *
 * FIX: isSP and isLoading initialised to false (was undefined → boolean | undefined).
 */
import React, { useState } from "react";
import ModalBackDrop from "./ModalBackdrop";
import { motion } from "framer-motion";
import "./modals.css";
import { FaSortAmountDown, FaUserAlt, FaWpforms } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useLangContext } from "@/contexts/LanguageContext";
import { Rings } from "react-loader-spinner";
import Loading from "@/components/Loading";
import apiInstance from "@/lib/api";
import { dropIn } from "@/utils/motion";
import { goToNewBlank } from "@/utils/navigation";
import { selectedLang } from "@/utils/i18n";
import { showToast } from "@/utils/toast";
import type { DashboardOrder } from "@/server/orders";
import type { Deficiency } from "@/server/deficiencies";

const connecter = apiInstance;

const ModalSwitcher: React.FC<{
  cible: string;
  message: string | undefined;
  onBack: () => void;
  item: DashboardOrder | Deficiency;
}> = ({ cible, onBack, item, message }) => {
  const { t } = useTranslation();
  const { currentLang } = useLangContext();
  const [isLoading,  setIsLoading]  = useState<boolean>(false);
  const orderItem = item as DashboardOrder;
  const deficiencyItem = item as Deficiency;

  const processDeficiency = async () => {
    setIsLoading(true);
    try {
      // Keep this route aligned with dashboard/urls.py.
      const response = await connecter.post("db/deficiencies/process", {
        exceptionID: deficiencyItem.exception_id,
        orderID:     deficiencyItem.order.order_id,
      });
      if (response.status === 200) {
        showToast(t("admin.deficiency.success"), "success");
      }
    } catch {
      showToast(t("admin.deficiency.error"), "error");
    } finally {
      setIsLoading(false);
      onBack();
    }
  };

  const modalLabel = cible === "orders"
    ? t("order.details")
    : cible === "deficiencies"
      ? t("admin.deficiency.title")
      : message || t("ui.loading");

  return (
    <div className={selectedLang(currentLang) === "ar" ? "rtl" : ""}>
      <ModalBackDrop
        onClose={onBack}
        onOpen={true}
        dismissible={!isLoading && cible !== "loading"}
        size={cible === "orders" || cible === "deficiencies" ? "xl" : "sm"}
        label={modalLabel}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className=""
          variants={dropIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* ── Orders modal ─────────────────────────────────────────────── */}
          {cible === "orders" && (
            <div className="db modals orders">
              {isLoading ? (
                <Loading message={t("ui.loading")} />
              ) : (
                <>
                  <h4 className="modal-detail-title">
                    <FaUserAlt className="mx-2" />
                    {t("form.clientInfo")}
                  </h4>
                  <ul className="fw-bold modal-orders-client-infos">
                    <li className="m-2 my-3">
                      <span>{t("form.fullName")} :</span>
                      <span>{orderItem.client.last_name + " " + orderItem.client.first_name}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.email.label")} :</span>
                      <span>{orderItem.client.email}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.phone.label")} :</span>
                      <span>{orderItem.client.phone}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.address.label")} :</span>
                      <span>{orderItem.client.address + " " + orderItem.client.city}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("order.orderId")} :</span>
                      <span>{orderItem.order_id}</span>
                    </li>
                  </ul>
                  <hr className="modal-detail-divider" />
                  <h4 className="modal-detail-title">
                    <FaWpforms className="mx-2" />
                    {t("admin.product.orderedProducts")}
                  </h4>
                  <div className="modal-table-wrapper">
                    {orderItem.ordered_products.length > 0 && (
                      <table
                        className="table orders-table"
                      >
                        <thead>
                          <tr className="text-muted">
                            <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>{t("product.type")}</th>
                            <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>{t("product.category")}</th>
                            <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>{t("product.ref")}</th>
                            <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>{t("product.name")}</th>
                            <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>{t("product.size")}</th>
                            <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>{t("product.quantity")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(orderItem.ordered_products) &&
                            orderItem.ordered_products.map((ord, index) => (
                              <tr key={index}>
                                <td>{ord.product_type}</td>
                                <td>{ord.category}</td>
                                <td>{ord.ref}</td>
                                <td>{ord.name}</td>
                                <td>{ord.size}</td>
                                <td>{ord.quantity}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="orders-actions-buttons">
                    <button
                      className="btn btn-warning mx-2"
                      onClick={() => { goToNewBlank(`/OrderDetails/${orderItem.order_id}`); onBack(); }}
                    >
                      {t("order.details")}
                    </button>
                    <button className="btn btn-danger mx-2" onClick={onBack}>
                      {t("ui.back")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Deficiencies modal ───────────────────────────────────────── */}
          {cible === "deficiencies" && (
            <div className="db modals orders">
              {isLoading ? (
                <Loading message={t("ui.loading")} />
              ) : (
                <>
                  <h4 className="modal-detail-title">
                    <FaUserAlt className="mx-2" />
                    {t("form.clientInfo")}
                  </h4>
                  <ul className="fw-bold modal-orders-client-infos">
                    <li className="m-2 my-3">
                      <span>{t("form.fullName")} :</span>
                      <span>{deficiencyItem.order.client.last_name + " " + deficiencyItem.order.client.first_name}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.email.label")} :</span>
                      <span>{deficiencyItem.order.client.email}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.phone.label")} :</span>
                      <span>{deficiencyItem.order.client.phone}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.address.label")} :</span>
                      <span>{deficiencyItem.order.client.address + " " + deficiencyItem.order.client.city}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("order.orderId")} :</span>
                      <span>{deficiencyItem.order.order_id}</span>
                    </li>
                  </ul>
                  <hr className="modal-detail-divider" />
                  <h4 className="modal-detail-title">
                    <FaSortAmountDown className="mx-2" />
                    {t("admin.deficiency.title")}
                  </h4>
                  <div className="modal-table-wrapper">
                    <table
                      className="table orders-table"
                    >
                      <thead>
                        <tr className="text-muted">
                          <th>{t("product.type")}</th>
                          <th>{t("product.category")}</th>
                          <th>{t("product.ref")}</th>
                          <th>{t("product.name")}</th>
                          <th>{t("product.size")}</th>
                          <th>{t("admin.deficiency.quantityRequested")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{deficiencyItem.product_type}</td>
                          <td>{deficiencyItem.product_category}</td>
                          <td>{deficiencyItem.product_ref}</td>
                          <td>{deficiencyItem.product_name}</td>
                          <td>{deficiencyItem.product_size}</td>
                          <td>{deficiencyItem.delta_quantity}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="orders-actions-buttons">
                    <button className="btn btn-success mx-2" onClick={processDeficiency}>
                      {t("admin.deficiency.confirm")}
                    </button>
                    <button className="btn btn-danger mx-2" onClick={onBack}>
                      {t("ui.back")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Loading modal ────────────────────────────────────────────── */}
          {cible === "loading" && (
            <div className="modal-loading" role="status" aria-live="polite">
              <Rings
                height="7em"
                width="7em"
                color="#0e92e4"
                ariaLabel="loading"
                wrapperStyle={{ justifyContent: "center", alignItems: "center" }}
              />
              <div className="modal-loading__message">{message}</div>
            </div>
          )}
        </motion.div>
      </ModalBackDrop>
    </div>
  );
};

export default ModalSwitcher;
