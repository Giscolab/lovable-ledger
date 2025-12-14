import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { localStore } from "./utils/localStore";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

const getDefaultTheme = () => {
  if (typeof window === "undefined") {
    return "system";
  }

  return localStore.getTheme() ?? "system";
};

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme={getDefaultTheme()} enableSystem>
    <App />
  </ThemeProvider>
);
