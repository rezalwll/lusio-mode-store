import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { HomePage } from "@/pages/store/HomePage";
import { ProductPage } from "@/pages/store/ProductPage";
import { ShopPage } from "@/pages/store/ShopPage";

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

const cartRoute = createRoute({ getParentRoute: () => storeRoute, path: "cart", component: () => <ComingSoonPage title="سبد خرید" /> });
const checkoutRoute = createRoute({ getParentRoute: () => storeRoute, path: "checkout", component: () => <ComingSoonPage title="تسویه حساب" /> });
const accountRoute = createRoute({ getParentRoute: () => storeRoute, path: "account", component: () => <ComingSoonPage title="حساب کاربری" /> });
const trackingRoute = createRoute({ getParentRoute: () => storeRoute, path: "tracking", component: () => <ComingSoonPage title="پیگیری سفارش" /> });

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "admin",
  component: () => <ComingSoonPage title="پنل مدیریت مدرن الون" />,
});

const routeTree = rootRoute.addChildren([
  storeRoute.addChildren([homeRoute, shopRoute, categoryRoute, productRoute, cartRoute, checkoutRoute, accountRoute, trackingRoute]),
  adminRoute,
]);

export const router = createRouter({ routeTree, scrollRestoration: true });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
