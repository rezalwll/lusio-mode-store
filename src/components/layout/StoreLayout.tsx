import { Outlet } from "@tanstack/react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MiniCart } from "./MiniCart";

export function StoreLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main><Outlet /></main>
      <Footer />
      <MiniCart />
    </div>
  );
}
