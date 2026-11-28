import type { Plugin } from "vite";
import { products } from "./src/data/products";
import type { Product } from "./src/data/site";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderReview(product: Product, origin: string) {
  const title = escapeHtml(product.name);
  const description = escapeHtml(product.description);
  const canonical = escapeHtml(origin + "/review/" + product.slug + ".html");
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | TeaZ</title>
<link rel="canonical" href="${canonical}"><meta name="description" content="${description}">
<meta property="og:type" content="article"><meta property="og:site_name" content="TeaZ">
<meta property="og:url" content="${canonical}"><meta property="og:title" content="${title} | TeaZ">
<meta property="og:description" content="${description}"><meta property="og:image" content="${escapeHtml(origin)}/reviews/${product.slug}-share.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/review-page.css">
</head><body><header><a href="/"><img src="/avatar.png" alt="" width="36" height="36">TeaZ</a><a href="/#san-pham">Tất cả review</a></header>
<main><article><img class="cover" src="${product.cover}" width="405" height="720" alt="Ảnh bìa video về ${title}">
<div><p class="category">${escapeHtml(product.categoryLabel)}</p><h1>${title}</h1><p>${description}</p>
<a class="watch" href="${escapeHtml(product.reviewUrl)}">Xem video trên TikTok ↗</a>
<h2>Điểm đáng xem</h2><p>${escapeHtml(product.viewingTip)}</p>
<a href="/tools">Cách kiểm tra lịch sử giá Shopee →</a></div></article>
<nav aria-label="Review khác"><h2>Xem review khác</h2>${products.filter(p => p.slug !== product.slug).map(p => `<a href="/review/${p.slug}.html">${escapeHtml(p.name)} →</a>`).join("")}</nav></main></body></html>`;
}

export function reviewPages(origin: string): Plugin {
  const pages = new Map(products.map(product => [
    "/review/" + product.slug + ".html", renderReview(product, origin),
  ]));
  return {
    name: "teaz-review-pages",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const html = pages.get((request.url ?? "").split("?")[0]);
        if (!html) return next();
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(html);
      });
    },
    generateBundle() {
      for (const [path, html] of pages) {
        this.emitFile({ type: "asset", fileName: path.slice(1), source: html });
      }
    },
  };
}
