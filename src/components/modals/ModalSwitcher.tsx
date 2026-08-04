/**
 * src/components/modals/ModalSwitcher.tsx
 *
 * FIX: processDeficiency posted to `db/deficiencies/processDeficiency`
 *      but the backend route is `db/deficiencies/process`.
 *      URL corrected on line marked with // FIX.
 *
 * FIX: isSP and isLoading initialised to false (was undefined → boolean | undefined).
 */
import React, { useLayoutEffect, useState } from "react";
import ModalBackDrop from "./modalBackdrop";
import { motion } from "framer-motion";
import "./modals.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaRegTrashAlt, FaSortAmountDown, FaUserAlt, FaWpforms } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useLangContext } from "@/contexts/LanguageContext";
import { Rings } from "react-loader-spinner";
import Loading from "@/components/loading";
import apiInstance from "@/lib/api";
import { dropIn } from "@/utils/motion";
import { goToNewBlank } from "@/utils/navigation";
import { selectedLang } from "@/utils/i18n";
import { showToast } from "@/utils/toast";

const connecter = apiInstance;

const ModalSwitcher: React.FC<{
  cible: string;
  message: string | undefined;
  onBack: () => void;
  item: any;
  onDelete: (() => void) | undefined;
}> = ({ cible, onBack, item, onDelete, message }) => {
  const { t } = useTranslation();
  const { currentLang } = useLangContext();
  const [isSP,       setIsSP]       = useState<boolean>(false);
  const [isLoading,  setIsLoading]  = useState<boolean>(false);

  useLayoutEffect(() => {
    setIsSP(window.innerWidth < 600);
  }, []);

  const handleOnDelete = () => {
    if (onDelete) { onDelete(); onBack(); }
  };

  const processDeficiency = async () => {
    setIsLoading(true);
    try {
      // FIX: was `db/deficiencies/processDeficiency` — backend route is `db/deficiencies/process`
      const response = await connecter.post("db/deficiencies/process", {
        exceptionID: item.exception_id,
        orderID:     item.order.order_id,
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

  return (
    <div className={selectedLang(currentLang) === "ar" ? "rtl" : ""}>
      <ModalBackDrop onClose={() => {}} onOpen={true}>
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
            <div className="db modals orders card shadow">
              {isLoading ? (
                <Loading message={t("ui.loading")} />
              ) : (
                <>
                  <h4 className="m-3 fw-bold d-flex justify-content-center">
                    <FaUserAlt className="mx-2" />
                    {t("form.clientInfo")}
                  </h4>
                  <ul className="fw-bold modal-orders-client-infos">
                    <li className="m-2 my-3">
                      <span>{t("form.fullName")} :</span>
                      <span>{item.client.last_name + " " + item.client.first_name}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.email.label")} :</span>
                      <span>{item.client.email}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.phone.label")} :</span>
                      <span>{item.client.phone}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.address.label")} :</span>
                      <span>{item.client.address + " " + item.client.city}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("order.orderId")} :</span>
                      <span>{item.order_id}</span>
                    </li>
                  </ul>
                  <hr className="mx-2 my-2" />
                  <h4 className="m-3 fw-bold d-flex justify-content-center">
                    <FaWpforms className="mx-2" />
                    {t("admin.product.orderedProducts")}
                  </h4>
                  <div
                    style={{ maxHeight: "300px", overflowY: "auto", width: "98%", margin: "auto" }}
                    className="rounded shadow-sm"
                  >
                    {item.ordered_products.length > 0 && (
                      <table
                        className="table table-bordered orders-table rounded shadow-sm"
                        style={{ width: "98%", margin: "auto" }}
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
                          {Array.isArray(item.ordered_products) &&
                            item.ordered_products.map((ord: any, index: number) => (
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
                  <div className="orders-actions-buttons m-3 d-flex justify-content-end">
                    <button
                      className="btn btn-warning mx-2"
                      onClick={() => { goToNewBlank(`/OrderDetails/${item.order_id}`); onBack(); }}
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
            <div className="db modals orders card shadow">
              {isLoading ? (
                <Loading message={t("ui.loading")} />
              ) : (
                <>
                  <h4 className="m-3 fw-bold d-flex justify-content-center">
                    <FaUserAlt className="mx-2" />
                    {t("form.clientInfo")}
                  </h4>
                  <ul className="fw-bold modal-orders-client-infos">
                    <li className="m-2 my-3">
                      <span>{t("form.fullName")} :</span>
                      <span>{item.order.client.last_name + " " + item.order.client.first_name}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.email.label")} :</span>
                      <span>{item.order.client.email}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.phone.label")} :</span>
                      <span>{item.order.client.phone}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("form.address.label")} :</span>
                      <span>{item.order.client.address + " " + item.order.client.city}</span>
                    </li>
                    <li className="m-2 my-3">
                      <span>{t("order.orderId")} :</span>
                      <span>{item.order.order_id}</span>
                    </li>
                  </ul>
                  <hr className="mx-2 my-2" />
                  <h4 className="m-3 fw-bold d-flex justify-content-center">
                    <FaSortAmountDown className="mx-2" />
                    {t("admin.deficiency.title")}
                  </h4>
                  <div
                    style={{ maxHeight: "300px", overflowY: "auto", width: "98%", margin: "auto" }}
                    className="rounded shadow-sm"
                  >
                    <table
                      className="table table-bordered orders-table rounded shadow-sm"
                      style={{ width: "98%", margin: "auto" }}
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
                          <td>{item.product_type}</td>
                          <td>{item.product_category}</td>
                          <td>{item.product_ref}</td>
                          <td>{item.product_name}</td>
                          <td>{item.product_size}</td>
                          <td>{item.delta_quantity}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="orders-actions-buttons m-2 d-flex justify-content-end">
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

          {/* ── Delete confirmation modal ────────────────────────────────── */}
          <div className={`${cible === "db/delete" ? "card align-middle parentCartConfAll" : "d-none"}`}>
            <div
              className={`ms-3 fw-bold ${selectedLang(currentLang) === "ar" ? "rtl me-2" : ""}`}
              style={{ fontSize: 20, marginTop: "1%" }}
            >
              {t("confirm.deleteTitle")}
            </div>
            <hr />
            <div
              className={`mx-3 mt-1 ${selectedLang(currentLang) === "ar" ? "rtl me-2" : ""}`}
              style={{ fontSize: 16, marginTop: "1%" }}
            >
              {t("confirm.removeItem")}
            </div>
            <div
              className="align-bottom mt-4"
              style={{ display: "flex", justifyContent: "end", alignItems: "end", marginRight: "1%", marginBottom: "2%" }}
            >
              <span className="mx-2">
                <button className="btn btn-secondary" style={isSP ? { fontSize: 13 } : {}} onClick={onBack}>
                  <IoArrowBackOutline /> {t("confirm.cancelBack")}
                </button>
              </span>
              <span className="mx-2">
                <button className="btn btn-danger" style={isSP ? { fontSize: 13 } : {}} onClick={handleOnDelete}>
                  <FaRegTrashAlt /> {t("confirm.remove")}
                </button>
              </span>
            </div>
          </div>

          {/* ── Loading modal ────────────────────────────────────────────── */}
          <div className={`${cible === "loading" ? "card align-middle parentCartConfAll" : "d-none"}`}>
            <div
              className="flex-column"
              style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <Rings
                height="10em"
                width="10em"
                color="#0e92e4"
                ariaLabel="loading"
                wrapperStyle={{ justifyContent: "center", alignItems: "center" }}
              />
              <div className="loading-msg fs-3 fw-bold text-center mt-4">{message}</div>
            </div>
          </div>
        </motion.div>
      </ModalBackDrop>
    </div>
  );
};

export default ModalSwitcher;
