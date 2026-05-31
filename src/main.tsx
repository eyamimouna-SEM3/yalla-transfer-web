import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/i18n"; // Initialise i18next AVANT le render

createRoot(document.getElementById("root")!).render(<App />);
