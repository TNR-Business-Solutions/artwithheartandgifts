import { loadProducts } from "./products.js";
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const navToggle = document.querySelector(".nav-toggle");
if (navToggle) {
  const menu = document.getElementById("navMenu");
  // Ensure ARIA state is initialized
  if (!navToggle.hasAttribute("aria-expanded"))
    navToggle.setAttribute("aria-expanded", "false");
  if (menu && !menu.hasAttribute("aria-expanded"))
    menu.setAttribute("aria-expanded", "false");

  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    menu?.setAttribute("aria-expanded", String(!expanded));
  });

  // Close mobile menu when a nav link is clicked
  menu?.addEventListener("click", (ev) => {
    const a = ev.target.closest("a");
    if (!a) return;
    // allow normal navigation; but close menu for mobile UX
    navToggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-expanded", "false");
  });
}
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const featuredCollections = document.getElementById("featuredCollections");
const cols = [
  {
    slug: "healing",
    title: "Healing & Resilience",
    img: "/images/angels-set-of-3.jpg",
    desc: "Art inspired by overcoming COPD & fibromyalgia.",
  },
  {
    slug: "florida",
    title: "Florida Inspirations",
    img: "/images/lighthouse-big-red.jpg",
    desc: "Sun-kissed coastal & inland color stories.",
  },
  {
    slug: "murals",
    title: "Murals & Commissions",
    img: "/images/pumpkin-man.jpg",
    desc: "Transform walls into immersive narratives.",
  },
];

async function initHome() {
  const newContainer = document.getElementById("newProducts");
  if (newContainer) {
    const products = await loadProducts();
    products
      .slice(0, 6)
      .forEach((p) => newContainer.appendChild(renderProductCard(p)));
  }

  // Inject hero image and featured collections using responsive pictures
  await loadResponsiveManifest();
  // Hero
  try {
    const heroEl = document.getElementById("heroImage");
    if (heroEl) {
      const pic =
        typeof buildResponsivePicture === "function"
          ? buildResponsivePicture("/images/heroimage.png", "Hero image", true)
          : `<img src='/images/heroimage.png' alt='Hero image' loading='eager'>`;
      heroEl.innerHTML = pic;
    }
  } catch (e) {
    // ignore
  }

  // Featured collections
  if (featuredCollections) {
    featuredCollections.innerHTML = cols
      .map((c) => {
        const pic =
          typeof buildResponsivePicture === "function"
            ? buildResponsivePicture(c.img, `${c.title} preview`, false)
            : `<img src='${c.img}' alt='${c.title} preview' loading='lazy' />`;
        return `<article class='card'>${pic}<h3>${c.title}</h3><p>${c.desc}</p><a class='btn secondary' href='/collections.html#${c.slug}'>Explore</a></article>`;
      })
      .join("");
  }
}

function renderProductCard(p) {
  const el = document.createElement("article");
  el.className = "product-card";
  const badge = p.specialOrder
    ? "<span class='badge badge-special'>SPECIAL ORDER</span>"
    : p.type === "original"
    ? "<span class='badge badge-original'>ORIGINAL</span>"
    : "<span class='badge badge-print'>PRINT</span>";

  // Use simple img tag to ensure images load
  const pic = `<img src='${p.image}' alt='${
    p.alt || p.title
  }' loading='lazy' decoding='async' style='width: 100%; height: 200px; object-fit: cover;'>`;
  const price = `$${Number(p.price).toFixed(2)}`;

  // Add to cart button (all items now have prices)
  const addToCartBtn = `<button class='add-to-cart-btn' onclick='window.cart.addItem(${JSON.stringify(
    p
  ).replace(/"/g, "&quot;")})'>Add to Cart</button>`;

  el.innerHTML = `${badge}${pic}<h3>${
    p.title
  }</h3><div class='price'>${price}</div><div class='meta'>${
    p.type || "print"
  } • ${
    p.size
  }</div><a class='btn ghost' href='/product.html?id=${encodeURIComponent(
    p.id
  )}'>Details</a>${addToCartBtn}`;
  return el;
}

