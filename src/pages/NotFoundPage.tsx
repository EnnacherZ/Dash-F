/**
 * pages/NotFoundPage.tsx
 *
 * FIX: App.tsx's router had no catch-all ("*") route at all. Navigating to
 * any unregistered URL (a typo, an old bookmark, or — previously — the
 * broken /Shoe, /Sandal, /Shirt, /Pant links in the mobile sidebar) rendered
 * a completely blank page with no feedback whatsoever, since react-router
 * silently renders nothing when no route matches.
 *
 * This page is now wired up in App.tsx as the "*" route and reuses the
 * already-translated (but previously unused) error.pageNotFound key.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import { selectedLang } from "@/utils/i18n";
import { useLangContext } from "../contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLang } = useLangContext();
  const navigate = useNavigate();

  return (
    <>
      <Sidebar />
      <div className={`db-home ${selectedLang(currentLang) === "ar" && "rtl"}`}>
        <DbHeader />
        <div className="d-flex flex-column align-items-center justify-content-center fs-3 fw-bold" style={{ minHeight: "60vh", gap: "1rem" }}>
          <span>{t('error.pageNotFound')}</span>
          <button className="btn btn-primary" onClick={() => navigate('/Home')}>
            {t('nav.home')}
          </button>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
