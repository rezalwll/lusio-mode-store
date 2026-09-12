import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dataDir = path.join(root, "assets", "data");
const out = (name, value) => fs.writeFileSync(path.join(root, name), value);
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));

const rawProducts = readJson("store-products.json");
const rawCategories = readJson("store-categories.json");

const faDigits = (value) => String(value).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const priceOf = (p) => Number(p.prices?.price || p.prices?.sale_price || p.prices?.regular_price || 0);
const regularOf = (p) => Number(p.prices?.regular_price || p.prices?.price || 0);

const products = rawProducts.map((p) => {
  // A handful of the live shop's shirt products are intentionally uncategorised
  // in the Store API even though the storefront lists them under «پیراهن مردانه».
  const category = p.categories?.[0] || (/(shirt|crop|modal|diplomat|basell|par[ie]|cotton|classic)/i.test(`${p.slug} ${p.name}`) ? { slug: "men-shirt", name: "پیراهن مردانه" } : {});
  const colorAttr = p.attributes?.find((a) => a.name === "رنگ");
  const sizeAttr = p.attributes?.find((a) => a.name === "اندازه");
  const images = [...new Set((p.images || []).map((i) => i.src).filter(Boolean))];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: category.slug || "",
    categoryName: category.name || "",
    categorySlugs: [...new Set([...(p.categories || []).map((x) => x.slug), category.slug].filter(Boolean))],
    price: priceOf(p) || regularOf(p),
    regularPrice: regularOf(p),
    onSale: Boolean(p.on_sale),
    images,
    colors: (colorAttr?.terms || []).map((x) => x.name),
    sizes: (sizeAttr?.terms || []).map((x) => x.name),
    inStock: p.is_in_stock !== false,
    description: stripHtml(p.short_description || p.description || "") || "محصولی با طراحی به‌روز و کیفیت مناسب برای استایل روزمره.",
  };
});

const categories = rawCategories.map((c) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description || "",
  count: c.count || 0,
  parent: c.parent || 0,
  image: c.image?.src || "",
}));

const categoryNames = new Map(categories.map((c) => [c.slug, c.name]));
const topCategorySlugs = [
  "men-shirt",
  "men-pants",
  "men-t-shirts-and-sweatshirts",
  "men-shoes-and-boots",
  "men-accessories",
  "men-set",
];
const categoryAliases = {
  "polo-shirt": "polo",
  clock: "watch",
};
const categoryFile = (slug) => `category-${categoryAliases[slug] || slug}.html`;
const categoryPageFile = (slug, page) => `category-${categoryAliases[slug] || slug}-page-${page}.html`;
const productFile = (slug) => `product-${slug}.html`;
const image = (url, alt = "") => {
  const safe = escapeHtml(url || "assets/images/product-placeholder.svg");
  return `<img loading="lazy" src="${safe}" alt="${escapeHtml(alt)}" onerror="this.onerror=null;this.src='assets/images/product-placeholder.svg'">`;
};

