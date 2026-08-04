/**
 * dashboard/pages/DeliveryPortal.tsx
 *
 * Dedicated landing page for the "delivery" role. AuthProvider renders this
 * in place of the normal router/sidebar shell for delivery accounts, so it
 * never mounts Home, Products, Deficiency, Statistics, Newsletter or
 * Settings — delivery drivers only ever see orders assigned to them.
 *
 * Layout: a branded header (store logo + hamburger) opens a slide-in
 * sidebar with the driver's profile, a "pending" / "past deliveries" view
 * switch, language, and sign-out (behind its own confirmation modal).
 * Pending orders: compact card -> full detail view (client info,
 * call/navigate, ordered products) -> "Confirm delivery" opens a checklist
 * modal. Past deliveries deliberately never show amounts — the backend
 * itself strips payment fields from that response, not just the UI.
 *
 * There's no react-router here (delivery accounts never mount the app's
 * router at all — see Authentication.tsx), so every view switch here is
 * local state, not a URL.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaTruck, FaUser, FaPhoneAlt, FaMapMarkedAlt, FaCheckCircle, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaEnvelope, FaHashtag, FaBoxOpen, FaMoneyBillWave,
  FaBars, FaTimes, FaHistory, FaGlobe, FaCalendarAlt, FaHome,
} from "react-icons/fa";
import logo from "@/assets/FIRDAOUS STORE.png";
import logoWhite from "@/assets/WHITE FIRDAOUS STORE.png";
import { useLangContext } from "@/contexts/LanguageContext";
import type { DashboardUser } from "@/contexts/Authentication";
import { useDeliveryManOrders, useDeliveryHistory, DashboardOrder, DeliveryHistoryOrder } from "@/server/orders";
import { selectedLang } from "@/utils/i18n";
import { getDate } from "@/utils/date";
import { showToast } from "@/utils/toast";
import { hideInfos } from "@/utils/general";
import apiInstance from "@/lib/api";
import Loading from "@/components/loading";
import EmptyState from "@/components/EmptyState";
import ModalBackdrop from "@/components/modals/modalBackdrop";
import "@/components/modals/modals-shared.css";
import "../styles/deliveryPortal.css";

type DeliveryView = "home" | "pending" | "history";

const LANGUAGE_OPTIONS = ["Français", "العربية", "English"] as const;

// Snappy spring in, quick accelerating tween out — a spring on the way out
// makes a drawer feel like it's dawdling to a stop instead of being dismissed.
const sidebarBackdropVariants = {
  hidden:  { opacity: 0, transition: { duration: 0.14, ease: "easeIn" } },
  visible: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
};
const sidebarDrawerVariants = {
  hidden: (isRtl: boolean) => ({
    x: isRtl ? "100%" : "-100%",
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  }),
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 520, damping: 40, mass: 0.7 },
  },
};

interface DeliveryPortalProps {
  user:     DashboardUser | null;
  signOut:  () => Promise<void>;
}

const DeliveryPortal: React.FC<DeliveryPortalProps> = ({ user, signOut }) => {
  const { t } = useTranslation();
  const { currentLang, setCurrentLang } = useLangContext();
  const { orders, loading, error, refetch } = useDeliveryManOrders();
  const { orders: historyOrders, loading: historyLoading, error: historyError } = useDeliveryHistory();
  const [view, setView] = useState<DeliveryView>("home");
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState<boolean>(false);
  const isRtl = selectedLang(currentLang) === "ar";

  const codOrders = orders.filter((o) => o.is_paid === "cod");
  const totalToCollect = codOrders.reduce((sum, o) => sum + o.amount, 0);
  const collectCurrency = codOrders[0]?.currency;

  const goToView = (next: DeliveryView) => {
    setSelectedOrder(null);
    setView(next);
    setIsSidebarOpen(false);
  };

  const confirmDelivery = async () => {
    if (!selectedOrder) return;
    setIsConfirming(true);
    try {
      await apiInstance.patch(`db/orders/confirmDelivery/${selectedOrder.id}/`);
      showToast(t("delivery.confirmSuccess"), "success");
      setIsConfirmOpen(false);
      setSelectedOrder(null);
      refetch();
    } catch {
      showToast(t("delivery.confirmError"), "error");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className={`dp-root ${isRtl ? "rtl" : ""}`}>
      <div className="dp-header">
        <div className="dp-header-row">
          {/* Menu button sits on the same side the sidebar slides out from
              (start edge — left in LTR, right in RTL), tight against the
              title it opens. Logo stands alone on the other side. */}
          <div className="dp-header-menu-group">
            <button
              type="button"
              className="dp-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label={t("delivery.menu")}
            >
              <FaBars />
            </button>
            <div>
              <div className="dp-header-title">{t("delivery.portalTitle")}</div>
              <div className="dp-header-tagline">{user?.first_name} {user?.last_name}</div>
            </div>
          </div>

          <img src={logoWhite} alt="" className="dp-header-logo" />
        </div>

        {!loading && (
          <div className="dp-header-stats">
            <div className="dp-header-stat">
              <div className="dp-header-stat-icon"><FaBoxOpen /></div>
              <div>
                <span className="dp-header-stat-value">{orders.length}</span>
                <span className="dp-header-stat-label">{t("delivery.pending")}</span>
              </div>
            </div>
            {totalToCollect > 0 && (
              <div className="dp-header-stat">
                <div className="dp-header-stat-icon"><FaMoneyBillWave /></div>
                <div>
                  <span className="dp-header-stat-value">{totalToCollect} {collectCurrency}</span>
                  <span className="dp-header-stat-label">{t("delivery.toCollect")}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {view === "home" ? (
        <DeliveryHome
          pendingCount={orders.length}
          pendingLoading={loading}
          toCollect={totalToCollect}
          collectCurrency={collectCurrency}
          historyCount={historyOrders.length}
          historyLoading={historyLoading}
          onGoToView={goToView}
        />
      ) : view === "pending" ? (
        loading ? (
          <Loading message={t("ui.loading")} />
        ) : selectedOrder ? (
          <DeliveryOrderDetail
            order={selectedOrder}
            isRtl={isRtl}
            onBack={() => setSelectedOrder(null)}
            onRequestConfirm={() => setIsConfirmOpen(true)}
          />
        ) : (
          <>
            <SubPageHeader
              title={t("delivery.pendingDeliveries")}
              backLabel={t("ui.back")}
              onBack={() => goToView("home")}
              isRtl={isRtl}
            />
            {orders.length > 0 ? (
              <div className="dp-list">
                {orders.map((order) => (
                  <DeliveryOrderCard key={order.order_id} order={order} isRtl={isRtl} onOpen={() => setSelectedOrder(order)} />
                ))}
              </div>
            ) : (
              !error && <EmptyState message={t("delivery.noOrders")} />
            )}
          </>
        )
      ) : (
        <>
          <SubPageHeader
            title={t("delivery.pastDeliveries")}
            backLabel={t("ui.back")}
            onBack={() => goToView("home")}
            isRtl={isRtl}
          />
          <DeliveryHistoryList orders={historyOrders} loading={historyLoading} error={historyError} lang={selectedLang(currentLang)} />
        </>
      )}

      {isConfirmOpen && selectedOrder && (
        <ConfirmDeliveryModal
          order={selectedOrder}
          isSubmitting={isConfirming}
          onConfirm={confirmDelivery}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}

      <DeliverySidebar
        isOpen={isSidebarOpen}
        isRtl={isRtl}
        user={user}
        view={view}
        currentLang={currentLang}
        onSetLang={setCurrentLang}
        onGoToView={goToView}
        onClose={() => setIsSidebarOpen(false)}
        onRequestSignOut={() => { setIsSidebarOpen(false); setIsSignOutOpen(true); }}
      />

      {isSignOutOpen && (
        <SignOutConfirmModal
          onConfirm={signOut}
          onClose={() => setIsSignOutOpen(false)}
        />
      )}
    </div>
  );
};

// ── Sidebar drawer ───────────────────────────────────────────────────────────

const DeliverySidebar: React.FC<{
  isOpen: boolean;
  isRtl: boolean;
  user: DashboardUser | null;
  view: DeliveryView;
  currentLang: string;
  onSetLang: (lang: string) => void;
  onGoToView: (view: DeliveryView) => void;
  onClose: () => void;
  onRequestSignOut: () => void;
}> = ({ isOpen, isRtl, user, view, currentLang, onSetLang, onGoToView, onClose, onRequestSignOut }) => {
  const { t } = useTranslation();
  const side = isRtl ? "right" : "left";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="dp-sidebar-backdrop"
            onClick={onClose}
            variants={sidebarBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />
          <motion.div
            className="dp-sidebar"
            style={{ [side]: 0 } as React.CSSProperties}
            custom={isRtl}
            variants={sidebarDrawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="dp-sidebar-top">
              <img src={logo} alt="" className="dp-sidebar-logo" />
              <button type="button" className="dp-sidebar-close" onClick={onClose} aria-label={t("ui.cancel")}>
                <FaTimes />
              </button>
            </div>

            <div className="dp-sidebar-profile">
              <div className="dp-sidebar-avatar">
                {user?.image ? <img src={user.image} alt="" /> : <FaUser size={22} />}
              </div>
              <div className="dp-sidebar-name">{user?.first_name} {user?.last_name}</div>
              <span className="dp-sidebar-role">{t("admin.users.deliveryMan")}</span>
              {user?.email && <div className="dp-sidebar-email"><FaEnvelope /> {user.email}</div>}
            </div>

            <nav className="dp-sidebar-nav">
              <button
                type="button"
                className={`dp-sidebar-item ${view === "home" ? "dp-sidebar-item--active" : ""}`}
                onClick={() => onGoToView("home")}
              >
                <FaHome /> {t("delivery.home")}
              </button>
              <button
                type="button"
                className={`dp-sidebar-item ${view === "pending" ? "dp-sidebar-item--active" : ""}`}
                onClick={() => onGoToView("pending")}
              >
                <FaBoxOpen /> {t("delivery.pendingDeliveries")}
              </button>
              <button
                type="button"
                className={`dp-sidebar-item ${view === "history" ? "dp-sidebar-item--active" : ""}`}
                onClick={() => onGoToView("history")}
              >
                <FaHistory /> {t("delivery.pastDeliveries")}
              </button>
            </nav>

            <div className="dp-sidebar-lang">
              <label className="dp-sidebar-lang-label"><FaGlobe /> {t("delivery.language")}</label>
              <div className="dp-lang-options">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`dp-lang-option ${currentLang === option ? "dp-lang-option--active" : ""}`}
                    onClick={() => onSetLang(option)}
                    aria-pressed={currentLang === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="dp-sidebar-signout" onClick={onRequestSignOut}>
              <FaSignOutAlt /> {t("nav.signOut")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Sub-page header — title for the current section + a way back ───────────

const SubPageHeader: React.FC<{
  title: string;
  backLabel: string;
  onBack: () => void;
  isRtl: boolean;
}> = ({ title, backLabel, onBack, isRtl }) => (
  <div className="dp-subpage-header">
    <button type="button" className="dp-back-btn" onClick={onBack}>
      {isRtl ? <FaChevronRight /> : <FaChevronLeft />}
      {backLabel}
    </button>
    <h2 className="dp-subpage-title">{title}</h2>
  </div>
);

// ── Home — overview + entry points into pending/history ────────────────────

const DeliveryHome: React.FC<{
  pendingCount: number;
  pendingLoading: boolean;
  toCollect: number;
  collectCurrency?: string;
  historyCount: number;
  historyLoading: boolean;
  onGoToView: (view: DeliveryView) => void;
}> = ({ pendingCount, pendingLoading, toCollect, collectCurrency, historyCount, historyLoading, onGoToView }) => {
  const { t } = useTranslation();
  return (
    <div className="dp-home">
      <div className="dp-home-intro">
        <div className="dp-home-intro-title">{t("delivery.portalTitle")}</div>
        <div className="dp-home-intro-subtitle">{t("delivery.homeSubtitle")}</div>
      </div>

      <div className="dp-home-grid">
        <button type="button" className="dp-home-card" onClick={() => onGoToView("pending")}>
          <div className="dp-home-card-icon dp-home-card-icon--pending"><FaBoxOpen /></div>
          <div className="dp-home-card-value">{pendingLoading ? "…" : pendingCount}</div>
          <div className="dp-home-card-label">{t("delivery.pendingDeliveries")}</div>
          {!pendingLoading && toCollect > 0 && (
            <div className="dp-home-card-extra">{t("delivery.toCollect")}: {toCollect} {collectCurrency}</div>
          )}
        </button>

        <button type="button" className="dp-home-card" onClick={() => onGoToView("history")}>
          <div className="dp-home-card-icon dp-home-card-icon--history"><FaHistory /></div>
          <div className="dp-home-card-value">{historyLoading ? "…" : historyCount}</div>
          <div className="dp-home-card-label">{t("delivery.pastDeliveries")}</div>
        </button>
      </div>
    </div>
  );
};

// ── Compact list card (pending) ─────────────────────────────────────────────

const DeliveryOrderCard: React.FC<{ order: DashboardOrder; isRtl: boolean; onOpen: () => void }> = ({ order, isRtl, onOpen }) => {
  const { t } = useTranslation();
  return (
    <button type="button" className="dp-card" onClick={onOpen}>
      <div className="dp-card-main">
        <div className="dp-card-top">
          <span className="dp-order-id">{hideInfos(order.order_id, 30)}</span>
          <span className={`dp-amount-badge ${order.is_paid === "cod" ? "dp-amount-badge--due" : "dp-amount-badge--paid"}`}>
            {order.is_paid === "cod" ? `${order.amount} ${order.currency}` : t("delivery.alreadyPaid")}
          </span>
        </div>
        <div className="dp-card-name">{order.client.last_name} {order.client.first_name}</div>
        <div className="dp-card-address">{order.client.address}, {order.client.city}</div>
      </div>
      {isRtl ? <FaChevronLeft className="dp-card-chevron" /> : <FaChevronRight className="dp-card-chevron" />}
    </button>
  );
};

// ── Full detail view (pending) ──────────────────────────────────────────────

const DeliveryOrderDetail: React.FC<{
  order: DashboardOrder;
  isRtl: boolean;
  onBack: () => void;
  onRequestConfirm: () => void;
}> = ({ order, isRtl, onBack, onRequestConfirm }) => {
  const { t } = useTranslation();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${order.client.address}, ${order.client.city}`
  )}`;

  return (
    <div className="dp-detail">
      <SubPageHeader
        title={`${order.client.first_name} ${order.client.last_name}`}
        backLabel={t("delivery.backToList")}
        onBack={onBack}
        isRtl={isRtl}
      />

      <div className="db-card dp-address-card">
        <div className="db-card-header">
          <FaMapMarkedAlt />
          {t("form.address.label")}
        </div>
        <div className="dp-address-block">
          <div className="dp-address-text">{order.client.address}</div>
          <div className="dp-address-city">{order.client.city}</div>
        </div>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-success dp-navigate-btn">
          <FaMapMarkedAlt className="me-2" />
          {t("delivery.navigate")}
        </a>
      </div>

      <div className="db-card">
        <div className="db-card-header">
          <FaUser />
          {t("admin.orders.clientInfo")}
        </div>
        {order.client.email && (
          <div className="dp-detail-line"><FaEnvelope className="dp-detail-line-icon" />{order.client.email}</div>
        )}
        <a href={`tel:${order.client.phone}`} className="btn btn-outline-primary dp-quick-btn dp-call-btn">
          <FaPhoneAlt />
          <span>{order.client.phone}</span>
        </a>
      </div>

      <div className="db-card">
        <div className="db-card-header">
          <FaHashtag />
          {t("admin.orders.orderInfo")}
        </div>
        <div className="db-field-grid">
          <div className="db-field">
            <div className="db-field-icon"><FaHashtag /></div>
            <div>
              <span className="db-field-label">{t("order.orderId")}</span>
              <span className="db-field-value db-field-value--mono">{order.order_id}</span>
            </div>
          </div>
          <div className="db-field">
            <div className="db-field-icon"><FaTruck /></div>
            <div>
              <span className="db-field-label">{t("transaction.amount")}</span>
              <span className="db-field-value">
                {order.is_paid === "cod" ? `${order.amount} ${order.currency}` : t("delivery.alreadyPaid")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="db-card">
        <div className="db-card-header">
          <FaTruck />
          {t("admin.product.orderedProducts")}
        </div>
        {order.ordered_products.length > 0 ? (
          <div className="dp-product-list">
            {order.ordered_products.map((p) => (
              <div className="dp-product-row" key={p.id}>
                <span className="dp-product-name">
                  {p.name}
                  <span className="dp-product-meta"> · {p.category} · {t("product.size")} {p.size}</span>
                </span>
                <span className="dp-product-qty">× {p.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={t("admin.orders.noProducts")} />
        )}
      </div>

      <button type="button" className="btn btn-success dp-confirm-btn" onClick={onRequestConfirm}>
        <FaCheckCircle className="me-2" />
        {t("delivery.confirm")}
      </button>
    </div>
  );
};

// ── Past deliveries ──────────────────────────────────────────────────────────

const DeliveryHistoryList: React.FC<{
  orders:  DeliveryHistoryOrder[];
  loading: boolean;
  error:   string | null;
  lang:    string;
}> = ({ orders, loading, error, lang }) => {
  const { t } = useTranslation();

  if (loading) return <Loading message={t("ui.loading")} />;
  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (orders.length === 0) return <EmptyState message={t("delivery.noHistory")} />;

  return (
    <div className="dp-list">
      {orders.map((order) => (
        <DeliveryHistoryCard key={order.order_id} order={order} lang={lang} />
      ))}
    </div>
  );
};

const DeliveryHistoryCard: React.FC<{ order: DeliveryHistoryOrder; lang: string }> = ({ order, lang }) => {
  const { t } = useTranslation();
  let formattedDate = order.date;
  try {
    if (order.date) formattedDate = getDate(order.date, "date", lang);
  } catch {
    // keep raw value if it doesn't parse
  }

  return (
    <div className="dp-card dp-card--history">
      <div className="dp-card-main">
        <div className="dp-card-top">
          <span className="dp-order-id">{hideInfos(order.order_id, 30)}</span>
          <span className="dp-history-badge"><FaCheckCircle /> {t("admin.orders.statusDelivered")}</span>
        </div>
        <div className="dp-card-name">{order.client.last_name} {order.client.first_name}</div>
        <div className="dp-card-address">{order.client.address}, {order.client.city}</div>
        {formattedDate && (
          <div className="dp-card-date"><FaCalendarAlt /> {formattedDate}</div>
        )}
      </div>
    </div>
  );
};

// ── Confirm-delivery modal ──────────────────────────────────────────────────

const ConfirmDeliveryModal: React.FC<{
  order: DashboardOrder;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ order, isSubmitting, onConfirm, onClose }) => {
  const { t } = useTranslation();
  const requiresPayment = order.is_paid === "cod";
  const [itemsDelivered, setItemsDelivered] = useState(false);
  const [amountReceived, setAmountReceived] = useState(false);
  const canConfirm = itemsDelivered && (!requiresPayment || amountReceived);

  return (
    <ModalBackdrop onClose={isSubmitting ? () => {} : onClose} onOpen={true}>
      <div className="confirm-modal">
        <h4 className="confirm-modal__title">
          <FaCheckCircle color="var(--db-success)" />
          {t("delivery.confirmTitle")}
        </h4>
        <p className="confirm-modal__subtitle">
          {t("delivery.confirmSubtitle", { name: `${order.client.first_name} ${order.client.last_name}` })}
        </p>

        <div className="dp-modal-checks">
          <label className="dp-modal-check">
            <input
              type="checkbox"
              checked={itemsDelivered}
              onChange={(e) => setItemsDelivered(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>{t("delivery.checkItemsDelivered")}</span>
          </label>
          {requiresPayment && (
            <label className="dp-modal-check">
              <input
                type="checkbox"
                checked={amountReceived}
                onChange={(e) => setAmountReceived(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>{t("delivery.checkAmountReceived", { amount: order.amount, currency: order.currency })}</span>
            </label>
          )}
        </div>

        <div className="confirm-modal__actions">
          <button className="btn dp-modal-cancel" onClick={onClose} disabled={isSubmitting}>
            {t("ui.cancel")}
          </button>
          <button className="btn btn-success" onClick={onConfirm} disabled={!canConfirm || isSubmitting}>
            {isSubmitting ? t("ui.loading") : t("delivery.confirm")}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

// ── Sign-out confirmation modal ─────────────────────────────────────────────

const SignOutConfirmModal: React.FC<{
  onConfirm: () => Promise<void>;
  onClose: () => void;
}> = ({ onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirm = async () => {
    setIsSigningOut(true);
    await onConfirm();
  };

  return (
    <ModalBackdrop onClose={isSigningOut ? () => {} : onClose} onOpen={true}>
      <div className="confirm-modal">
        <h4 className="confirm-modal__title">
          <FaSignOutAlt color="var(--db-danger)" />
          {t("delivery.signOutConfirmTitle")}
        </h4>
        <p className="confirm-modal__subtitle">{t("delivery.signOutConfirmSubtitle")}</p>
        <div className="confirm-modal__actions">
          <button className="btn dp-modal-cancel" onClick={onClose} disabled={isSigningOut}>
            {t("ui.cancel")}
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={isSigningOut}>
            {isSigningOut ? t("ui.loading") : t("nav.signOut")}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

export default DeliveryPortal;
