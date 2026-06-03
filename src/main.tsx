import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";

// Theme Studio: apply saved CSS variables from the API on startup.
// This runs before React renders so there's no layout flash.
const themeVarMap: Record<string, string> = {
  background: "--bg",
  surface: "--surface",
  surfaceSoft: "--bg-2",
  card: "--card",
  cardHover: "--card-2",
  border: "--border",
  textPrimary: "--text",
  textSecondary: "--muted",
  textMuted: "--muted-2",
  accent: "--accent",
  accentSoft: "--accent-soft",
  accentDim: "--accent-dim",
};

async function applyTheme() {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetch(`${apiBaseUrl}/api/public/theme`);
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: Record<string, string> };
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(themeVarMap)) {
      if (data[key]) root.style.setProperty(cssVar, data[key]);
    }
  } catch {
    // Silently ignore — default CSS vars remain
  }
}

void applyTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