const logoUrl = "assets/images/logo-eleven.png";
const icons = {
  search: '<svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  cart: '<svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 11h11l2-8H7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/></svg>',
  menu: '<svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H11l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 10h10M7 13h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

function navMarkup() {
  const childGroups = {
    "men-t-shirts-and-sweatshirts": ["tshirt", "polo-shirt", "vest", "tank-top"],
    "men-accessories": ["glasses", "clock", "bag", "belt"],
  };
  return topCategorySlugs.map((slug) => {
    const c = categories.find((x) => x.slug === slug) || { name: categoryNames.get(slug) || slug };
    const children = childGroups[slug];
    if (!children) return `<a href="${categoryFile(slug)}">${escapeHtml(c.name)}</a>`;
    const links = children.map((child) => {
      const cc = categories.find((x) => x.slug === child);
      return `<a href="${categoryFile(child)}">${escapeHtml(cc?.name || child)}</a>`;
    }).join("");
    return `<div class="nav-parent" tabindex="0"><span>${escapeHtml(c.name)}</span><div class="subnav">${links}</div></div>`;
  }).join("");
}

function header() {
  const nav = navMarkup();
  return `<div class="topbar">خرید لباس مردانه | فروشگاه پوشاک مردانه | لباس مردانه شیک | خرید آنلاین لباس مردانه | استایل مردانه</div>
<header class="header"><div class="container header-main">
  <a class="logo" href="index.html" aria-label="الون استایل"><img src="${logoUrl}" alt="ELEVEN" onerror="this.onerror=null;this.src='assets/images/logo-fallback.svg'"></a>
  <nav class="nav-main" aria-label="منوی اصلی">${nav}</nav>
  <div class="header-tools">
    <button class="search-trigger" type="button" aria-label="جستجو">${icons.search}</button>
    <a class="account-link" href="account.html">ورود</a>
    <button class="cart-link" type="button" onclick="openCart()" aria-label="سبد خرید">${icons.cart}<span class="cart-badge">۰</span></button>
  </div><button class="menu-toggle" type="button" onclick="openMenu()" aria-label="باز کردن منو">${icons.menu}</button>
</div></header>
<aside class="mobile-nav" id="mobileNav"><div class="drawer-head"><b>منوی الون</b><button type="button" onclick="closeLayers()" aria-label="بستن">×</button></div>${nav.replaceAll('class="nav-parent"', 'class="mobile-nav-parent"')}</aside>
<div class="overlay"></div>
<aside class="drawer" id="cartDrawer"><div class="drawer-head"><b>سبد خرید</b><button type="button" onclick="closeLayers()" aria-label="بستن">×</button></div><div id="miniCartItems"></div><div class="sumrow total"><span>جمع</span><span id="miniTotal">۰ تومان</span></div><a class="primary" style="width:100%;margin-top:10px" href="cart.html">مشاهده سبد خرید</a></aside>`;
}

function footer() {
  return `<footer class="footer"><section class="footer-main"><div class="footer-grid">
    <div class="footer-col footer-about"><div class="footer-col-inner"><img class="footer-logo" src="${logoUrl}" alt="ELEVEN" onerror="this.onerror=null;this.src='assets/images/logo-fallback.svg'"><p>در الون استایل، ما لباس نمی‌فروشیم؛ ما به شما اعتمادبه‌نفس هدیه می‌دهیم. با گزینش برترین پارچه‌ها و دوخت‌های استاندارد، مجموعه‌ای لوکس از پوشاک مردانه را برای کسانی که به دنبال تمایز هستند فراهم آورده‌ایم. هر قطعه در مجموعه ما، داستانی از دقت و ظرافت در طراحی است.</p></div></div>
    <div class="footer-col footer-address"><div class="footer-col-inner"><h3>نشانی فروشگاه حضوری الون استایل</h3><p>نشانی : قم - بلوار الغدیر - روبروی شهرک قدس - جنب سینمای ونوس | 09914534178</p></div></div>
    <div class="footer-col footer-license"><div class="footer-col-inner"><h3>مجوزات</h3><a href="#" aria-label="نماد اعتماد الکترونیکی"><img class="trust-seal" src="https://trustseal.enamad.ir/logo.aspx?id=606774&amp;Code=74wi1zAnvDab5dhUVdD059664zsOpLpb" alt="نماد اعتماد" onerror="this.style.visibility='hidden'"></a></div></div>
  </div></section><div class="copy"><span>Copyright 2026 © <strong>Eleven Store</strong></span><span>ساخته شده با ❤️ در <a href="#">گروه طراحی توسعه وردپرس</a> | ابوالفضل شکری</span></div></footer>`;
}

function floatingWidgets() {
  return `<button class="floating-order" id="trackingTrigger" type="button"><strong>پیگیری سفارش</strong><small>مشاهده وضعیت سفارش</small></button><div class="tracking-modal" id="trackingModal" aria-hidden="true"><div class="tracking-dialog"><button class="tracking-close" type="button" aria-label="بستن">×</button><h2>پیگیری سفارش</h2><p>برای مشاهده وضعیت سفارش، اطلاعات زیر را وارد کنید.</p><form id="floatingTrackingForm"><label>شماره سفارش<input name="code" required placeholder="مثال: EL-10248"></label><label>شماره موبایل<input name="phone" required placeholder="0912xxxxxxx"></label><button class="tracking-submit" type="submit">بررسی وضعیت</button><div class="tracking-result" id="floatingTrackingResult"></div></form></div></div><div class="floating-chat"><span>Contact us</span><button type="button" aria-label="تماس">${icons.chat}</button></div>`;
}

function base(title, body, options = {}) {
  const { includeChrome = true, className = "" } = options;
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#000"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="assets/css/style.css?v=20260908-19"><script src="assets/js/catalog.js?v=20260908-19" defer></script><script src="assets/js/app.js?v=20260908-19" defer></script></head><body class="${className}">${includeChrome ? header() : ""}${body}${includeChrome ? footer() : ""}${floatingWidgets()}</body></html>`;
}

function storyMarkup() {
  const stories = [
    ["https://elevenstyle.ir/wp-content/uploads/2026/08/%D8%AC%D8%B1%D8%AF%D9%86-%D8%B3%D8%A7%D9%82%D8%AF%D8%A7%D8%B1-%D9%85%D9%88%DA%A9%D8%A7.webp", "کالکشن جردن"],
    ["https://elevenstyle.ir/wp-content/uploads/2026/08/%D8%AA%D9%86%DA%AF-%D8%AA%D8%A7%D9%BE-polo.webp", "کالکشن تنگ‌تاپ"],
  ];
  return `<section class="stories"><div class="container story-row">${stories.map(([src, label]) => `<a class="story" href="category-men-shoes-and-boots.html"><div class="story-ring">${image(src, label)}</div><span>${label}</span></a>`).join("")}</div></section>`;
}

const featured = ["baziaq-turk-bag-mens", "master-cotton-shirt", "vans-veja", "long-sleeve-shirt-eleven", "classic-plain-shirt-men-eleven", "mam-baziaq-turk-mens", "modal-shirt-eleven", "basic-t-shirt-eleven"];
const popular = ["classic-plain-shirt-men-eleven", "mam-baziaq-turk-mens", "modal-shirt-eleven", "basic-t-shirt-eleven", "hermes-baggy-pants-eleven", "berziac-turk-pants", "henley-shirt-eleven", "jordan-1-retro-eleven"];
const homeSectionBanners = [
  ["https://elevenstyle.ir/wp-content/uploads/2026/02/ElevenStyle.ir-newestbanner-1.webp", "https://elevenstyle.ir/wp-content/uploads/2026/02/ElevenStyle.ir-mobilenewestbanner.webp"],
  ["https://elevenstyle.ir/wp-content/uploads/2026/04/کفش-مردانه-دسکتاپ-.webp", "https://elevenstyle.ir/wp-content/uploads/2026/04/کفش-مردانه-موبایل-.webp"],
  ["https://elevenstyle.ir/wp-content/uploads/2026/04/پیراهن-مردانه-دسکتاپ-1.webp", "https://elevenstyle.ir/wp-content/uploads/2026/04/پیراهن-مردانه-دسکتاپ-2.webp"],
  ["https://elevenstyle.ir/wp-content/uploads/2026/04/شلوار-مردانه-دسکتاپ-.webp", "https://elevenstyle.ir/wp-content/uploads/2026/04/شلوار-مردانه-موبایل-.webp"],
  ["https://elevenstyle.ir/wp-content/uploads/2026/05/bannertshirt-desktop.png", "https://elevenstyle.ir/wp-content/uploads/2026/05/bannertshirt-mobile.png"],
  ["https://elevenstyle.ir/wp-content/uploads/2026/04/اکسسوری-مردانه-دسکتاپ-.webp", "https://elevenstyle.ir/wp-content/uploads/2026/04/اکسسوری-مردانه-موبایل-.webp"],
];

function productCard(p) {
  const img = p.images?.[0] || "";
  return `<article class="product-card" data-product-card data-slug="${escapeHtml(p.slug)}" data-name="${escapeHtml(p.name)}" data-search="${escapeHtml(`${p.name} ${p.categoryName}`)}" data-colors="${escapeHtml((p.colors || []).join("|"))}" data-sizes="${escapeHtml((p.sizes || []).join("|"))}">
    <div class="product-image"><a href="${productFile(p.slug)}">${image(img, p.name)}</a><div class="quick"><button type="button" title="علاقه‌مندی" aria-label="علاقه‌مندی">♡</button><button type="button" title="افزودن به سبد" data-add-product>＋</button></div></div>
    <div class="product-body"><div class="product-cat">${escapeHtml(p.categoryName)}</div><a class="product-name" href="${productFile(p.slug)}">${escapeHtml(p.name)}</a><div class="price">${new Intl.NumberFormat("en-US").format(p.price)} <span>تومان</span></div></div>
  </article>`;
}

function heroMarkup() {
  const slides = [
    { desktop: "https://elevenstyle.ir/wp-content/uploads/2026/09/Tshirtfallbannerdesktop-scaled.webp", mobile: "https://elevenstyle.ir/wp-content/uploads/2026/09/tshirtfallbannermobile-1.webp", href: categoryFile("men-t-shirts-and-sweatshirts") },
    { desktop: "https://elevenstyle.ir/wp-content/uploads/2026/09/shoesfallbannerdesktop-scaled.webp", mobile: "https://elevenstyle.ir/wp-content/uploads/2026/09/shoesfallbannermobile-1.webp", href: categoryFile("men-shoes-and-boots") },
    { desktop: "https://elevenstyle.ir/wp-content/uploads/2026/04/%D8%B3%D8%A7%D8%B9%D8%AA-%DA%A9%D8%A7%D8%B1%DB%8C-scaled.png", mobile: "https://elevenstyle.ir/wp-content/uploads/2026/04/%D8%B3%D8%A7%D8%B9%D8%AA-%DA%A9%D8%A7%D8%B1%DB%8C-%D9%85.png", href: categoryFile("men-accessories") },
    { desktop: "https://elevenstyle.ir/wp-content/uploads/2026/04/%D8%A8%D8%B3%D8%AA%D9%87-%D8%AF%D8%B3%DA%A9-1-scaled.png", mobile: "https://elevenstyle.ir/wp-content/uploads/2026/04/%D8%A8%D8%B3%D8%AA%D9%87.png", href: "tracking.html" },
  ];
  return `<section class="hero"><div class="container"><div class="hero-slider">${slides.map((s, i) => `<a class="hero-slide${i === 0 ? " active" : ""}" href="${s.href}"><picture><source media="(max-width: 900px)" srcset="${s.mobile}"><img src="${s.desktop}" alt="کالکشن جدید الون" onerror="this.onerror=null;this.src='assets/images/hero-placeholder.svg'"></picture></a>`).join("")}<div class="hero-dots">${slides.map((_, i) => `<button type="button" class="hero-dot${i === 0 ? " active" : ""}" aria-label="اسلاید ${faDigits(i + 1)}"></button>`).join("")}</div></div></div></section>`;
}

function homeBody() {
  const topCats = topCategorySlugs.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean);
  const cards = (slugs) => slugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean).map(productCard).join("");
  const categoryRows = [
    ["کفش و کتونی مردانه", "men-shoes-and-boots"],
    ["پیراهن مردانه", "men-shirt"],
    ["شلوار مردانه", "men-pants"],
    ["تیشرت و پلوشرت مردانه", "men-t-shirts-and-sweatshirts"],
    ["اکسسوری مردانه", "men-accessories"],
  ];
  const section = (title, slug, index, items) => {
    const [desktop, mobile] = homeSectionBanners[index] || ["", ""];
    const sectionClass = ["home-product-section", `home-section-${index}`, index === 0 ? "first-home-products" : "", index === 4 ? "tail-gap" : "", index === 5 ? "last-home-products" : ""].filter(Boolean).join(" ");
    return `<section class="${sectionClass}"><div class="container">${desktop ? `<picture class="home-section-banner"><source media="(max-width: 620px)" srcset="${mobile}"><img src="${desktop}" alt="${escapeHtml(title)}" onerror="this.onerror=null;this.src='assets/images/banner-placeholder.svg'"></picture>` : ""}<div class="home-product-row">${items.map(productCard).join("")}</div></div></section>`;
  };
  const latest = featured.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean).concat(products.filter((p) => !featured.includes(p.slug)).slice(0, 6));
  return `${storyMarkup()}${heroMarkup()}<main>
    <section class="section home-categories"><div class="container"><div class="category-tiles">${topCats.map((c) => `<a class="category-tile" href="${categoryFile(c.slug)}"><div class="cat-image">${image(c.image, c.name)}</div><b>${escapeHtml(c.name)}</b><small>${faDigits(c.count)} محصولات</small></a>`).join("")}</div></div></section>
    ${section("جدیدترین‌ها", "shop", 0, latest)}
    ${categoryRows.map(([title, slug], i) => section(title, slug, i + 1, products.filter((p) => p.category === slug).slice(0, 14))).join("")}
  </main>`;
}

