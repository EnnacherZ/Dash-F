import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { FaCheck, FaPen, FaPlus, FaTag, FaTrash, FaXmark } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import apiInstance from "@/lib/api";
import { useLangContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/Authentication";
import { selectedLang } from "@/utils/i18n";
import "@/styles/promotions.css";
import { showToast } from "@/utils/toast";

type DiscountType = "percentage" | "fixed";

interface PromotionCode {
  id: number;
  code: string;
  discount_type: DiscountType;
  value: number;
  minimum_order_amount: number;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PromotionForm {
  code: string;
  discount_type: DiscountType;
  value: string;
  minimum_order_amount: string;
  active: boolean;
  starts_at: string;
  expires_at: string;
}

const EMPTY_FORM: PromotionForm = {
  code: "",
  discount_type: "percentage",
  value: "",
  minimum_order_amount: "0",
  active: true,
  starts_at: "",
  expires_at: "",
};

const toLocalInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const apiError = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) return fallback;
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data) return fallback;
  const detail = data.detail ?? Object.values(data)[0];
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0] === "string") return detail[0];
  return fallback;
};

const Promotions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLang } = useLangContext();
  const [promotions, setPromotions] = useState<PromotionCode[]>([]);
  const [form, setForm] = useState<PromotionForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPromotions = useCallback(async () => {
    try {
      const response = await apiInstance.get<PromotionCode[]>("db/promotions/");
      setPromotions(response.data);
    } catch (error) {
      showToast(apiError(error, t("promoAdmin.loadError")), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user?.role === "delivery") {
      navigate("/Home", { replace: true });
      return;
    }
    void loadPromotions();
  }, [loadPromotions, navigate, user?.role]);

  const activeCount = useMemo(
    () => promotions.filter((promotion) => promotion.active).length,
    [promotions],
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const editPromotion = (promotion: PromotionCode) => {
    setEditingId(promotion.id);
    setForm({
      code: promotion.code,
      discount_type: promotion.discount_type,
      value: String(promotion.value),
      minimum_order_amount: String(promotion.minimum_order_amount),
      active: promotion.active,
      starts_at: toLocalInput(promotion.starts_at),
      expires_at: toLocalInput(promotion.expires_at),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savePromotion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.value) {
      showToast(t("promoAdmin.required"), "warning");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      minimum_order_amount: Number(form.minimum_order_amount || 0),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    try {
      if (editingId) {
        await apiInstance.patch(`db/promotions/${editingId}/`, payload);
        showToast(t("promoAdmin.updated"), "success");
      } else {
        await apiInstance.post("db/promotions/", payload);
        showToast(t("promoAdmin.created"), "success");
      }
      resetForm();
      await loadPromotions();
    } catch (error) {
      showToast(apiError(error, t("promoAdmin.saveError")), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promotion: PromotionCode) => {
    try {
      const response = await apiInstance.patch<PromotionCode>(`db/promotions/${promotion.id}/`, {
        active: !promotion.active,
      });
      setPromotions((current) => current.map((item) => (
        item.id === promotion.id ? response.data : item
      )));
      showToast(t(response.data.active ? "promoAdmin.activated" : "promoAdmin.deactivated"), "success");
    } catch (error) {
      showToast(apiError(error, t("promoAdmin.saveError")), "error");
    }
  };

  const deletePromotion = async (id: number) => {
    try {
      await apiInstance.delete(`db/promotions/${id}/`);
      setPromotions((current) => current.filter((promotion) => promotion.id !== id));
      setDeletingId(null);
      if (editingId === id) resetForm();
      showToast(t("promoAdmin.deleted"), "success");
    } catch (error) {
      showToast(apiError(error, t("promoAdmin.deleteError")), "error");
    }
  };

  const statusFor = (promotion: PromotionCode) => {
    const now = Date.now();
    if (!promotion.active) return "inactive";
    if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) return "scheduled";
    if (promotion.expires_at && new Date(promotion.expires_at).getTime() <= now) return "expired";
    return "active";
  };

  return (
    <>
      <Sidebar />
      <div className={`db-home promotions-page ${selectedLang(currentLang) === "ar" ? "rtl" : ""}`}>
        <DbHeader />
        <main className="promotions-content">
          <header className="promotions-hero">
            <div>
              <span className="promotions-eyebrow">{t("promoAdmin.eyebrow")}</span>
              <h1><FaTag /> {t("promoAdmin.title")}</h1>
              <p>{t("promoAdmin.description")}</p>
            </div>
            <div className="promotions-stats">
              <span><strong>{promotions.length}</strong>{t("promoAdmin.total")}</span>
              <span><strong>{activeCount}</strong>{t("promoAdmin.activeCount")}</span>
            </div>
          </header>

          <div className="promotions-grid">
            <form className="promotion-form-card" onSubmit={savePromotion}>
              <div className="promotion-card-heading">
                <span className="promotion-card-icon"><FaPlus /></span>
                <div>
                  <h2>{t(editingId ? "promoAdmin.editTitle" : "promoAdmin.createTitle")}</h2>
                  <p>{t("promoAdmin.formHint")}</p>
                </div>
              </div>

              <label>{t("promoAdmin.code")}
                <input value={form.code} maxLength={40} autoComplete="off"
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                  placeholder="WELCOME10" required />
              </label>
              <div className="promotion-form-row">
                <label>{t("promoAdmin.type")}
                  <select value={form.discount_type}
                    onChange={(event) => setForm({ ...form, discount_type: event.target.value as DiscountType })}>
                    <option value="percentage">{t("promoAdmin.percentage")}</option>
                    <option value="fixed">{t("promoAdmin.fixed")}</option>
                  </select>
                </label>
                <label>{t("promoAdmin.value")}
                  <div className="promotion-value-input">
                    <input type="number" min="0.01" max={form.discount_type === "percentage" ? 100 : undefined}
                      step="0.01" value={form.value}
                      onChange={(event) => setForm({ ...form, value: event.target.value })} required />
                    <span>{form.discount_type === "percentage" ? "%" : "MAD"}</span>
                  </div>
                </label>
              </div>
              <label>{t("promoAdmin.minimum")}
                <input type="number" min="0" step="0.01" value={form.minimum_order_amount}
                  onChange={(event) => setForm({ ...form, minimum_order_amount: event.target.value })} />
              </label>
              <div className="promotion-form-row">
                <label>{t("promoAdmin.starts")}
                  <input type="datetime-local" value={form.starts_at}
                    onChange={(event) => setForm({ ...form, starts_at: event.target.value })} />
                </label>
                <label>{t("promoAdmin.expires")}
                  <input type="datetime-local" value={form.expires_at}
                    onChange={(event) => setForm({ ...form, expires_at: event.target.value })} />
                </label>
              </div>
              <label className="promotion-active-toggle">
                <input type="checkbox" checked={form.active}
                  onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                <span>{t("promoAdmin.enableNow")}</span>
              </label>
              <div className="promotion-form-actions">
                <button type="submit" className="promotion-primary" disabled={saving}>
                  <FaCheck /> {saving ? t("promoAdmin.saving") : t(editingId ? "promoAdmin.saveChanges" : "promoAdmin.create")}
                </button>
                {editingId && <button type="button" className="promotion-secondary" onClick={resetForm}><FaXmark /> {t("promoAdmin.cancel")}</button>}
              </div>
            </form>

            <section className="promotion-list-card">
              <div className="promotion-list-heading">
                <div><h2>{t("promoAdmin.listTitle")}</h2><p>{t("promoAdmin.listHint")}</p></div>
              </div>
              {loading ? <div className="promotion-empty">{t("promoAdmin.loading")}</div>
                : promotions.length === 0 ? <div className="promotion-empty"><FaTag /><strong>{t("promoAdmin.empty")}</strong><span>{t("promoAdmin.emptyHint")}</span></div>
                : <div className="promotion-list">
                  {promotions.map((promotion) => {
                    const status = statusFor(promotion);
                    return <article className="promotion-row" key={promotion.id}>
                      <div className="promotion-row-main">
                        <div className="promotion-code">{promotion.code}</div>
                        <span className={`promotion-status promotion-status--${status}`}>{t(`promoAdmin.status.${status}`)}</span>
                        <strong className="promotion-amount">
                          {promotion.discount_type === "percentage" ? `${promotion.value}%` : `${promotion.value.toFixed(2)} MAD`}
                        </strong>
                      </div>
                      <div className="promotion-row-meta">
                        <span>{t("promoAdmin.minimumShort")}: {promotion.minimum_order_amount.toFixed(2)} MAD</span>
                        <span>{promotion.expires_at ? `${t("promoAdmin.until")} ${new Date(promotion.expires_at).toLocaleDateString()}` : t("promoAdmin.noExpiry")}</span>
                      </div>
                      <div className="promotion-row-actions">
                        <button className="promotion-toggle" onClick={() => void toggleActive(promotion)}>
                          {t(promotion.active ? "promoAdmin.deactivate" : "promoAdmin.activate")}
                        </button>
                        <button aria-label={t("promoAdmin.edit")} onClick={() => editPromotion(promotion)}><FaPen /></button>
                        {deletingId === promotion.id ? <div className="promotion-delete-confirm">
                          <span>{t("promoAdmin.confirmDelete")}</span>
                          <button className="promotion-delete-yes" onClick={() => void deletePromotion(promotion.id)}>{t("promoAdmin.yes")}</button>
                          <button onClick={() => setDeletingId(null)}>{t("promoAdmin.no")}</button>
                        </div> : <button className="promotion-delete" aria-label={t("promoAdmin.delete")} onClick={() => setDeletingId(promotion.id)}><FaTrash /></button>}
                      </div>
                    </article>;
                  })}
                </div>}
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default Promotions;
