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
    heroBadge: 'Built by LPU Students • Open Societal Innovation Platform for Everyone',
    heroSubtitle:
      'Engineered by college student innovators at Lovely Professional University (LPU) for everyone—connecting real-world community problems anywhere with campus R&D labs, civic moderators, and industry CSR partners through verifiable milestones.',
    demoSignIn: '1-Click Demo Sign-In',
    registerStakeholder: 'Register Stakeholder',
    openWorkspace: 'Open My Workspace',
    explorerTitle: 'Interactive Pan-India Spatial Explorer',
    explorerDesc: 'Search any issue by keyword, category, source (Reddit / X), or city to filter map pins & reports.',
    allRegions: 'All Regions',
    allCategories: 'All Categories',
    featuredTitle: 'Featured Societal Challenges (Including Real Reddit & X Reports)',
    slaWatchlistTitle: 'SLA Escalation Watchlist & Reminder Grid',
    embedMapBtn: 'Embed Map',
    submitTitle: 'Submit a Societal Challenge',
    submitSubtitle: 'Pin the exact location on the map, capture live field evidence or speak in your language, and route to civic moderators.',
    aiTriageBtn: 'AI Check & Translate',
    saveOfflineBtn: 'Save Offline (No Network)',
    syncQueueBtn: 'Sync Offline Queue',
    submitBtn: 'Submit Challenge',
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
    heroBadge: 'LPU छात्रों द्वारा निर्मित • सभी के लिए खुला सामाजिक नवाचार मंच',
    heroSubtitle:
      'लवली प्रोफेशनल यूनिवर्सिटी (LPU) के छात्रों द्वारा निर्मित—जो जमीनी सामाजिक समस्याओं को विश्वविद्यालय R&D लैब्स, नागरिक मॉडरेटर और उद्योग CSR भागीदारों से जोड़ता है।',
    demoSignIn: '1-क्लिक डेमो लॉगिन',
    registerStakeholder: 'खाता पंजीकृत करें',
    openWorkspace: 'मेरा कार्यक्षेत्र खोलें',
    explorerTitle: 'अखिल भारतीय इंटरैक्टिव मैप एक्सप्लोरर',
    explorerDesc: 'मैप पिन फ़िल्टर करने के लिए कीवर्ड, श्रेणी, स्रोत (Reddit / X) या शहर से खोजें।',
    allRegions: 'सभी क्षेत्र',
    allCategories: 'सभी श्रेणियां',
    featuredTitle: 'प्रमुख सामाजिक समस्याएं (Reddit और X रिपोर्ट सहित)',
    slaWatchlistTitle: 'SLA एस्केलेशन वॉचलिस्ट और रिमाइंडर ग्रिड',
    embedMapBtn: 'मैप एम्बेड करें',
    submitTitle: 'सामाजिक समस्या दर्ज करें',
    submitSubtitle: 'मैप पर सटीक स्थान चुनें, लाइव फोटो लें या अपनी भाषा में बोलें।',
    aiTriageBtn: 'AI जांच और अनुवाद',
    saveOfflineBtn: 'ऑफ़लाइन सहेजें',
    syncQueueBtn: 'ऑफ़लाइन रिपोर्ट सिंक करें',
    submitBtn: 'समस्या सबमिट करें',
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
    heroBadge: 'LPU ਵਿਦਿਆਰਥੀਆਂ ਵੱਲੋਂ ਤਿਆਰ • ਸਭ ਲਈ ਖੁੱਲ੍ਹਾ ਸਮਾਜਿਕ ਨਵੀਨਤਾ ਮੰਚ',
    heroSubtitle:
      'ਲਵਲੀ ਪ੍ਰੋਫੈਸ਼ਨਲ ਯੂਨੀਵਰਸਿਟੀ (LPU) ਦੇ ਵਿਦਿਆਰਥੀਆਂ ਵੱਲੋਂ ਤਿਆਰ—ਜੋ ਸਮਾਜਿਕ ਸਮੱਸਿਆਵਾਂ ਨੂੰ ਯੂਨੀਵਰਸਿਟੀ R&D ਲੈਬਾਂ ਅਤੇ CSR ਭਾਈਵਾਲਾਂ ਨਾਲ ਜੋੜਦਾ ਹੈ।',
    demoSignIn: '1-ਕਲਿੱਕ ਡੈਮੋ ਲੌਗਿਨ',
    registerStakeholder: 'ਰਜਿਸਟਰ ਕਰੋ',
    openWorkspace: 'ਮੇਰਾ ਵਰਕਸਪੇਸ ਖੋਲ੍ਹੋ',
    explorerTitle: 'ਪੈਨ-ਇੰਡੀਆ ਇੰਟਰਐਕਟਿਵ ਨਕਸ਼ਾ ਐਕਸਪਲੋਰਰ',
    explorerDesc: 'ਨਕਸ਼ੇ ਦੇ ਪਿੰਨ ਫਿਲਟਰ ਕਰਨ ਲਈ ਸ਼ਬਦ, ਸ਼੍ਰੇਣੀ, ਸਰੋਤ ਜਾਂ ਸ਼ਹਿਰ ਨਾਲ ਖੋਜੋ।',
    allRegions: 'ਸਾਰੇ ਖੇਤਰ',
    allCategories: 'ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ',
    featuredTitle: 'ਪ੍ਰਮੁੱਖ ਸਮਾਜਿਕ ਚੁਣੌਤੀਆਂ (Reddit ਅਤੇ X ਸਮੇਤ)',
    slaWatchlistTitle: 'SLA ਐਸਕੇਲੇਸ਼ਨ ਵਾਚਲਿਸਟ',
    embedMapBtn: 'ਨਕਸ਼ਾ ਐਂਬੈਡ ਕਰੋ',
    submitTitle: 'ਸਮਾਜਿਕ ਸਮੱਸਿਆ ਦਰਜ ਕਰੋ',
    submitSubtitle: 'ਨਕਸ਼ੇ ਉੱਤੇ ਸਹੀ ਥਾਂ ਚੁਣੋ, ਲਾਈਵ ਫੋਟੋ ਖਿੱਚੋ ਜਾਂ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ।',
    aiTriageBtn: 'AI ਜਾਂਚ ਅਤੇ ਅਨੁਵਾਦ',
    saveOfflineBtn: 'ਔਫਲਾਈਨ ਸੰਭਾਲੋ',
    syncQueueBtn: 'ਔਫਲਾਈਨ ਰਿਪੋਰਟਾਂ ਸਿੰਕ ਕਰੋ',
    submitBtn: 'ਸਮੱਸਿਆ ਭੇਜੋ',
  },
  bn: {
    workspace: 'ওয়ার্কস্পেস',
    submitChallenge: 'সমস্যা জমা দিন',
    analytics: 'বিশ্লেষণ',
    searchGrid: 'খুঁজুন...',
    kycSettings: 'কেওয়াইসি ও প্রোফাইল',
    signIn: 'সাইন ইন',
    joinPortal: 'যোগ দিন',
    signOut: 'সাইন আউট',
    heroBadge: 'LPU শিক্ষার্থীদের তৈরি • সবার জন্য উন্মুক্ত সামাজিক উদ্ভাবন প্ল্যাটফর্ম',
    explorerTitle: 'প্যান-ইন্ডিয়া স্পেশিয়াল এক্সপ্লোরার',
    allRegions: 'সব অঞ্চল',
    allCategories: 'সব বিভাগ',
    submitTitle: 'একটি সামাজিক সমস্যা জমা দিন',
    aiTriageBtn: 'AI যাচাই ও অনুবাদ',
    submitBtn: 'সমস্যা জমা দিন',
  },
  mr: {
    workspace: 'कार्यक्षेत्र',
    submitChallenge: 'समस्या नोंदवा',
    analytics: 'विश्लेषण',
    searchGrid: 'शोधा...',
    kycSettings: 'केवायसी व प्रोफाइल',
    signIn: 'साइन इन',
    joinPortal: 'सहभागी व्हा',
    signOut: 'साइन आउट',
    heroBadge: 'LPU विद्यार्थ्यांनी तयार केलेले • सर्वांसाठी खुले सामाजिक नवोपक्रम व्यासपीठ',
    explorerTitle: 'अखिल भारतीय नकाशा एक्सप्लोरर',
    allRegions: 'सर्व प्रदेश',
    allCategories: 'सर्व श्रेणी',
    submitTitle: 'सामाजिक समस्या नोंदवा',
    aiTriageBtn: 'AI तपासणी व भाषांतर',
    submitBtn: 'समस्या सबमिट करा',
  },
  ta: {
    workspace: 'பணியிடம்',
    submitChallenge: 'பிரச்சனை பதிவிடு',
    analytics: 'பகுப்பாய்வு',
    searchGrid: 'தேடுக...',
    kycSettings: 'KYC & சுயவிவரம்',
    signIn: 'உள்நுழை',
    joinPortal: 'இணையவும்',
    signOut: 'வெளியேறு',
    heroBadge: 'LPU மாணவர்களால் உருவாக்கப்பட்டது • அனைவருக்குமான சமூக புதுமை தளம்',
    explorerTitle: 'இந்திய வரைபட ஆய்வு',
    allRegions: 'அனைத்து பகுதிகள்',
    allCategories: 'அனைத்து பிரிவுகள்',
    submitTitle: 'சமூக பிரச்சனையை சமர்ப்பிக்கவும்',
    aiTriageBtn: 'AI சரிபார்ப்பு & மொழிபெயர்ப்பு',
    submitBtn: 'சமர்ப்பிக்கவும்',
  },
  kn: {
    workspace: 'ಕಾರ್ಯಕ್ಷೇತ್ರ',
    submitChallenge: 'ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ',
    analytics: 'ವಿಶ್ಲೇಷಣೆ',
    searchGrid: 'ಹುಡುಕಿ...',
    kycSettings: 'KYC & ಪ್ರೊಫೈಲ್',
    signIn: 'ಸೈನ್ ಇನ್',
    joinPortal: 'ಸೇರಿ',
    signOut: 'ಸೈನ್ ಔಟ್',
    heroBadge: 'LPU ವಿದ್ಯಾರ್ಥಿಗಳಿಂದ ನಿರ್ಮಿತ • ಎಲ್ಲರಿಗಾಗಿ ಮುಕ್ತ ಸಾಮಾಜಿಕ ನಾವೀನ್ಯ ವೇದಿಕೆ',
    explorerTitle: 'ಪ್ಯಾನ್-ಇಂಡಿಯಾ ನಕ್ಷೆ ಅನ್ವೇಷಕ',
    allRegions: 'ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    submitTitle: 'ಸಾಮಾಜಿಕ ಸಮಸ್ಯೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    aiTriageBtn: 'AI ಪರಿಶೀಲನೆ ಮತ್ತು ಅನುವಾದ',
    submitBtn: 'ಸಲ್ಲಿಸಿ',
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
