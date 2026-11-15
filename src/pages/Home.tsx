/**
 * Dashboard home overview.
 *
 * FIXES:
 *  - isDeficiencyModal typed as boolean | undefined → initialised to false.
 *  - addEventListener → window.addEventListener (consistent with cleanup).
 *  - Switched from bare getDeficiencies() to useDeficiencies() hook so
 *    loading and error states are available.
 *  - Error banners shown for both orders and deficiencies fetch failures.
 *  - useOrders loading + error now destructured and used.
 */
import React, { useEffect, useState } from "react";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import "../styles/DbHome.css";
import { FaSortAmountDown, FaWpforms } from "react-icons/fa";
import { useOrders, type DashboardOrder } from "../server/orders";
import { IoWarning } from "react-icons/io5";
import { MdOutlineFileDownloadDone } from "react-icons/md";
import { AnimatePresence } from "framer-motion";
import { useDeficiencies, type Deficiency } from "../server/deficiencies";
import { useLangContext } from "../contexts/LanguageContext";
import EmptyState from "../components/EmptyState";
import { showToast } from "@/utils/toast";
import { goToNewBlank } from "@/utils/navigation";
import { selectedLang } from "@/utils/i18n";
import { showDeficienciesDesktopTable, showDeficienciesPhoneTable } from "@/components/tables/DeficienciesTable";
import { showDesktopTable, showPhoneTable } from "@/components/tables/OrdersTable";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import Modals from "@/components/modals/ModalSwitcher";

const DBHome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentLang } = useLangContext();

  const {
    remainingOrders,
    loading:  ordersLoading,
    error:    ordersError,
  } = useOrders();

  const {
    deficiencies,
    loading:  deficienciesLoading,
    error:    deficienciesError,
  } = useDeficiencies();

  const [isExpanded, setIsExpanded] = useState<{ orders: boolean; deficiencies: boolean }>({
    orders: false,
    deficiencies: false,
  });

  const [targetedDeficiency,  setTargetedDeficiency]  = useState<Deficiency>();
  // FIX: was useState<boolean>() → boolean | undefined. Now initialised to false.
  const [isDeficiencyModal,   setIsDeficiencyModal]   = useState<boolean>(false);
  const [isPhoneTable,        setIsPhoneTable]        = useState<boolean>(false);

  useEffect(() => {
    // FIX: use window.addEventListener to be consistent with the cleanup call
    const handleResize = () => setIsPhoneTable(window.innerWidth <= 650);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const deficiencyOnClick = (ord: Deficiency) => {
    setTargetedDeficiency(ord);
    setIsDeficiencyModal(true);
  };

  const orderExceptions = [
    <IoWarning color="red" size={25} />,
    <MdOutlineFileDownloadDone color="green" size={25} />,
  ];
  const orderStatus = [
    <span className="db-status-pill db-status-pill--warning">{t("admin.orders.waiting")}</span>,
    <span className="db-status-pill db-status-pill--success">{t("admin.orders.done")}</span>,
  ];

  const orderOnClick = (ord: DashboardOrder) => {
    goToNewBlank(`/OrderDetails/${ord.order_id}`)
  };

  const processOrder = (ord: DashboardOrder) => {
    if (ord.exception) {
      showToast(t("admin.deficiency.message"), "warning");
    } else {
      orderOnClick(ord);
    }
  };

  const toggleExpand = (key: string) => {
    setIsExpanded((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <>
      <Sidebar />
      <div className={`db-home ${selectedLang(currentLang) === "ar" && "rtl"}`}>
        <DbHeader />
        <hr />

        {/* ── Remaining orders ─────────────────────────────────────────── */}
        <div className="fw-bold d-flex justify-content-between me-2 my-3">
          <span>
            <FaWpforms className="m-3" size={20} />
            {t("admin.orders.remaining")}
          </span>
          <a href="/Orders" onClick={(e) => { e.preventDefault(); navigate("/Orders"); }}>
            {t("admin.orders.showAll")}
          </a>
        </div>

        {/* Error banner for orders */}
        {ordersError && (
          <div className="alert alert-danger mx-2" role="alert">
            {ordersError}
          </div>
        )}

        {ordersLoading ? (
          <Loading message={t("ui.loading")} />
        ) : remainingOrders.length > 0 ? (
          <>
            {isPhoneTable
              ? showPhoneTable(remainingOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.orders)
              : showDesktopTable(remainingOrders, t, orderStatus, orderExceptions, processOrder, isExpanded.orders, selectedLang(currentLang))}
            {remainingOrders.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => toggleExpand("orders")}>
                  {!isExpanded.orders
                    ? `${t("product.readMore")} (+ ${remainingOrders.length - 3})`
                    : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          !ordersError && <EmptyState message={t("admin.orders.noRemaining")} />
        )}

        <hr />

        {/* ── Deficiencies ─────────────────────────────────────────────── */}
        <div className="fw-bold me-2 my-3 d-flex justify-content-between">
          <span>
            <FaSortAmountDown className="m-3" size={20} />
            {t("admin.deficiency.title")}
          </span>
          <a href="/Deficiency" onClick={(e) => { e.preventDefault(); navigate("/Deficiency"); }}>{t("admin.deficiency.showAll")}</a>
        </div>

        {/* Error banner for deficiencies */}
        {deficienciesError && (
          <div className="alert alert-danger mx-2" role="alert">
            {deficienciesError}
          </div>
        )}

        {deficienciesLoading ? (
          <Loading message={t("ui.loading")} />
        ) : deficiencies.length > 0 ? (
          <>
            {isPhoneTable
              ? showDeficienciesPhoneTable(deficiencies, t, deficiencyOnClick, isExpanded.deficiencies)
              : showDeficienciesDesktopTable(deficiencies, t, deficiencyOnClick, isExpanded.deficiencies)}
            {deficiencies.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => toggleExpand("deficiencies")}>
                  {!isExpanded.deficiencies
                    ? `${t("product.readMore")} (+ ${deficiencies.length - 3})`
                    : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          !deficienciesError && <EmptyState message={t("admin.deficiency.noFound")} />
        )}
      </div>

      <AnimatePresence mode="wait">
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isDeficiencyModal && targetedDeficiency && (
          <Modals
            message={undefined}
            cible="deficiencies"
            onBack={() => setIsDeficiencyModal(false)}
            item={targetedDeficiency}
          />
        )}
      </AnimatePresence>

    </>
  );
};

export default DBHome;
