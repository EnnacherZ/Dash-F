/**
 * App.tsx
 *
 * Root component for the standalone dashboard app (dashboard.domain.com).
 * Routes are rooted at "/" instead of "/Dashboard" since this app is
 * served from its own subdomain.
 */
import React from "react";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

// ── Context providers ─────────────────────────────────────────────────────────
import { AuthProvider } from "./contexts/Authentication";
import { ParametersContextProvider } from "./contexts/ParametersContext";

// ── Dashboard pages ───────────────────────────────────────────────────────────
import Login from "./pages/Login";
import DBHome from "./pages/Home";
import ProductsManager from "./pages/ProductsManager";
import ExceptionsPage from "./pages/Deficiencies";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import OrderDetails from "./pages/OrderDetails";
import NotFoundPage from "./pages/NotFoundPage";
import NewsletterSection from "./pages/Newsletter";
import Promotions from "./pages/Promotions";

// ── Dashboard routes ──────────────────────────────────────────────────────────
const dashboardRouter = createBrowserRouter(
  [
    { path: "/",                          element: <Navigate to="/Home" replace /> },
    { path: "/Home",                      element: <DBHome /> },
    { path: "/Login",                     element: <Login /> },
    { path: "/ProductManager",            element: <ProductsManager /> },
    { path: "/Deficiency",                element: <ExceptionsPage /> },
    { path: "/Orders",                    element: <Orders /> },
    { path: "/Settings",                  element: <Settings /> },
    { path: "/Statistics",                element: <Statistics /> },
    { path: "/OrderDetails/:orderID",     element: <OrderDetails /> },
    { path: "/Newsletter",     element: <NewsletterSection /> },
    { path: "/Promotions",                  element: <Promotions /> },
    // FIX: there was no catch-all route at all, so any unregistered URL
    // (typo, stale bookmark, or the previously-broken mobile sidebar links)
    // rendered a completely blank page with no feedback.
    { path: "*",                          element: <NotFoundPage /> },
  ],
  { future: { v7_relativeSplatPath: true } }
);

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <motion.div
    key={window.location.pathname}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
  >
    <ParametersContextProvider>
      <AuthProvider>
        <RouterProvider
          router={dashboardRouter}
          future={{ v7_startTransition: true }}
        />
      </AuthProvider>
    </ParametersContextProvider>
    <ToastContainer />
  </motion.div>
);

export default App;