function filtersFor(items) {
  const colors = [...new Set(items.flatMap((p) => p.colors || []))].slice(0, 12);
  const sizes = [...new Set(items.flatMap((p) => p.sizes || []))].slice(0, 14);
  const group = (title, values) => `<div class="filter-group"><h4>${title}</h4><div class="filter-list">${values.map((v) => `<label><input type="checkbox" value="${escapeHtml(v)}">${escapeHtml(v)}</label>`).join("")}</div><span class="show-more">SHOW MORE</span></div>`;
  return `${group("بر اساس رنگ", colors.length ? colors : ["مشکی", "سفید", "آبی", "قهوه‌ای"])}${group("بر اساس اندازه", sizes.length ? sizes : ["M", "L", "XL", "XXL"])}<div class="filter-group"><label><input type="checkbox"> محصولات فروش ویژه</label></div>`;
}

function categoryBody(category, items, page = 1) {
  const title = category?.name || "فروشگاه";
  const desc = category?.description ?? `${title} الون؛ انتخابی از محصولات باکیفیت برای استایل مردانه.`;
  const total = Number(category?.count || items.length);
  const perPage = 12;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const pageItems = items.slice((current - 1) * perPage, current * perPage);
  const result = `نمایش ${faDigits((current - 1) * perPage + 1)}–${faDigits(Math.min(current * perPage, total))} از ${faDigits(total)} نتیجه`;
  const pageLink = (n) => {
    if (!category?.slug) return n === 1 ? "shop.html" : `shop-page-${n}.html`;
    return n === 1 ? categoryFile(category.slug) : categoryPageFile(category.slug, n);
  };
  const pagination = pages > 1 ? `<nav class="pagination" aria-label="صفحه‌بندی">${Array.from({length: pages}, (_, i) => i + 1).map(n => `<a class="${n === current ? "active" : ""}" href="${pageLink(n)}">${faDigits(n)}</a>`).join("")}${current < pages ? `<a class="next" href="${pageLink(current + 1)}">بعدی ›</a>` : ""}</nav>` : "";
  return `<section class="page-head"><div class="container category-title-row"><div><h1>${escapeHtml(title)}</h1><div class="category-breadcrumb"><a href="index.html">الون استایل</a> <span>-</span> ${escapeHtml(title)}</div><button class="mobile-filter" type="button" onclick="toggleFilters()">☰ صافی</button></div><div class="category-result">${result}</div></div></section><main class="shop-layout${desc ? "" : " no-description"}"><aside class="sidebar"><button class="filters-close" type="button" onclick="toggleFilters()" aria-label="بستن فیلترها">× بستن</button>${filtersFor(items)}</aside><section>${desc ? `<p class="category-description">${escapeHtml(stripHtml(desc))}</p>` : ""}<div class="product-grid">${pageItems.map(productCard).join("") || `<div class="empty">محصولی در این دسته پیدا نشد.</div>`}</div>${pagination}</section></main>`;
}

