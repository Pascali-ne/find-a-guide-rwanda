import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdminDashboard from "./features/admin/AdminDashboard";
import LoginPage from "./features/auth/LoginPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import RegisterPage from "./features/auth/RegisterPage";
import DashboardPage from "./features/bookings/DashboardPage";
import GuideProfileEditor from "./features/guides/GuideProfileEditor";
import GuideProfilePage from "./features/guides/GuideProfilePage";
import GuideSearchPage from "./features/guides/GuideSearchPage";
import MessagesPage from "./features/messaging/MessagesPage";
import FAQPage from "./pages/FAQPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="guides" element={<GuideSearchPage />} />
        <Route path="guides/:id" element={<GuideProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="faq" element={<FAQPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["Tourist", "Guide"]} />}>
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:userId" element={<MessagesPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["Guide"]} />}>
          <Route path="guide/profile" element={<GuideProfileEditor />} />
        </Route>
        <Route element={<ProtectedRoute roles={["Admin"]} />}>
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
