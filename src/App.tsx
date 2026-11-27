import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProfilePage } from "./pages/ProfilePage";
import { ShopPage } from "./pages/ShopPage";
import { ToolsPage } from "./pages/ToolsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { shopeePriceTool } from "./data/tools";
import { servicesPage } from "./data/services";
import { MainNav } from "./components/MainNav";

const IslandPage = lazy(() => import("./pages/IslandPage"));
const IslandPlacePage = lazy(() => import("./pages/IslandPlacePage"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path={shopeePriceTool.path} element={<ToolsPage />} />
        <Route path={servicesPage.path} element={<ServicesPage />} />
        <Route path="/dao-tra" element={<Suspense fallback={<p role="status" className="p-6">Đang mở Đảo Trà…</p>}><IslandPage /></Suspense>} />
        <Route path="/dao-tra/dia-diem/:slug" element={<Suspense fallback={<p role="status" className="p-6">Đang mở nội dung…</p>}><IslandPlacePage /></Suspense>} />
      </Routes>
      <MainNav mobileOnly />
    </BrowserRouter>
  );
}
