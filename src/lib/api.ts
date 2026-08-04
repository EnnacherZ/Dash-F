/**
 * src/lib/api.ts
 *
 * Axios instance for all dashboard (admin/manager/delivery) requests.
 * Authentication is entirely cookie-based — no tokens in localStorage.
 * The backend's DashboardCookieJWTAuthentication reads the httpOnly
 * `access_token` cookie automatically on every request.
 */
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

const apiInstance = axios.create({
  baseURL:        apiUrl,
  withCredentials: true,       // send the httpOnly auth cookies automatically
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiInstance;
