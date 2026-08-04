/**
 * src/pages/Newsletter.tsx
 *
 * Standalone newsletter management page.
 * Same layout shell as every other page: <Sidebar/> + <DbHeader/> + content.
 * Admin-only — non-admins are redirected to /Home.
 */

import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import "@/styles/settings.css";          // reuses .db-settings layout class
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { MdOutlineEmail } from "react-icons/md";
import { selectedLang } from "@/utils/i18n";
import { useLangContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/Authentication";
import apiInstance from "@/lib/api";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_subscribers: number;
  active_subscribers: number;
  unsubscribed: number;
  campaigns_sent: number;
}

interface Campaign {
  id: string;
  subject: string;
  preview_text: string;
  body_html: string;
  body_text: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
  sent_count: number;
  failed_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Campaign["status"], string> = {
  draft:     "secondary",
  scheduled: "info",
  sending:   "warning",
  sent:      "success",
  failed:    "danger",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
  });

const apiErr = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { detail?: string } } })
    ?.response?.data?.detail ?? fallback;

// ─── Stat Cards ───────────────────────────────────────────────────────────────

const StatsRow: React.FC<{ stats: Stats }> = ({ stats }) => {
  const { t } = useTranslation();

  const items = ([
    { label: t("newsletter.statTotal"),         value: stats.total_subscribers,  color: "primary"   },
    { label: t("newsletter.statActive"),        value: stats.active_subscribers, color: "success"   },
    { label: t("newsletter.statUnsubscribed"),  value: stats.unsubscribed,        color: "secondary" },
    { label: t("newsletter.statCampaignsSent"), value: stats.campaigns_sent,      color: "info"      },
  ] as const);

  return (
    <div className="row g-3 mb-4">
      {items.map(({ label, value, color }) => (
        <div className="col-6 col-md-3" key={label}>
          <div className={`card border-${color} text-center p-3 h-100 shadow-sm`}>
            <div className={`fw-bold fs-3 text-${color}`}>{value.toLocaleString()}</div>
            <div className="text-muted small mt-1">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Campaign Editor ──────────────────────────────────────────────────────────

const CampaignEditor: React.FC<{
  initial?: Partial<Campaign>;
  onSaved: (c: Campaign) => void;
  onCancel: () => void;
  onSentAll: () => void;
}> = ({ initial, onSaved, onCancel, onSentAll }) => {
  const { t } = useTranslation();

  const [subject,     setSubject]     = useState(initial?.subject      ?? "");
  const [preview,     setPreview]     = useState(initial?.preview_text ?? "");
  const [bodyHtml,    setBodyHtml]    = useState(initial?.body_html    ?? "");
  const [bodyText,    setBodyText]    = useState(initial?.body_text    ?? "");
  const [testEmail,   setTestEmail]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [sending,     setSending]     = useState(false);
  const [testSending, setTestSending] = useState(false);

  const isEdit = !!initial?.id;

  const handleSave = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error(t("newsletter.requiredFieldsCampaign"));
      return;
    }
    setSaving(true);
    try {
      const payload = { subject, preview_text: preview, body_html: bodyHtml, body_text: bodyText };
      const res = isEdit
        ? await apiInstance.patch<Campaign>(`db/newsletter/campaigns/${initial!.id}/`, payload)
        : await apiInstance.post<Campaign>("db/newsletter/campaigns/", payload);
      toast.success(isEdit ? t("newsletter.updated") : t("newsletter.draftSaved"));
      onSaved(res.data);
    } catch (err) {
      toast.error(apiErr(err, t("newsletter.genericError")));
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (test = false) => {
    if (!initial?.id) { toast.error(t("newsletter.saveFirst")); return; }
    test ? setTestSending(true) : setSending(true);
    try {
      const payload: Record<string, string> = { campaign_id: initial.id };
      if (test && testEmail) payload.test_email = testEmail;
      const res = await apiInstance.post<{ detail: string; sent: number; failed: number }>(
        "db/newsletter/campaigns/send/", payload
      );
      toast.success(
        t("newsletter.sendResult", { detail: res.data.detail, sent: res.data.sent, failed: res.data.failed })
      );
      if (!test) { onSentAll(); onCancel(); }
    } catch (err) {
      toast.error(apiErr(err, t("newsletter.genericError")));
    } finally {
      test ? setTestSending(false) : setSending(false);
    }
  };

  return (
    <div className="card p-4 mb-4 shadow-sm" style={{ borderLeft: "4px solid #0e92e4" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          {isEdit ? t("newsletter.editCampaign") : t("newsletter.newCampaignTitle")}
        </h6>
        <button className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
          {t("newsletter.closeBtn")}
        </button>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t("newsletter.subject")} *</label>
        <input type="text" className="form-control" value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("newsletter.subjectPlaceholder") as string} />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t("newsletter.previewText")}</label>
        <input type="text" className="form-control" value={preview}
          onChange={(e) => setPreview(e.target.value)}
          placeholder={t("newsletter.previewPlaceholder") as string} />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t("newsletter.bodyHtml")} *</label>
        <textarea className="form-control font-monospace"
          style={{ fontSize: 12, minHeight: 220 }}
          value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)}
          placeholder={t("newsletter.bodyHtmlPlaceholder") as string} />
        <div className="form-text">
          {t("newsletter.bodyHtmlHint")}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t("newsletter.bodyText")}</label>
        <textarea className="form-control" style={{ minHeight: 70 }}
          value={bodyText} onChange={(e) => setBodyText(e.target.value)}
          placeholder={t("newsletter.bodyTextPlaceholder") as string} />
      </div>

      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t("newsletter.saving") : isEdit ? t("newsletter.saveChanges") : t("newsletter.saveDraft")}
        </button>
        {isEdit && initial?.status !== "sent" && (
          <button className="btn btn-success" onClick={() => handleSend(false)} disabled={sending}>
            {sending ? t("newsletter.sending") : t("newsletter.sendToAll")}
          </button>
        )}
      </div>

      {isEdit && initial?.status !== "sent" && (
        <div className="d-flex gap-2 mt-3 pt-3 border-top">
          <input type="email" className="form-control form-control-sm"
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t("newsletter.testEmailPlaceholder") as string} />
          <button className="btn btn-sm btn-outline-secondary text-nowrap"
            onClick={() => handleSend(true)} disabled={testSending || !testEmail}>
            {testSending ? t("newsletter.sending") : t("newsletter.sendTest")}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Campaign Row ─────────────────────────────────────────────────────────────

const CampaignRow: React.FC<{
  campaign: Campaign;
  onEdit: (c: Campaign) => void;
  onDelete: (id: string) => void;
}> = ({ campaign: c, onEdit, onDelete }) => {
  const { t } = useTranslation();

  // Status badge label — pulled from the newsletter.status* keys rather
  // than relying on Bootstrap's text-capitalize on the raw status string,
  // so it's translated instead of just English-with-a-capital-letter.
  const statusLabel = t(`newsletter.status${c.status.charAt(0).toUpperCase()}${c.status.slice(1)}`);

  return (
    <div className="d-flex align-items-center gap-3 py-2 border-bottom flex-wrap">
      <div className="flex-fill" style={{ minWidth: 160 }}>
        <div className="fw-semibold">{c.subject}</div>
        <div className="text-muted small">
          {c.sent_at
            ? t("newsletter.sentOn", { date: fmt(c.sent_at), count: c.sent_count })
            : t("newsletter.createdOn", { date: fmt(c.created_at) })}
        </div>
      </div>
      <span className={`badge bg-${STATUS_STYLE[c.status]}`}>{statusLabel}</span>
      {c.status !== "sent" && (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(c)}>
            {t("newsletter.edit")}
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(c.id)}>
            {t("newsletter.delete")}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Newsletter: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentLang } = useLangContext();
  const navigate = useNavigate();

  const [stats,     setStats]     = useState<Stats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<Campaign | null>(null);
  const [showNew,   setShowNew]   = useState(false);
  const [view,      setView]      = useState<"stats" | "campaigns">("stats");

  // Admin guard
  useEffect(() => {
    if (user && user.role !== "admin") navigate("/Home");
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        apiInstance.get<Stats>("db/newsletter/stats/"),
        apiInstance.get<Campaign[]>("db/newsletter/campaigns/"),
      ]);
      setStats(sRes.data);
      setCampaigns(cRes.data);
    } catch {
      toast.error(t("newsletter.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaved = (campaign: Campaign) => {
    setCampaigns((prev) => {
      const idx = prev.findIndex((c) => c.id === campaign.id);
      return idx >= 0
        ? prev.map((c) => (c.id === campaign.id ? campaign : c))
        : [campaign, ...prev];
    });
    setSelected(campaign);
    setShowNew(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("newsletter.deleteConfirm") as string)) return;
    try {
      await apiInstance.delete(`db/newsletter/campaigns/${id}/`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success(t("newsletter.deleted"));
    } catch (err) {
      toast.error(apiErr(err, t("newsletter.genericError")));
    }
  };

  return (
    <>
      <Sidebar />
      <div className={`db-settings ${selectedLang(currentLang) === 'ar' ? 'rtl' : ''}`}>
        <DbHeader />
        <hr />

        {/* Page title */}
        <div className="Prod-manage-title m-4 fw-bold">
          <MdOutlineEmail size={20} />
          <span className="mx-3">{t('nav.newsletter')}</span>
        </div>

        <div className="mx-4">
          {/* Tab switcher */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${view === "stats" ? "active" : ""}`}
                onClick={() => setView("stats")}
              >
                📊 {t('newsletter.stats')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${view === "campaigns" ? "active" : ""}`}
                onClick={() => setView("campaigns")}
              >
                ✉️ {t('newsletter.campaigns')}
                {campaigns.length > 0 && (
                  <span className="badge bg-secondary ms-2">{campaigns.length}</span>
                )}
              </button>
            </li>
          </ul>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              {t('newsletter.loading')}
            </div>
          )}

          {/* Stats tab */}
          {!loading && view === "stats" && (
            stats
              ? <StatsRow stats={stats} />
              : <p className="text-muted small">{t('newsletter.noStats')}</p>
          )}

          {/* Campaigns tab */}
          {!loading && view === "campaigns" && (
            <>
              {!showNew && !selected && (
                <div className="mb-3">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setShowNew(true); setSelected(null); }}
                  >
                    + {t('newsletter.newCampaign')}
                  </button>
                </div>
              )}

              {(showNew || selected) && (
                <CampaignEditor
                  initial={selected ?? undefined}
                  onSaved={handleSaved}
                  onCancel={() => { setShowNew(false); setSelected(null); }}
                  onSentAll={loadData}
                />
              )}

              {campaigns.length === 0 ? (
                <div className="text-muted small text-center py-4">
                  {t('newsletter.noCampaignsYet')}
                </div>
              ) : (
                <div>
                  {campaigns.map((c) => (
                    <CampaignRow
                      key={c.id}
                      campaign={c}
                      onEdit={(camp) => { setSelected(camp); setShowNew(false); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Newsletter;