// Responsive images helpers
let _respManifest = null;
async function loadResponsiveManifest() {
  if (_respManifest !== null) return _respManifest;
  try {
    const r = await fetch("/images/responsive-manifest.json");
    if (!r.ok) return (_respManifest = {});
    _respManifest = await r.json();
    return _respManifest;
  } catch (e) {
    _respManifest = {};
    return _respManifest;
  }
}

function buildResponsivePicture(src, alt, highPriority = false) {
  const base = src.split("/").pop();
  const manifest = _respManifest || {};
  const info = manifest[base];

  // If no manifest or variants, return simple img
  if (!info || !info.variants || info.variants.length === 0) {
    return `<img src='${src}' alt='${alt}' loading='lazy' decoding='async' ${
      highPriority ? "fetchpriority='high'" : ""
    }>`;
  }

  const webp = info.variants
    .filter((v) => v.format === "webp" && v.width && v.file)
    .sort((a, b) => a.width - b.width);
  const jpg = info.variants
    .filter((v) => v.format === "jpg" && v.width && v.file)
    .sort((a, b) => a.width - b.width);

  // If no valid variants, return simple img
  if (webp.length === 0 && jpg.length === 0) {
    return `<img src='${src}' alt='${alt}' loading='lazy' decoding='async' ${
      highPriority ? "fetchpriority='high'" : ""
    }>`;
  }

  const makeSrcset = (arr) =>
    arr.map((v) => `/images/${v.file} ${v.width}w`).join(", ");

  const jpgSrcset = jpg.length > 0 ? makeSrcset(jpg) : "";
  const webpSrcset = webp.length > 0 ? makeSrcset(webp) : "";

  const largest =
    jpg.length > 0
      ? `/images/${jpg[jpg.length - 1].file}`
      : webp.length > 0
      ? `/images/${webp[webp.length - 1].file}`
      : src;

  return `<picture>${
    webpSrcset
      ? `<source type='image/webp' srcset='${webpSrcset}' sizes='(max-width:1200px) 100vw, 1200px'>`
      : ""
  }${
    jpgSrcset
      ? `<source type='image/jpeg' srcset='${jpgSrcset}' sizes='(max-width:1200px) 100vw, 1200px'>`
      : ""
  }<img src='${largest}' alt='${alt}' loading='lazy' decoding='async' ${
    highPriority ? "fetchpriority='high'" : ""
  }></picture>`;
}