function productBody(p) {
  const categoryFileName = categoryFile(p.category);
  const thumbs = (p.images?.length ? p.images.slice(0, 4) : [""]).map((src, i) => `<button class="thumb${i === 0 ? " active" : ""}" type="button" data-gallery-image="${escapeHtml(src)}">${image(src, p.name)}</button>`).join("");
  const colors = p.colors?.length ? p.colors : ["مشکی", "سفید"];
  const sizes = p.sizes?.length ? p.sizes : ["M", "L", "XL", "XXL"];
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  return `<main class="product-page"><section class="gallery"><div class="main-photo"><img id="mainProductImage" src="${escapeHtml(p.images?.[0] || "assets/images/product-placeholder.svg")}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='assets/images/product-placeholder.svg'"></div><div class="thumbs">${thumbs}</div></section><section class="product-info"><nav class="product-breadcrumb breadcrumbs"><a href="index.html">الون استایل</a><span> - </span><a href="${categoryFileName}">${escapeHtml(p.categoryName)}</a><span> - </span><span>${escapeHtml(p.name)}</span></nav><h1>${escapeHtml(p.name)}</h1><div class="big-price">${new Intl.NumberFormat("en-US").format(p.price)} تومان</div><table class="size-table"><thead><tr><th>سایز</th><th>عرض سینه</th><th>قد محصول</th></tr></thead><tbody>${sizes.slice(0, 4).map((s, i) => `<tr><td>${escapeHtml(s)}</td><td>${55 + i * 5}</td><td>${67 + i}</td></tr>`).join("")}</tbody></table><div class="notice notice-card-wp"><div class="notice-badge-wp">⚠️ نکته مهم</div><div class="notice-text-wp"><strong>توجه:</strong> اندازه‌ها به‌صورت <span class="highlight-wp">دستی</span> اندازه‌گیری شده‌اند؛ <strong>۱ تا ۲ سانتی‌متر</strong> اختلاف در ابعاد طبیعی است.<br>همچنین به دلیل <span class="highlight-wp">نورپردازی</span> و تفاوت نمایشگرها، <strong>۱ تا ۲ درجه</strong> اختلاف رنگ لباس نسبت به تصویر ممکن است وجود داشته باشد.</div><div class="divider-wp"></div></div><div class="option"><div class="option-title">رنگ</div><div class="chips">${colors.map((c, i) => `<button class="chip${i === 0 ? " active" : ""}" type="button" data-option="color">${escapeHtml(c)}</button>`).join("")}</div></div><div class="option"><div class="option-title">اندازه</div><div class="chips">${sizes.map((s, i) => `<button class="chip${i === 0 ? " active" : ""}" type="button" data-option="size">${escapeHtml(s)}</button>`).join("")}</div></div><div class="stock-status">موجود در انبار</div><div class="buy-row"><div class="qty"><button type="button" data-qty-minus>−</button><input value="1" min="1" inputmode="numeric" aria-label="تعداد"><button type="button" data-qty-plus>＋</button></div><button class="add" type="button" data-product-add data-slug="${escapeHtml(p.slug)}">افزودن به سبد خرید</button></div><div class="product-meta"><span class="sku_wrapper">شناسه محصول: <span>نامعلوم</span></span><span class="posted_in">دسته: <a href="${categoryFileName}">${escapeHtml(p.categoryName)}</a></span></div></section><div class="product-sidebar-spacer" aria-hidden="true"></div></main><section class="tabs"><div class="container"><div class="tab-buttons"><button class="active" type="button">توضیحات</button><button type="button">توضیحات تکمیلی</button><button type="button">نظرات (۰)</button></div><div class="tab-content">${escapeHtml(p.description)}</div></div></section>${related.length ? `<section class="section" style="background:#f7f7f7"><div class="container"><div class="title-row"><h2>محصولات مشابه</h2></div><div class="product-grid">${related.map(productCard).join("")}</div></div></section>` : ""}`;
}

