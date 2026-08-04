import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import React, { createContext, Dispatch, ReactNode, useContext, useEffect, useState } from 'react';
import { selectedLang } from "@/utils/i18n";
import en from '../locales/en';
import fr from '../locales/fr';
import ar from '../locales/ar';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: 'fr',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// ── Context ───────────────────────────────────────────────────────────────────

interface LangContextProps {
  currentLang: string;
  setCurrentLang: Dispatch<React.SetStateAction<string>>;
}

const langContext = createContext<LangContextProps | undefined>(undefined);

export const LangContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    const lang = sessionStorage.getItem('AlFirdaousStoreLang');
    if (lang) return JSON.parse(lang);
    return 'العربية';
  });

  useEffect(() => {
    sessionStorage.setItem('AlFirdaousStoreLang', JSON.stringify(currentLang));
    i18n.changeLanguage(selectedLang(currentLang));
  }, [currentLang]);

  return (
    <langContext.Provider value={{ currentLang, setCurrentLang }}>
      <div>{children}</div>
    </langContext.Provider>
  );
};

export default i18n;

export const useLangContext = (): LangContextProps => {
  const context = useContext(langContext);
  if (context === undefined) {
    throw new Error('useLangContext must be used within a LangContextProvider');
  }
  return context;
};