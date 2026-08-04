/**
 * dashboard/LogIn.tsx — redesigned, logic untouched
 */
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/Authentication";
import Loading from "../components/loading";
import logo from "../assets/FIRDAOUS STORE.png";
import "../styles/Login.css";
import { useLangContext } from "../contexts/LanguageContext";
import { LANGUAGES } from "@/utils/i18n";
import { useTranslation } from "react-i18next";
import {
  FaUser, FaLock, FaEye, FaEyeSlash, FaGlobe,
  FaChevronDown, FaExclamationCircle, FaSignInAlt,
} from "react-icons/fa";

const Login: React.FC = () => {
  const { signIn, isAuthorized, isLoading } = useAuth();
  const {currentLang, setCurrentLang} = useLangContext();
  const {t} = useTranslation();

  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  if (isAuthorized) return <Navigate to="/Home" replace />;
  if (isLoading)    return <Loading message={t('ui.loading')} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(e, username, password);
    } catch (err: any) {
      setError(err?.message ?? t('auth.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── Header ── */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <img src={logo} alt="Al-Firdaous Store" />
          </div>
          <p className="login-eyebrow">Al-Firdaous Store</p>
          <h2 className="login-title">{t('auth.dashboardTitle')}</h2>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="login-error" role="alert">
            <FaExclamationCircle aria-hidden="true" />
            {error}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="login-fields">

            {/* Username */}
            <div className="login-field">
              <FaUser className="login-field-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder={t('auth.usernameLabel')}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div className="login-field login-field--password">
              <FaLock className="login-field-icon" aria-hidden="true" />
              <input
                type={showPwd ? "text" : "password"}
                placeholder={t('auth.passwordLabel')}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="login-pwd-toggle"
                aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
              </button>
            </div>

            {/* Language */}
            <div className="login-field login-field--lang">
              <FaGlobe className="login-field-icon" aria-hidden="true" />
              <select
              value={currentLang}
              onChange={(e)=>setCurrentLang(e.target.value)}
              >
                {LANGUAGES.map((lang, index)=>
                  (<option key={index}>{lang}</option>))}
              </select>
              <FaChevronDown className="login-chevron" aria-hidden="true" />
            </div>

          </div>

          <button className="login-submit" type="submit" disabled={submitting}>
            <FaSignInAlt aria-hidden="true" />
            {submitting ? t('ui.loading') : t('auth.signIn')}
          </button>
        </form>

        {/* ── Footer ── */}
        <div className="login-footer">
          <span className="login-footer__dot" />
          <span className="login-footer__label">{t('auth.securedConnection')}</span>
        </div>

      </div>
    </div>
  );
};

export default Login;