function cartBody() {
  return `<main class="cart-page"><div class="checkout-steps"><b>سبد خرید</b><span>‹</span><span>جزئیات پرداخت</span><span>‹</span><span>اتمام عملیات خرید</span></div><div class="cart-empty-state" id="cartEmptyState"><p>سبد خرید شما در حال حاضر خالی است.</p><a class="primary" href="shop.html">بازگشت به فروشگاه</a></div><div class="cart-content" id="cartContent"><div class="cart-notice">منطقه منطبق با مشتری &quot;قم&quot;</div><main class="container cart-layout"><section><h1>سبد خرید</h1><table class="cart-table"><thead><tr><th>محصول</th><th>قیمت</th><th>تعداد</th><th></th></tr></thead><tbody id="cartBody"></tbody></table></section><aside class="summary"><h3>مجموع کل سبد خرید</h3><div class="sumrow"><span>جمع جزء</span><span id="cartTotal">۰ تومان</span></div><div class="shipping-box"><h4>حمل و نقل</h4><label><input type="radio" name="shipping" checked> ارسال از طریق پست - ۳ تا ۷ روز کاری <b>۱۳۰,۰۰۰ تومان</b></label><label><input type="radio" name="shipping"> پیک موتوری - پس‌کرایه</label><label><input type="radio" name="shipping"> تحویل حضوری از فروشگاه</label><small>حمل و نقل به <strong>قم</strong>.</small></div><div class="sumrow"><span>هزینه بسته‌بندی</span><span>۳۰,۰۰۰ تومان</span></div><div class="sumrow total"><span>مجموع</span><span id="cartTotal2">۰ تومان</span></div><a href="checkout.html" class="primary" style="width:100%;margin-top:10px">اقدام به پرداخت</a><div class="coupon-row"><b>🏷 کوپن</b><input placeholder="کد تخفیف"><button type="button">اعمال تخفیف</button></div></aside></main></div></main>`;
}