async function initShop() {
  if (document.body.dataset.page !== "shop") return;
  const grid = document.getElementById("productGrid");
  const typeSel = document.getElementById("filterType");
  const collSel = document.getElementById("filterCollection");
  const sortSel = document.getElementById("sort");
  const products = await loadProducts();

  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 24;
  let filteredProducts = [];

  function apply() {
    let list = [...products];

    // Filter for shop items - show both originals and prints, exclude only gallery items
    list = list.filter((p) => {
      // Must have a price > 0 (exclude free gallery items)
      if (!p.price || p.price <= 0) return false;

      // Exclude items with type "gallery" (these are display-only)
      if (p.type === "gallery") return false;

      // Include ALL items with prices (originals, prints, and Charmin prints)
      return true;
    });

    switch (sortSel.value) {
      case "priceLow":
        list.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        list.sort((a, b) => b.price - a.price);
        break;
      default:
        list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (typeSel.value) list = list.filter((p) => p.type === typeSel.value);
    if (collSel.value)
      list = list.filter((p) => (p.collections || []).includes(collSel.value));

    filteredProducts = list;
    currentPage = 1; // Reset to first page when filters change
    renderProducts();
    updatePagination();
  }

  function renderProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    grid.innerHTML = pageProducts
      .map((p) => renderProductCard(p).outerHTML)
      .join("");
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    const pageNumbers = document.getElementById("pageNumbers");
    const paginationInfo = document.getElementById("paginationInfo");

    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    // Update page numbers
    pageNumbers.innerHTML = "";
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener("click", () => goToPage(i));
      pageNumbers.appendChild(pageBtn);
    }

    // Update pagination info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(
      currentPage * itemsPerPage,
      filteredProducts.length
    );
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredProducts.length} products`;
  }

  function goToPage(page) {
    currentPage = page;
    renderProducts();
    updatePagination();

    // Scroll to top of product grid
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Event listeners
  [typeSel, collSel, sortSel].forEach((el) =>
    el?.addEventListener("change", apply)
  );

  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });

  document.getElementById("nextPage")?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) goToPage(currentPage + 1);
  });

  apply();
}

async function initProduct() {
  if (!location.pathname.endsWith("/product.html")) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const products = await loadProducts();
  const product = products.find((p) => p.id === id);
  const container = document.getElementById("productDetail");
  if (!container) return;
  if (!product) {
    container.innerHTML = "<p>Product not found.</p>";
    return;
  }
  // ensure responsive manifest is loaded so buildResponsivePicture can work
  await loadResponsiveManifest();
  const pic = `<img src='${product.image}' alt='${
    product.alt || product.title
  }' style='max-width: 100%; height: auto; max-height: 500px; object-fit: contain;'>`;

  const price =
    product.price > 0
      ? `$${Number(product.price).toFixed(2)}`
      : "Contact for Price";
  const purchaseButton =
    product.price > 0
      ? `<button class='btn primary' onclick='addToCartAndCheckout("${product.id}", "${product.title}", ${product.price})'>Add to Cart & Checkout</button>`
      : `<a class='btn primary' href='/contact.html?subject=Inquiry: ${encodeURIComponent(
          product.title
        )}'>Contact for Price</a>`;

  container.innerHTML = `
    <div class='detail-layout'>
      <div class='media'>${pic}</div>
      <div class='info'>
        <h1>${product.title}</h1>
        <p class='price'>${price}</p>
        <p>${product.alt || product.title}</p>
        <div class='product-actions'>
          ${purchaseButton}
          <a class='btn secondary' href='/shop.html'>Back to Shop</a>
        </div>
        <div id='payment-container' class='payment-container' style='display: none;'></div>
      </div>
    </div>
  `;
}

// Add to cart and checkout function
function addToCartAndCheckout(productId, productTitle, productPrice) {
  // Create a product object for the cart
  const product = {
    id: productId,
    title: productTitle,
    price: productPrice,
    image: "", // Will be filled by cart
    size: "Various",
    type: "print",
    quantity: 1,
  };

  // Add to cart
  if (window.cart) {
    window.cart.addItem(product);
    // Redirect to shop page to show cart and checkout
    window.location.href = "/shop.html";
  } else {
    alert("Cart not available. Please try again.");
  }
}

