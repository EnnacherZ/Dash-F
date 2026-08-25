/**
 * dashboard/pages/Deficiencies.tsx
 *
 * FIXES:
 *  - Switched from bare getDeficiencies() to useDeficiencies() hook so
 *    loading and error states are available and surfaced to the user.
 *  - isDeficiencyModal initialised to false (was boolean | undefined).
 *  - window.addEventListener used consistently (was bare addEventListener).
 */
import React, { useEffect, useState } from "react";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import "../styles/deficiency.css";
import { FaSortAmountDown } from "react-icons/fa";
import { useDeficiencies, type Deficiency } from "../server/deficiencies";
import { useLangContext } from "../contexts/LanguageContext";
import EmptyState from "../components/EmptyState";
import { selectedLang } from "@/utils/i18n";
import { showDeficienciesDesktopTable, showDeficienciesPhoneTable } from "@/components/tables/DeficienciesTable";
import { AnimatePresence } from "framer-motion";
import Modals from "@/components/modals/ModalSwitcher";
import { useTranslation } from "react-i18next";
import Loading from "../components/Loading";
import { ToastContainer } from "react-toastify";

const ExceptionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLang } = useLangContext();
  const { deficiencies, loading, error } = useDeficiencies();

  const [isExpanded,        setIsExpanded]        = useState<boolean>(false);
  const [targetedItem,      setTargetedItem]       = useState<Deficiency>();
  // FIX: was useState<boolean>() → boolean | undefined
  const [isDeficiencyModal, setIsDeficiencyModal]  = useState<boolean>(false);
  const [isPhoneTable,      setIsPhoneTable]       = useState<boolean>(false);

  useEffect(() => {
    // FIX: use window.addEventListener to match the cleanup call
    const handleResize = () => setIsPhoneTable(window.innerWidth <= 650);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const processDeficiency = (ord: Deficiency) => {
    setTargetedItem(ord);
    setIsDeficiencyModal(true);
  };

  return (
    <>
      <Sidebar />
      <div className={`db-deficiency ${selectedLang(currentLang) === "ar" && "rtl"}`}>
        <DbHeader />
        <div className="fw-bold my-4">
          <FaSortAmountDown className="me-3" size={20} />
          {t("admin.deficiency.title")}
        </div>

        {/* Error banner */}
        {error && (
          <div className="alert alert-danger mx-2" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <Loading message={t("ui.loading")} />
        ) : deficiencies.length > 0 ? (
          <>
            {isPhoneTable
              ? showDeficienciesPhoneTable(deficiencies, t, processDeficiency, isExpanded)
              : showDeficienciesDesktopTable(deficiencies, t, processDeficiency, isExpanded)}
            {deficiencies.length > 3 && (
              <div className="orders-expansion text-center m-1 d-flex justify-content-center">
                <button className="btn btn-outline-primary" onClick={() => setIsExpanded(!isExpanded)}>
                  {!isExpanded ? t("product.readMore") : t("product.readLess")}
                </button>
              </div>
            )}
          </>
        ) : (
          !error && <EmptyState message={t("admin.deficiency.noFound")} />
        )}
      </div>

      <AnimatePresence mode="wait">
        {isDeficiencyModal && targetedItem && (
          <Modals
            message={undefined}
            cible="deficiencies"
            onBack={() => setIsDeficiencyModal(false)}
            item={targetedItem}
          />
        )}
      </AnimatePresence>

      <ToastContainer />
    </>
  );
};

export default ExceptionsPage;
