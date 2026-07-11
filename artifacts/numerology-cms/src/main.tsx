import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Point the API client to the backend URL.
// In production (Vercel), this is set via the VITE_API_URL environment variable.
// In development (Replit), it falls back to an empty string (same-origin).
const apiUrl = import.meta.env.VITE_API_URL ?? "";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);