async function initGallery() {
  if (document.body.dataset.page !== "gallery") return;
  const grid = document.getElementById("galleryGrid");

  // Load gallery data directly from data-gallery.json
  let galleryData = [];
  try {
    const response = await fetch("/data-gallery.json");
    galleryData = await response.json();
  } catch (error) {
    console.error("Error loading gallery data:", error);
    return;
  }

  // Use all gallery items
  let listAll = galleryData;

  // Check for collection filter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const collectionId = urlParams.get("collection");

  if (collectionId) {
    // Load collections data and filter gallery items
    try {
      const collectionsResponse = await fetch("/data-collections.json");
      const collections = await collectionsResponse.json();
      const collection = collections.find((c) => c.id === collectionId);

      if (collection) {
        // Filter products by collection theme and category
        const theme = collection.theme;
        listAll = listAll.filter((p) => {
          // Filter by category
          if (
            p.category &&
            p.category.toLowerCase().includes(theme.toLowerCase())
          ) {
            return true;
          }
          // Filter by collection field if it exists
          if (p.collection && p.collection.includes(collectionId)) {
            return true;
          }
          // Special handling for specific collections
          if (
            collectionId === "healing-journey" &&
            (p.category === "healing" || p.collection === "healing-journey")
          ) {
            return true;
          }
          if (
            collectionId === "workspace-collection" &&
            (p.collection === "workspace-collection" ||
              p.title.includes("workspace"))
          ) {
            return true;
          }
          if (
            collectionId === "family-moments" &&
            (p.category === "family" ||
              p.collection === "family-moments" ||
              p.title.includes("charmin"))
          ) {
            return true;
          }
          if (
            collectionId === "nature-inspired" &&
            (p.category === "nature" || p.collection === "florida-inspirations")
          ) {
            return true;
          }
          if (
            collectionId === "abstract-expressions" &&
            (p.category === "abstract" ||
              p.collection === "abstract-expressions")
          ) {
            return true;
          }
          if (collectionId === "featured-collection" && p.featured === true) {
            return true;
          }
          return false;
        });

        // Update page title to show collection name
        document.title = `${collection.title} Collection – Art with Heart & Gifts`;

        // Add collection header
        const collectionHeader = document.createElement("div");
        collectionHeader.className = "collection-header";
        collectionHeader.innerHTML = `
          <h1>${collection.title} Collection</h1>
          <p>${collection.description}</p>
          <p class="collection-count">${collection.galleryCount} artworks in this collection</p>
          <a href="/collections.html" class="btn secondary">← Back to Collections</a>
        `;
        grid.parentNode.insertBefore(collectionHeader, grid);
      }
    } catch (error) {
      console.error("Error loading collection:", error);
    }
  }
  // Normalize image paths so they resolve whether the site is served via
  // Vite (public/ mapped to /) or a simple static server serving the repo root
  // (images may live under ./public/images). This probes each unique image
  // and rewrites `p.image` to a working URL when possible.
  async function normalizeImages(items) {
    const seen = new Map();
    const head = async (u) => {
      try {
        const r = await fetch(u, { method: "HEAD" });
        return r.ok;
      } catch (e) {
        return false;
      }
    };
    const originBase = location.origin;
    const localBase = location.href;
    const toCheck = Array.from(
      new Set(items.map((i) => i.image).filter(Boolean))
    );
    await Promise.all(
      toCheck.map(async (img) => {
        if (seen.has(img)) return;
        // try image as-is (absolute or relative)
        let ok = await head(
          img.startsWith("http") ? img : new URL(img, localBase).href
        );
        if (ok) return seen.set(img, img);
        // try /public prefix (common when files live in public/ but server root is repo)
        try {
          const pub = img.startsWith("/") ? `/public${img}` : `/public/${img}`;
          ok = await head(new URL(pub, originBase).href);
          if (ok) return seen.set(img, new URL(pub, originBase).href);
        } catch (e) {
          // ignore
        }
        // try resolving to /images/<basename>
        try {
          const base = img.split("/").pop();
          const candidate = `/images/${base}`;
          ok = await head(new URL(candidate, originBase).href);
          if (ok) return seen.set(img, new URL(candidate, originBase).href);
        } catch (e) {}
        // fallback to original
        seen.set(img, img);
      })
    );
    // rewrite items
    items.forEach((p) => {
      if (p && p.image && seen.has(p.image)) p.image = seen.get(p.image);
    });
  }
  await normalizeImages(listAll);
  // load responsive manifest to enable picture srcset generation
  await loadResponsiveManifest();
  // Pagination state
  const controlsTop = document.getElementById("galleryControlsTop");
  const controlsBottom = document.getElementById("galleryControlsBottom");
  let pageSize = Number(localStorage.getItem("gallery_page_size") || 25);
  let page = 1;

  function buildControls(total) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageInfo = `<div class='page-info'>Page ${page} of ${totalPages} (${total} items)</div>`;
    const pager = `<div class='pager'>
      <button data-action='first' ${
        page === 1 ? "disabled" : ""
      }>&laquo;</button>
      <button data-action='prev' ${
        page === 1 ? "disabled" : ""
      }>&lsaquo;</button>
      <span class='pager-pages'>${Array.from({ length: totalPages })
        .map(
          (_, i) =>
            `<button data-page='${i + 1}' ${
              i + 1 === page ? 'aria-current="true"' : ""
            }>${i + 1}</button>`
        )
        .join("")}</span>
      <button data-action='next' ${
        page === totalPages ? "disabled" : ""
      }>&rsaquo;</button>
      <button data-action='last' ${
        page === totalPages ? "disabled" : ""
      }>&raquo;</button>
    </div>`;
    controlsTop.innerHTML = `<div class="pagination-container">${pageInfo}${pager}</div>`;
    controlsBottom.innerHTML = `<div class="pagination-container">${pageInfo}${pager}</div>`;
    // pager button events
    [controlsTop, controlsBottom].forEach((c) =>
      c.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const pnum = btn.getAttribute("data-page");
        if (action === "first") page = 1;
        else if (action === "prev") page = Math.max(1, page - 1);
        else if (action === "next") page = Math.min(totalPages, page + 1);
        else if (action === "last") page = totalPages;
        else if (pnum) page = Number(pnum);
        render();
      })
    );
  }

  function render() {
    let list = [...listAll];
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * pageSize;
    const slice = list.slice(start, start + pageSize);
    grid.innerHTML = slice
      .map((p, idx) => {
        const high = idx < 3;
        const pic =
          typeof buildResponsivePicture === "function"
            ? buildResponsivePicture(p.image, p.alt || p.title, high)
            : `<img src='${p.image}' alt='${
                p.alt || p.title
              }' loading='lazy' decoding='async' ${
                high ? "fetchpriority='high'" : ""
              }>`;

        // Different rendering for gallery vs shop
        if (document.body.dataset.page === "gallery") {
          return `
            <div class="masonry-item">
              ${pic}
            </div>
          `;
        } else {
          return `<article class='product-card'>${pic}</article>`;
        }
      })
      .join("");
    buildControls(total);
  }

  render();
}

