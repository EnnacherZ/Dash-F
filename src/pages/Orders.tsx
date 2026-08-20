/**
 * dashboard/pages/Orders.tsx
 *
 * FIXES:
 *  - Section heading for waitingDeliveryOrders was t('admin.orders.delivered')
 *    (duplicate). Changed to t('admin.orders.waitingDelivery').
 *  - "All orders" empty state was using t('admin.orders.noRemaining') — changed
 *    to t('admin.orders.noOrders').
 *  - error state from useOrders is now surfaced as an alert banner.
 *  - loading state used per-section so each section shows its own spinner.
 *  - addEventListener/removeEventListener both use window explicitly.
 *  - isDeficiencyModal (unused here) removed. isOrdModal initialised to false.
 */
import React, { useEffect, useState } from "react";
import Sidebar from "@/layout/Sidebar";
import { useLangContext } from "../contexts/LanguageContext";
import DbHeader from "@/layout/DbHeader";
import { FaWpforms } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { useOrders } from "../server/orders";
import { IoWarning } from "react-icons/io5";
import { MdOutlineFileDownloadDone } from "react-icons/md";
import { ToastContainer } from "react-toastify";
import EmptyState from "../components/EmptyState";
import { AnimatePresence } from "framer-motion";
import { goToNewBlank } from "@/utils/navigation";
import { selectedLang } from "@/utils/i18n";
import { showDesktopTable, showPhoneTable } from "@/components/tables/OrdersTable";
import Loading from "../components/loading";
import apiInstance from "@/lib/api";
import { showToast } from "@/utils/toast";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { DashboardOrder } from "../server/orders";
import { useAuth } from "../contexts/Authentication";

