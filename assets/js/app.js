(() => {
  "use strict";

  const products = Array.isArray(window.ELEVEN_PRODUCTS) ? window.ELEVEN_PRODUCTS : [];
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const digits = (value) => String(value).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const number = (value) => Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;
  const money = (value) => `${new Intl.NumberFormat("fa-IR").format(number(value))} تومان`;
  const product = (slug) => products.find((p) => p.slug === slug);

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem("eleven_cart") || "[]");
      return Array.isArray(parsed) ? parsed.map((item) => ({
        slug: item.slug || item.product?.slug,
        name: item.name || item.product?.name || "محصول",
        price: number(item.price || item.product?.price),
        img: item.img || item.image || item.product?.images?.[0] || "assets/images/product-placeholder.svg",
        cat: item.cat || item.categoryName || item.product?.categoryName || "",
        size: item.size || "",
        color: item.color || "",
        qty: Math.max(1, number(item.qty) || 1),
      })).filter((item) => item.slug) : [];
    } catch {
      return [];
    }
  }
  function writeCart(items) {
    localStorage.setItem("eleven_cart", JSON.stringify(items));
    updateBadge();
    renderMiniCart();
    renderCartPage();
    renderCheckout();
  }
  function cartKey(item) { return `${item.slug}|${item.size || "-"}|${item.color || "-"}`; }
  function updateBadge() {
    const count = readCart().reduce((sum, item) => sum + item.qty, 0);
    $$(".cart-badge").forEach((el) => {
      el.textContent = digits(count);
      el.hidden = count === 0;
    });
  }
  function addToCart(item, qty = 1) {
    const items = readCart();
    const normalized = { ...item, price: number(item.price), qty: Math.max(1, number(qty) || 1) };
    const found = items.find((x) => cartKey(x) === cartKey(normalized));
    if (found) found.qty += normalized.qty;
    else items.push(normalized);
    writeCart(items);
    openCart();
  }
  function removeFromCart(index) {
    const items = readCart();
    items.splice(index, 1);
    writeCart(items);
  }
  function setCartQty(index, qty) {
    const items = readCart();
    if (!items[index]) return;
    items[index].qty = Math.max(1, number(qty) || 1);
    writeCart(items);
  }
  window.addProduct = (item) => addToCart(item);

  function productFromElement(element) {
    const p = product(element?.dataset.slug);
    if (!p) return null;
    return {
      slug: p.slug,
      name: p.name,
      price: p.price,
      img: p.images?.[0] || "assets/images/product-placeholder.svg",
      cat: p.categoryName,
      size: element.dataset.size || "",
      color: element.dataset.color || "",
    };
  }
  function addCardProduct(button) {
    const card = button.closest("[data-product-card]");
    const item = productFromElement(card);
    if (item) addToCart(item);
  }

  function miniCartRow(item, index) {
    return `<div class="mini-cart-row" style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #eee"><img src="${item.img}" alt="" onerror="this.onerror=null;this.src='assets/images/product-placeholder.svg'" style="width:64px;height:84px;object-fit:cover"><div style="flex:1;min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</b><small style="color:#888">${item.size || item.color ? `${item.size ? `سایز ${item.size}` : ""}${item.size && item.color ? " / " : ""}${item.color ? `رنگ ${item.color}` : ""}` : ""}</small><div style="margin-top:5px">${digits(item.qty)} × ${money(item.price)}</div><div style="display:flex;gap:5px;margin-top:6px"><button type="button" data-mini-minus="${index}" style="border:1px solid #ddd;background:#fff;width:24px">−</button><button type="button" data-mini-plus="${index}" style="border:1px solid #ddd;background:#fff;width:24px">＋</button></div></div><button type="button" data-remove-cart="${index}" style="border:0;background:none;font-size:22px;align-self:flex-start">×</button></div>`;
  }
  function renderMiniCart() {
    const target = $("#miniCartItems");
    if (!target) return;
    const items = readCart();
    target.innerHTML = items.length ? items.map(miniCartRow).join("") : '<div class="empty" style="padding:50px 0">سبد خرید شما خالی است.</div>';
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalEl = $("#miniTotal");
    if (totalEl) totalEl.textContent = money(total);
  }
  function cartRow(item, index) {
    return `<tr><td><div class="cart-prod"><img src="${item.img}" alt="${item.name}" onerror="this.onerror=null;this.src='assets/images/product-placeholder.svg'"><div><b>${item.name}</b><div style="color:#888;font-size:12px">${item.cat || ""}</div>${item.size || item.color ? `<div style="color:#888;font-size:12px">${item.size ? `سایز ${item.size}` : ""}${item.size && item.color ? " / " : ""}${item.color ? `رنگ ${item.color}` : ""}</div>` : ""}</div></div></td><td>${money(item.price)}</td><td><div class="qty"><button type="button" data-cart-minus="${index}">−</button><input value="${digits(item.qty)}" data-cart-input="${index}" inputmode="numeric"><button type="button" data-cart-plus="${index}">＋</button></div></td><td><button type="button" data-remove-cart="${index}" style="border:0;background:none;font-size:22px">×</button></td></tr>`;
  }
  function renderCartPage() {
    const target = $("#cartBody");
    if (!target) return;
    const items = readCart();
    $("#cartEmptyState")?.classList.toggle("is-visible", !items.length);
    $("#cartContent")?.classList.toggle("is-visible", Boolean(items.length));
    if (!items.length) {
      target.innerHTML = '<tr><td colspan="4"><div class="empty">سبد خرید شما در حال حاضر خالی است.<br><a class="primary" href="shop.html" style="margin-top:15px">بازگشت به فروشگاه</a></div></td></tr>';
    } else target.innerHTML = items.map(cartRow).join("");
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    [$("#cartTotal"), $("#cartTotal2")].forEach((el) => { if (el) el.textContent = money(total); });
  }
  function renderCheckout() {
    const target = $("#checkoutItems");
    if (!target) return;
    const items = readCart();
    target.innerHTML = items.length ? `<ul style="list-style:none;margin:0;padding:0">${items.map((i) => `<li style="display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid #eee"><span>${i.name} × ${digits(i.qty)}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}</ul>` : '<p style="color:#777">سبد خرید شما خالی است.</p>';
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    if ($("#checkoutTotal")) $("#checkoutTotal").textContent = money(total);
  }

  function openLayer(element) {
    if (!element) return;
    $(".overlay")?.classList.add("show");
    element.classList.add("show");
    document.body.classList.add("drawer-open");
  }
  function closeLayers() {
    $(".overlay")?.classList.remove("show");
    $("#cartDrawer")?.classList.remove("show");
    $("#mobileNav")?.classList.remove("show");
    $("#searchModal")?.classList.remove("show");
    $(".sidebar")?.classList.remove("filters-open");
    document.body.classList.remove("drawer-open");
  }
  function openCart() { renderMiniCart(); openLayer($("#cartDrawer")); }
  function openMenu() { openLayer($("#mobileNav")); }
  window.openCart = openCart;
  window.openMenu = openMenu;
  window.closeLayers = closeLayers;

  function injectSearchModal() {
    if ($("#searchModal")) return;
    const modal = document.createElement("div");
    modal.id = "searchModal";
    modal.innerHTML = `<div class="search-modal-inner"><button type="button" class="search-close" aria-label="بستن">×</button><form action="search.html" method="get"><input name="q" autofocus placeholder="دنبال چه محصولی هستی؟"><button type="submit">${document.querySelector(".search-trigger")?.innerHTML || "⌕"}</button></form></div>`;
    document.body.append(modal);
    modal.addEventListener("click", (event) => { if (event.target === modal || event.target.closest(".search-close")) closeLayers(); });
  }

  function cardForSearch(p) {
    return `<article class="product-card" data-product-card data-slug="${p.slug}" data-name="${p.name}"><div class="product-image"><a href="product-${p.slug}.html"><img src="${p.images?.[0] || "assets/images/product-placeholder.svg"}" alt="${p.name}" onerror="this.onerror=null;this.src='assets/images/product-placeholder.svg'"></a><div class="quick"><button type="button" data-add-product>＋</button></div></div><div class="product-body"><div class="product-cat">${p.categoryName || ""}</div><a class="product-name" href="product-${p.slug}.html">${p.name}</a><div class="price">${new Intl.NumberFormat("en-US").format(p.price)} <span>تومان</span></div></div></article>`;
  }
  function setupSearch() {
    const form = $("#searchForm");
    const query = new URLSearchParams(location.search).get("q") || new URLSearchParams(location.search).get("s") || "";
    const queryEl = $("#searchQuery");
    if (queryEl) queryEl.textContent = query || "";
    if (!form) return;
    const input = $("#searchInput");
    if (input) input.value = query;
    const apply = (q) => {
      const normalized = q.trim().toLocaleLowerCase("fa");
      const results = normalized ? products.filter((p) => `${p.name} ${p.categoryName}`.toLocaleLowerCase("fa").includes(normalized)) : [];
      if ($("#searchTitle")) $("#searchTitle").textContent = normalized ? `نتایج جستجو برای «${q}»` : "جستجو";
      if ($("#searchDescription")) $("#searchDescription").textContent = normalized && !results.length ? "محصولی مطابق با جستجوی شما پیدا نشد." : "";
      if ($("#searchResults")) $("#searchResults").innerHTML = results.length ? results.map(cardForSearch).join("") : (normalized ? '<div class="empty">محصولی پیدا نشد.</div>' : "");
    };
    apply(query);
    form.addEventListener("submit", (event) => { event.preventDefault(); const q = input?.value.trim() || ""; location.href = `search.html?q=${encodeURIComponent(q)}`; });
  }

  function setupFilters() {
    const layout = $(".shop-layout");
    if (!layout) return;
    const inputs = $$(".filter-list input", layout);
    const cards = $$('[data-product-card]', layout);
    if (!inputs.length || !cards.length) return;
    const apply = () => {
      const colors = inputs.filter((x) => x.closest(".filter-group")?.querySelector("h4")?.textContent.includes("رنگ") && x.checked).map((x) => x.value);
      const sizes = inputs.filter((x) => x.closest(".filter-group")?.querySelector("h4")?.textContent.includes("اندازه") && x.checked).map((x) => x.value);
      let visible = 0;
      cards.forEach((card) => {
        const cardColors = (card.dataset.colors || "").split("|").filter(Boolean);
        const cardSizes = (card.dataset.sizes || "").split("|").filter(Boolean);
        const colorMatch = !colors.length || colors.some((value) => cardColors.includes(value));
        const sizeMatch = !sizes.length || sizes.some((value) => cardSizes.includes(value));
        const show = colorMatch && sizeMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });
      const result = $(".category-result", layout.parentElement) || $(".shop-toolbar .result", layout);
      if (result) result.textContent = `نمایش ${digits(visible)} نتیجه`;
    };
    inputs.forEach((input) => input.addEventListener("change", apply));
  }

  function setupHero() {
    $$(".hero-slider").forEach((slider) => {
      const slides = $$(".hero-slide", slider);
      const dots = $$(".hero-dot", slider);
      if (slides.length < 2) return;
      let index = slides.findIndex((slide) => slide.classList.contains("active"));
      if (index < 0) index = 0;
      const select = (next) => {
        slides[index]?.classList.remove("active");
        dots[index]?.classList.remove("active");
        index = (next + slides.length) % slides.length;
        slides[index]?.classList.add("active");
        dots[index]?.classList.add("active");
      };
      dots.forEach((dot, i) => dot.addEventListener("click", () => select(i)));
      setInterval(() => select(index + 1), 4000);
    });
  }
  function setupProductPage() {
    const add = $("[data-product-add]");
    if (!add) return;
    const p = product(add.dataset.slug);
    if (!p) return;
    let color = p.colors?.[0] || "";
    let size = p.sizes?.[0] || "";
    const qtyInput = $(".qty input");
    $$("[data-option='color']").forEach((button) => button.addEventListener("click", () => { $$('[data-option="color"]').forEach((x) => x.classList.remove("active")); button.classList.add("active"); color = button.textContent.trim(); }));
    $$("[data-option='size']").forEach((button) => button.addEventListener("click", () => { $$('[data-option="size"]').forEach((x) => x.classList.remove("active")); button.classList.add("active"); size = button.textContent.trim(); }));
    $("[data-qty-minus]")?.addEventListener("click", () => { if (qtyInput) qtyInput.value = String(Math.max(1, number(qtyInput.value) - 1)); });
    $("[data-qty-plus]")?.addEventListener("click", () => { if (qtyInput) qtyInput.value = String(Math.max(1, number(qtyInput.value) + 1)); });
    add.addEventListener("click", () => addToCart({ slug: p.slug, name: p.name, price: p.price, img: p.images?.[0], cat: p.categoryName, color, size }, number(qtyInput?.value) || 1));
    setupProductZoom();
    $$(`[data-gallery-image]`).forEach((button) => button.addEventListener("click", () => { const main = $("#mainProductImage"); if (!main) return; main.src = button.dataset.galleryImage || "assets/images/product-placeholder.svg"; $(".zoom-image")?.setAttribute("src", main.src); $(".main-photo")?.classList.remove("is-zoomed"); $$(".thumb").forEach((x) => x.classList.remove("active")); button.classList.add("active"); }));
    $$(".tab-buttons button").forEach((button) => button.addEventListener("click", () => { $$(".tab-buttons button").forEach((x) => x.classList.remove("active")); button.classList.add("active"); }));
  }

  function setupProductZoom() {
    const photo = $(".main-photo");
    const main = $("#mainProductImage");
    if (!photo || !main || photo.querySelector(".zoom-image")) return;
    const zoom = document.createElement("img");
    zoom.className = "zoom-image";
    zoom.alt = "";
    zoom.setAttribute("aria-hidden", "true");
    zoom.src = main.currentSrc || main.src;
    photo.append(zoom);
    const supported = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const move = (event) => {
      if (!supported()) return;
      const rect = photo.getBoundingClientRect();
      const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const zoomWidth = 1000;
      const zoomHeight = zoomWidth * ((main.naturalHeight || 4) / (main.naturalWidth || 3));
      zoom.style.width = `${zoomWidth}px`;
      zoom.style.height = `${zoomHeight}px`;
      zoom.style.transform = `translate(${-(zoomWidth - rect.width) * px}px, ${-(zoomHeight - rect.height) * py}px)`;
      photo.classList.add("is-zoomed");
    };
    photo.addEventListener("mouseenter", move);
    photo.addEventListener("mousemove", move);
    photo.addEventListener("mouseleave", () => photo.classList.remove("is-zoomed"));
  }

  function setupTracking() {
    const form = $("#trackingForm");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const code = new FormData(form).get("code")?.toString().trim().toUpperCase();
      const target = $("#trackingResult");
      if (!target) return;
      target.innerHTML = code === "EL-10248" ? '<div style="padding:13px;border:1px solid #ddd"><b>سفارش EL-10248</b><br><span style="color:#777">وضعیت: ارسال شده با پست پیشتاز</span></div>' : '<p style="color:#c21d36">سفارشی با این مشخصات پیدا نشد.</p>';
    });
  }
  function setupAccount() {
    $("#accountForm")?.addEventListener("submit", (event) => { event.preventDefault(); alert("کد ورود به شماره موبایل شما ارسال شد."); });
  }

  function setupGlobalEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest?.("button, a");
      if (!target) return;
      if (target.matches(".search-trigger")) { injectSearchModal(); openLayer($("#searchModal")); $("#searchModal input")?.focus(); }
      if (target.matches("[data-add-product]")) { event.preventDefault(); addCardProduct(target); }
      const remove = target.getAttribute("data-remove-cart");
      if (remove !== null) { event.preventDefault(); removeFromCart(number(remove)); }
      const minus = target.getAttribute("data-cart-minus") ?? target.getAttribute("data-mini-minus");
      if (minus !== null) { event.preventDefault(); const items = readCart(); setCartQty(number(minus), (items[number(minus)]?.qty || 1) - 1); }
      const plus = target.getAttribute("data-cart-plus") ?? target.getAttribute("data-mini-plus");
      if (plus !== null) { event.preventDefault(); const items = readCart(); setCartQty(number(plus), (items[number(plus)]?.qty || 1) + 1); }
    });
    $(".overlay")?.addEventListener("click", closeLayers);
    $(".floating-chat button")?.addEventListener("click", () => alert("پشتیبانی الون استایل در خدمت شماست."));
    const trackingModal = $("#trackingModal");
    const closeTracking = () => { trackingModal?.classList.remove("show"); trackingModal?.setAttribute("aria-hidden", "true"); document.body.classList.remove("drawer-open"); };
    $("#trackingTrigger")?.addEventListener("click", () => { trackingModal?.classList.add("show"); trackingModal?.setAttribute("aria-hidden", "false"); document.body.classList.add("drawer-open"); $("#floatingTrackingForm input")?.focus(); });
    $(".tracking-close")?.addEventListener("click", closeTracking);
    trackingModal?.addEventListener("click", (event) => { if (event.target === trackingModal) closeTracking(); });
    $("#floatingTrackingForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const code = new FormData(event.currentTarget).get("code")?.toString().trim().toUpperCase();
      const target = $("#floatingTrackingResult");
      if (target) target.innerHTML = code === "EL-10248" ? "وضعیت سفارش: ارسال شده با پست پیشتاز." : "سفارشی با این مشخصات پیدا نشد.";
    });
    $("#checkoutForm")?.addEventListener("submit", (event) => { event.preventDefault(); if (!readCart().length) { alert("سبد خرید شما خالی است."); return; } localStorage.removeItem("eleven_cart"); alert("سفارش شما با موفقیت ثبت شد."); location.href = "tracking.html?code=EL-10248"; });
  }

  window.toggleFilters = () => {
    const sidebar = $(".sidebar");
    if (!sidebar) return;
    const open = sidebar.classList.toggle("filters-open");
    $(".overlay")?.classList.toggle("show", open);
    document.body.classList.toggle("drawer-open", open);
  };
  document.addEventListener("DOMContentLoaded", () => {
    updateBadge();
    renderMiniCart();
    renderCartPage();
    renderCheckout();
    if ($("#checkoutForm") && !readCart().length) { location.replace("cart.html"); return; }
    setupHero();
    setupSearch();
    setupFilters();
    setupProductPage();
    setupTracking();
    setupAccount();
    setupGlobalEvents();
  });
})();