(async () => {
  await Promise.all([initHome(), initShop(), initProduct(), initGallery()]);
  // Replace inline <img> tags that reference site images with responsive <picture>
  try {
    await replaceInlineImages();
  } catch (e) {
    // ignore replacement errors
  }
})();

async function replaceInlineImages() {
  // ensure manifest loaded
  await loadResponsiveManifest();
  const imgs = Array.from(document.querySelectorAll("img"));
  imgs.forEach((img) => {
    try {
      if (!img.src) return;
      // skip logos and external assets
      const src = img.getAttribute("src") || "";
      if (!src.includes("/images/")) return;
      if (img.classList.contains("site-logo")) return;
      if (src.includes("Logo") || src.includes("vite.svg")) return;
      const alt = img.getAttribute("alt") || "";
      const loading = img.getAttribute("loading") || "";
      const high =
        loading === "eager" || img.getAttribute("fetchpriority") === "high";
      const pictureHtml =
        typeof buildResponsivePicture === "function"
          ? buildResponsivePicture(src, alt, high)
          : null;
      if (!pictureHtml) return;
      const wrapper = document.createElement("span");
      wrapper.innerHTML = pictureHtml;
      const newEl = wrapper.firstElementChild;
      if (!newEl) return;
      // carry over classes from original img to new element
      if (img.className && typeof img.className === "string") {
        newEl.className = img.className;
      }
      img.replaceWith(newEl);
    } catch (e) {
      // ignore per-image errors
    }
  });
}

