import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, t as translate, TKey } from "./i18n";

interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  loading: { show: boolean; message?: string };
  setLoading: (show: boolean, message?: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "en");
  const [loading, setLoadingState] = useState<{ show: boolean; message?: string }>({ show: false });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang === "kn" ? "kn" : "en";
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: TKey) => translate(key, lang);
  const setLoading = (show: boolean, message?: string) => setLoadingState({ show, message });

  return <Ctx.Provider value={{ lang, setLang, t, loading, setLoading }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
