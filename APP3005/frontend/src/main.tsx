import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { GoogleOAuthWrapper } from "./components/auth/GoogleOAuthWrapper.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthWrapper>
        <App />
    </GoogleOAuthWrapper>
);