// Handle contact form submissions
$$("form#contactForm").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Sending...";
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "Thank you! Your message has been sent successfully. We'll get back to you within 24 hours."
        );
        form.reset();
      } else {
        alert(
          `Error: ${
            result.error || "Failed to send message. Please try again."
          }`
        );
      }
    } catch (error) {
      console.error("Contact form error:", error);
      // Fallback: Show contact information if API fails
      alert(
        "The contact form is temporarily unavailable. Please contact us directly:\n\nEmail: artwithheartandgifts@yahoo.com\nPhone: (239) 878-9849\n\nWe'll get back to you within 24 hours!"
      );
    } finally {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
});

// Handle commission form submissions
$$("form#commissionForm").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData.entries());

    // Map form fields to backend expected format
    const data = {
      name: rawData.name,
      email: rawData.email,
      phone: rawData.phone,
      projectType: rawData.type, // Map 'type' to 'projectType'
      budget: rawData.budget,
      timeline: rawData.timeline,
      description: rawData.theme, // Map 'theme' to 'description'
      dimensions: rawData.dimensions,
      location: rawData.location,
      additional: rawData.additional,
    };

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Sending...";
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "Thank you! Your commission inquiry has been sent successfully. We'll get back to you within 24 hours to discuss your project."
        );
        form.reset();
      } else {
        alert(
          `Error: ${
            result.error || "Failed to send inquiry. Please try again."
          }`
        );
      }
    } catch (error) {
      console.error("Commission form error:", error);
      // Fallback: Show contact information if API fails
      alert(
        "The commission form is temporarily unavailable. Please contact us directly:\n\nEmail: artwithheartandgifts@yahoo.com\nPhone: (239) 878-9849\n\nWe'll get back to you within 24 hours!"
      );
    } finally {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
});

// Handle newsletter signup
$$("form#newsletterForm").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Subscribing...";
    submitButton.disabled = true;

    try {
      // For newsletter, we'll send it as a contact form with a special subject
      const newsletterData = {
        name: "Newsletter Subscriber",
        email: data.email,
        subject: "Newsletter Signup",
        message: "New newsletter subscription request",
        inquiryType: "Newsletter",
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newsletterData),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "Thank you for subscribing! You'll receive updates about new art releases and special offers."
        );
        form.reset();
      } else {
        alert(
          `Error: ${result.error || "Failed to subscribe. Please try again."}`
        );
      }
    } catch (error) {
      console.error("Newsletter signup error:", error);
      alert(
        "Sorry, there was an error with your subscription. Please try again or contact us directly at artwithheartandgifts@yahoo.com"
      );
    } finally {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
});

// Payment functionality
window.showPaymentForm = async function (productId, productTitle, price) {
  const container = document.getElementById("payment-container");
  if (!container) return;

  container.style.display = "block";
  container.innerHTML = '<div class="loading">Setting up payment...</div>';

  try {
    if (window.paymentProcessor) {
      await window.paymentProcessor.setupPaymentForm(
        "payment-container",
        price,
        {
          id: productId,
          title: productTitle,
          price: price,
        }
      );
    } else {
      // Fallback to alternative payment methods
      container.innerHTML =
        window.paymentProcessor?.showAlternativePayment({
          id: productId,
          title: productTitle,
          price: price,
        }) ||
        `
        <div class="payment-error">
          <h3>Payment Unavailable</h3>
          <p>Please contact us directly to complete your purchase.</p>
          <a href="/contact.html?subject=Purchase: ${encodeURIComponent(
            productTitle
          )}" class="btn primary">Contact Us</a>
        </div>
      `;
    }
  } catch (error) {
    console.error("Payment setup error:", error);
    container.innerHTML = `
      <div class="payment-error">
        <h3>Payment Setup Error</h3>
        <p>We're having trouble setting up payment. Please contact us directly.</p>
        <a href="/contact.html?subject=Purchase: ${encodeURIComponent(
          productTitle
        )}" class="btn primary">Contact Us</a>
      </div>
    `;
  }
};
