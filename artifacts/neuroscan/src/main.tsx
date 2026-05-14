import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Bypass Vercel's 10-second timeout by making requests directly to the Render backend
setBaseUrl("https://neuroscan-api-e83r.onrender.com");

createRoot(document.getElementById("root")!).render(<App />);
