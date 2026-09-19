import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { HomePage } from "@/pages/store/HomePage";
import { AccountPage } from "@/pages/store/AccountPage";
import { CartPage } from "@/pages/store/CartPage";
import { CheckoutPage } from "@/pages/store/CheckoutPage";
import { ProductPage } from "@/pages/store/ProductPage";
import { ShopPage } from "@/pages/store/ShopPage";
import { TrackingPage } from "@/pages/store/TrackingPage";

function RootComponent() {
  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <ComingSoonPage title="صفحه موردنظر پیدا نشد" />,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "store",
  component: StoreLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => storeRoute,
  path: "/",
  component: HomePage,
});

const shopRoute = createRoute({
  getParentRoute: () => storeRoute,
  path: "shop",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
    sort: typeof search.sort === "string" ? search.sort : "newest",
  }),
  component: ShopRouteView,
});

function ShopRouteView() {
  const search = shopRoute.useSearch();
  return <ShopPage initialQuery={search.q} initialCategory={search.category} initialSort={search.sort} />;
}

const categoryRoute = createRoute({
  getParentRoute: () => storeRoute,
  path: "category/$slug",
  component: CategoryRouteView,
});

function CategoryRouteView() {
  const { slug } = categoryRoute.useParams();
  return <ShopPage lockedCategory={slug} />;
}

const productRoute = createRoute({
  getParentRoute: () => storeRoute,
  path: "product/$slug",
  component: ProductRouteView,
});

function ProductRouteView() {
  const { slug } = productRoute.useParams();
  return <ProductPage slug={slug} />;
}

const cartRoute = createRoute({ getParentRoute: () => storeRoute, path: "cart", component: CartPage });
const checkoutRoute = createRoute({ getParentRoute: () => storeRoute, path: "checkout", component: CheckoutPage });
const accountRoute = createRoute({ getParentRoute: () => storeRoute, path: "account", component: AccountPage });
const trackingRoute = createRoute({
  getParentRoute: () => storeRoute,
  path: "tracking",
  validateSearch: (search: Record<string, unknown>) => ({ code: typeof search.code === "string" ? search.code : "" }),
  component: TrackingRouteView,
});

function TrackingRouteView() {
  const { code } = trackingRoute.useSearch();
  return <TrackingPage initialCode={code} />;
}

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "admin",
  component: AdminLayout,
});

const adminIndexRoute = createRoute({ getParentRoute: () => adminRoute, path: "/", component: AdminDashboardPage });
const adminOrdersRoute = createRoute({ getParentRoute: () => adminRoute, path: "orders", component: AdminOrdersPage });
const adminProductsRoute = createRoute({ getParentRoute: () => adminRoute, path: "products", component: () => <ComingSoonPage title="مدیریت محصولات" /> });
const adminCustomersRoute = createRoute({ getParentRoute: () => adminRoute, path: "customers", component: () => <ComingSoonPage title="مدیریت مشتریان" /> });
const adminCategoriesRoute = createRoute({ getParentRoute: () => adminRoute, path: "categories", component: () => <ComingSoonPage title="مدیریت دسته‌بندی‌ها" /> });
const adminCouponsRoute = createRoute({ getParentRoute: () => adminRoute, path: "coupons", component: () => <ComingSoonPage title="کدهای تخفیف" /> });
const adminSettingsRoute = createRoute({ getParentRoute: () => adminRoute, path: "settings", component: () => <ComingSoonPage title="تنظیمات و محتوا" /> });

const routeTree = rootRoute.addChildren([
  storeRoute.addChildren([homeRoute, shopRoute, categoryRoute, productRoute, cartRoute, checkoutRoute, accountRoute, trackingRoute]),
  adminRoute.addChildren([adminIndexRoute, adminOrdersRoute, adminProductsRoute, adminCustomersRoute, adminCategoriesRoute, adminCouponsRoute, adminSettingsRoute]),
]);

export const router = createRouter({ routeTree, scrollRestoration: true });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