const Orders: React.FC = () => {
  const { t } = useTranslation();
  const { currentLang } = useLangContext();
  const { user } = useAuth();
  const {
    remainingOrders,
    allOrders,
    deliveredOrders,
    waitingDeliveryOrders,
    loading,
    error,
    refetch,
  } = useOrders();

  const [isExpanded, setIsExpanded] = useState<{
    remaining: boolean;
    delivered: boolean;
    all: boolean;
    waitingDelivery: boolean;
  }>({ waitingDelivery: false, remaining: false, delivered: false, all: false });

  const [isPhoneTable,  setIsPhoneTable]  = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<DashboardOrder | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const canDeleteOrders = user?.role === "admin" || user?.role === "manager";
  const deletingOrderId = isDeletingOrder ? orderToDelete?.id : undefined;

  useEffect(() => {
    // FIX: use window.addEventListener consistently (not bare addEventListener)
    const handleResize = () => setIsPhoneTable(window.innerWidth <= 650);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const orderExceptions = [
    <IoWarning color="red" size={25} />,
    <MdOutlineFileDownloadDone color="green" size={25} />,
  ];
  const orderStatus = [
    <span className="db-status-pill db-status-pill--warning">{t("admin.orders.waiting")}</span>,
    <span className="db-status-pill db-status-pill--success">{t("admin.orders.done")}</span>,
  ];

  const toggleExpand = (key: string) => {
    setIsExpanded((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const processOrder = (ord: DashboardOrder) => {
    goToNewBlank(`/OrderDetails/${ord.order_id}`)
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      // Dashboard deletion is implemented as a recoverable archive so order
      // lines, stock accounting, and customer history remain intact.
      await apiInstance.patch(`db/orders/manager/${orderToDelete.id}/archive/`);
      showToast(t("admin.orders.deleteSuccess"), "success");
      setOrderToDelete(null);
      refetch();
    } catch {
      showToast(t("admin.orders.deleteFailed"), "error");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // ── Error banner ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Sidebar />
        <div className={`db-deficiency ${selectedLang(currentLang) === "ar" && "rtl"}`}>
          <DbHeader />
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className={`db-deficiency ${selectedLang(currentLang) === "ar" && "rtl"}`}>
        <DbHeader />
        <hr />

        {/* ── Remaining orders ─────────────────────────────────────────── */}
        <div className="fw-bold my-4">
          <FaWpforms className="me-3" size={20} />
          {t("admin.orders.remaining")}
        </div>
        {loading ? (
          <Loading message={t("ui.loading")} />
        ) : remainingOrders.length > 0 ? (
          <>
            {isPhoneTable
              ? showPhoneTable(remainingOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.remaining, canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)
              : showDesktopTable(remainingOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.remaining, selectedLang(currentLang), canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)}
            {remainingOrders.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => toggleExpand("remaining")}>
                  {!isExpanded.remaining
                    ? `${t("product.readMore")} (+ ${remainingOrders.length - 3})`
                    : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState message={t("admin.orders.noRemaining")} />
        )}

        <hr />

        {/* ── Waiting for delivery ─────────────────────────────────────── */}
        <div className="fw-bold my-3">
          <FaWpforms className="me-3" size={20} />
          {/* FIX: was t('admin.orders.delivered') — wrong duplicate label */}
          {t("admin.orders.waitingDelivery")}
        </div>
        {loading ? (
          <Loading message={t("ui.loading")} />
        ) : waitingDeliveryOrders.length > 0 ? (
          <>
            {isPhoneTable
              ? showPhoneTable(waitingDeliveryOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.waitingDelivery, canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)
              : showDesktopTable(waitingDeliveryOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.waitingDelivery, selectedLang(currentLang), canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)}
            {waitingDeliveryOrders.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => toggleExpand("waitingDelivery")}>
                  {!isExpanded.waitingDelivery
                    ? `${t("product.readMore")} (+ ${waitingDeliveryOrders.length - 3})`
                    : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState message={t("admin.orders.noWaitingDelivery")} />
        )}

        <hr />

        {/* ── Delivered orders ─────────────────────────────────────────── */}
        <div className="fw-bold my-3">
          <FaWpforms className="me-3" size={20} />
          {t("admin.orders.delivered")}
        </div>
        {loading ? (
          <Loading message={t("ui.loading")} />
        ) : deliveredOrders.length > 0 ? (
          <>
            {isPhoneTable
              ? showPhoneTable(deliveredOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.delivered, canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)
              : showDesktopTable(deliveredOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.delivered, selectedLang(currentLang), canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)}
            {deliveredOrders.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => toggleExpand("delivered")}>
                  {!isExpanded.delivered
                    ? `${t("product.readMore")} (+ ${deliveredOrders.length - 3})`
                    : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState message={t("admin.orders.noDelivered")} />
        )}

        <hr />

        {/* ── All orders ───────────────────────────────────────────────── */}
        <div className="fw-bold my-3">
          <FaWpforms className="me-3" size={20} />
          {t("admin.orders.all")}
        </div>
        {loading ? (
          <Loading message={t("ui.loading")} />
        ) : allOrders.length > 0 ? (
          <>
            {isPhoneTable
              ? showPhoneTable(allOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.all, canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)
              : showDesktopTable(allOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.all, selectedLang(currentLang), canDeleteOrders ? setOrderToDelete : undefined, deletingOrderId)}
            {allOrders.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => toggleExpand("all")}>
                  {!isExpanded.all
                    ? `${t("product.readMore")} (+ ${allOrders.length - 3})`
                    : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          // FIX: was t('admin.orders.noRemaining') — wrong key for this section
          <EmptyState message={t("admin.orders.noOrders")} />
        )}
      </div>

      <AnimatePresence mode="wait">
      </AnimatePresence>
      <ConfirmDeleteModal
        open={orderToDelete !== null}
        title={t("admin.orders.deleteTitle")}
        message={t("admin.orders.deleteWarning")}
        itemLabel={orderToDelete ? `#${orderToDelete.order_id}` : undefined}
        confirmLabel={t("admin.orders.delete")}
        cancelLabel={t("ui.cancel")}
        loading={isDeletingOrder}
        onConfirm={deleteOrder}
        onClose={() => setOrderToDelete(null)}
      />
      <ToastContainer />
    </>
  );
};

export default Orders;
