export async function loadProducts() {
  if (window.__PRODUCT_CACHE) return window.__PRODUCT_CACHE;

  try {
    const response = await fetch("/public/data.json");
    if (!response.ok) {
      console.error("Failed to load data.json:", response.status);
      return [];
    }
    const base = await response.json();

    let story = [];
    try {
      const storyResponse = await fetch("/public/data-story.json");
      if (storyResponse.ok) {
        story = await storyResponse.json();
      }
    } catch (e) {
      console.log("Story data not available:", e.message);
    }

    let gallery = [];
    try {
      const galleryResponse = await fetch("/data-gallery.json");
      if (galleryResponse.ok) {
        gallery = await galleryResponse.json();
      }
    } catch (e) {
      console.log("Gallery data not available:", e.message);
    }

    const merged = [...base, ...story, ...gallery];
    merged.forEach((p) => {
      if (p.specialOrder) {
        p.price = p.price || 0;
      }
      if (!p.type) p.type = "original";
    });

    window.__PRODUCT_CACHE = merged;
    console.log(
      `Loaded ${merged.length} total products (${base.length} base, ${story.length} story, ${gallery.length} gallery)`
    );
    return merged;
  } catch (error) {
    console.error("Error loading products:", error);
    return [];
  }
}

// Backwards compatibility: many HTML files import a synchronous `products` binding.
// Use top-level await to produce an array export that matches the old shape.
export const products = await loadProducts();
