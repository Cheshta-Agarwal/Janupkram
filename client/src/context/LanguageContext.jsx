import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  en: {
    workspace: 'Workspace',
    submitChallenge: 'Submit Challenge',
    analytics: 'Analytics',
    searchGrid: 'Search Grid...',
    kycSettings: 'KYC & Profile',
    signIn: 'Sign In',
    joinPortal: 'Join Portal',
    signOut: 'Sign Out',
  },
  hi: {
    workspace: 'कार्यक्षेत्र',
    submitChallenge: 'समस्या दर्ज करें',
    analytics: 'विश्लेषण',
    searchGrid: 'खोजें...',
    kycSettings: 'केवाईसी और प्रोफ़ाइल',
    signIn: 'लॉग इन',
    joinPortal: 'जुड़ें',
    signOut: 'लॉग आउट',
  },
  pa: {
    workspace: 'ਵਰਕਸਪੇਸ',
    submitChallenge: 'ਸਮੱਸਿਆ ਦਰਜ ਕਰੋ',
    analytics: 'ਵਿਸ਼ਲੇਸ਼ਣ',
    searchGrid: 'ਖੋਜੋ...',
    kycSettings: 'ਕੇਵਾਈਸੀ ਅਤੇ ਪ੍ਰੋਫਾਈਲ',
    signIn: 'ਸਾਈਨ ਇਨ',
    joinPortal: 'ਸ਼ਾਮਲ ਹੋਵੋ',
    signOut: 'ਸਾਈਨ ਆਊਟ',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('janupkram_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('janupkram_lang', lang);
  }, [lang]);

  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