function checkoutBody() {
  return `<div class="breadcrumb"><div class="container"><a href="index.html">خانه</a> <span>›</span> تسویه حساب</div></div><main class="container checkout-layout"><form class="checkout-form" id="checkoutForm"><section><h1>تسویه حساب</h1><h2>اطلاعات صورتحساب</h2><div class="checkout-fields"><input required placeholder="نام"><input required placeholder="نام خانوادگی"><input required placeholder="شماره موبایل"><input type="email" placeholder="ایمیل (اختیاری)"><input required placeholder="استان"><input required placeholder="شهر"><input required placeholder="کد پستی"><input required class="wide" placeholder="نشانی کامل"><textarea rows="3" class="wide" placeholder="توضیحات سفارش"></textarea></div></section><section><h2>روش پرداخت</h2><label class="payment-option"><input type="radio" name="pay" checked> پرداخت اینترنتی از طریق درگاه بانکی</label></section><button class="primary" type="submit">ثبت سفارش</button></form><aside class="summary"><h3>سفارش شما</h3><div id="checkoutItems"></div><div class="sumrow total"><span>مبلغ قابل پرداخت</span><span id="checkoutTotal">۰ تومان</span></div></aside></main>`;
}

function searchBody() {
  // The live search endpoint is a blog-style archive rather than a shop grid.
  // Keep the article markup local so the page still works when opened offline.
  const imageUrl = "https://elevenstyle.ir/wp-content/uploads/2026/09/پیراهن-لنین-Hermes-زرشکی.webp";
  const article = `<article class="search-entry" data-search-entry>
    <header class="search-entry-header">
      <div class="search-entry-heading"><h2><a href="product-hermes-linen-shirt.html">پیراهن لنین Hermes الون</a></h2><div class="search-entry-divider"></div></div>
      <div class="search-entry-image"><a href="product-hermes-linen-shirt.html"><img src="${imageUrl}" width="1086" height="1448" alt="پیراهن لنین Hermes الون" fetchpriority="high" onerror="this.onerror=null;this.src='assets/images/product-placeholder.svg'"></a><div class="search-date-badge"><span>۱۸</span><small>شهریور</small></div></div>
    </header>
    <div class="search-entry-content"><table><thead><tr><th>سایز</th><th>عرض سینه</th><th>قد آستین</th><th>قد محصول</th></tr></thead><tbody><tr><td>M</td><td>56</td><td>60</td><td>71</td></tr><tr><td>L</td><td>58</td><td>61</td><td>72</td></tr><tr><td>XL</td><td>60</td><td>62</td><td>73</td></tr><tr><td>XXL</td><td>62</td><td>62</td><td>74</td></tr></tbody></table><div class="search-more-wrap"><a class="search-more" href="product-hermes-linen-shirt.html">ادامه <span>→</span></a></div></div>
    <footer class="search-entry-meta"><a href="product-hermes-linen-shirt.html#respond">ارسال دیدگاه</a></footer>
  </article>`;
  const pagination = `<nav class="search-pagination" aria-label="صفحه‌بندی"><a class="current" href="search.html?q=پیراهن">۱</a><a href="search.html?page=2&amp;q=پیراهن">۲</a><a href="search.html?page=3&amp;q=پیراهن">۳</a><a href="search.html?page=4&amp;q=پیراهن">۴</a><span>…</span><a href="search.html?page=115&amp;q=پیراهن">۱۱۵</a><a class="next" href="search.html?page=2&amp;q=پیراهن" aria-label="بعدی">‹</a></nav>`;
  return `<main id="searchMain" class="search-archive"><header class="search-archive-header"><h1 id="searchTitle">نتایج جست و جوی : <span id="searchQuery">پیراهن</span></h1></header><div class="search-columns"><section class="search-results-column"><div id="searchResults">${article}</div>${pagination}</section><aside class="search-sidebar" aria-hidden="true"></aside></div></main>`;
}

