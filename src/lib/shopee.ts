export function openShopeeSmartLink(targetUrl: string): void {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const started = Date.now();
  window.location.href = "shopeevn://reactPath?tab=buy&path=shopee/HOME";

  window.setTimeout(() => {
    if (Date.now() - started < 1500) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  }, 650);
}
