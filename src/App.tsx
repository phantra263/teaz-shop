import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProfilePage } from "./pages/ProfilePage";
import { ShopPage } from "./pages/ShopPage";
import { ToolsPage } from "./pages/ToolsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { shopeePriceTool } from "./data/tools";
import { servicesPage } from "./data/services";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path={shopeePriceTool.path} element={<ToolsPage />} />
        <Route path={servicesPage.path} element={<ServicesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