function trackingBody() {
  return `<div class="breadcrumb"><div class="container"><a href="index.html">خانه</a> <span>›</span> پیگیری سفارش</div></div><main class="container" style="padding:10px 0 80px"><h1>پیگیری سفارش</h1><p style="max-width:680px;color:#777">برای پیگیری سفارش، شماره سفارش و شماره موبایل ثبت‌شده هنگام خرید را وارد کنید.</p><form id="trackingForm" class="form-card" style="margin:25px 0 0;max-width:520px"><div class="field"><label>شماره سفارش</label><input name="code" required placeholder="مثال: EL-10248"></div><div class="field"><label>شماره موبایل</label><input name="phone" required placeholder="0912xxxxxxx"></div><button class="primary" type="submit">بررسی وضعیت</button><div id="trackingResult" style="margin-top:16px"></div></form></main>`;
}

function accountBody() {
  return `<main class="account-screen"><div class="account-card"><a class="account-back" href="index.html" aria-label="بازگشت">→</a><img class="account-logo" src="${logoUrl}" alt="ELEVEN" onerror="this.onerror=null;this.src='assets/images/logo-fallback.svg'"><h1>به پنل کاربری خوش آمدید.</h1><p>برای ورود / ثبت نام شماره موبایل خود را وارد کنید</p><form id="accountForm"><label for="phone">شماره موبایل</label><input id="phone" name="phone" inputmode="tel" required><button type="submit">ارسال کد</button></form><p class="terms">با ورود یا ثبت‌نام در این وب‌سایت، شما به طور خودکار تمام قوانین و مقررات استفاده از سایت را قبول می‌کنید.</p></div></main>`;
}

function notFoundBody() { return `<main class="container empty" style="min-height:55vh"><h1 style="font-size:75px;margin:50px 0 0">۴۰۴</h1><p>صفحه موردنظر پیدا نشد.</p><a class="primary" href="index.html">بازگشت به فروشگاه</a></main>`; }

// Generate the shared catalog consumed by the interaction layer.
out("assets/js/catalog.js", `window.ELEVEN_PRODUCTS=${JSON.stringify(products)};window.ELEVEN_CATEGORIES=${JSON.stringify(categories)};`);

out("index.html", base("فروشگاه لباس مردانه الون | خرید پوشاک مردانه ELEVEN", homeBody(), { className: "home-page" }));
const shopCategory = { name: "فروشگاه", description: "", count: products.length };
out("shop.html", base("فروشگاه | الون استایل", categoryBody(shopCategory, products), { className: "shop-page" }));
for (let page = 2; page <= Math.ceil(products.length / 12); page += 1) {
  out(`shop-page-${page}.html`, base("فروشگاه | الون استایل", categoryBody(shopCategory, products, page), { className: "shop-page" }));
}
for (const c of categories) {
  const file = categoryFile(c.slug);
  const items = products.filter((p) => p.category === c.slug || p.categorySlugs?.includes(c.slug));
  out(file, base(`${c.name} | الون استایل`, categoryBody(c, items)));
  const pages = Math.max(1, Math.ceil(Number(c.count || items.length) / 12));
  for (let page = 2; page <= pages; page += 1) {
    out(categoryPageFile(c.slug, page), base(`${c.name} | الون استایل`, categoryBody(c, items, page)));
  }
}
for (const p of products) out(productFile(p.slug), base(`${p.name} | الون استایل`, productBody(p)));
// This product is returned by the live search archive but is not present in
// the Store API snapshot used for the static catalogue.  Keep a local detail
// route so the search result never dead-ends.
const hermesLinen = {
  slug: "hermes-linen-shirt",
  name: "پیراهن لنین Hermes الون",
  category: "men-shirt",
  categoryName: "پیراهن مردانه",
  price: 998000,
  regularPrice: 998000,
  images: ["https://elevenstyle.ir/wp-content/uploads/2026/09/پیراهن-لنین-Hermes-زرشکی.webp"],
  colors: ["زرشکی"],
  sizes: ["M", "L", "XL", "XXL"],
  inStock: true,
  description: "پیراهن لنین Hermes با پارچه‌ای سبک و تن‌خور راحت برای استایل روزمره."
};
out(productFile(hermesLinen.slug), base(`${hermesLinen.name} | الون استایل`, productBody(hermesLinen)));
out("cart.html", base("سبد خرید | الون استایل", cartBody()));
out("checkout.html", base("تسویه حساب | الون استایل", checkoutBody()));
out("search.html", base("جستجو | الون استایل", searchBody(), { className: "search-page" }));
out("tracking.html", base("پیگیری سفارش | الون استایل", trackingBody()));
out("order-tracking.html", base("پیگیری سفارش | الون استایل", trackingBody()));
out("account.html", base("ورود | الون استایل", accountBody(), { includeChrome: false, className: "account-page" }));
out("my-account.html", base("ورود | الون استایل", accountBody(), { includeChrome: false, className: "account-page" }));
out("404.html", base("صفحه پیدا نشد | الون استایل", notFoundBody()));

console.log(`Generated ${products.length} product pages, ${categories.length} category pages and shared pages.`);
