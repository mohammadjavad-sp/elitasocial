// Skip fragment entrances and reduced motion before the first paint. The client
// consumes this document-scoped marker; public page changes get a fresh entrance.
export const preloaderBootstrapScript = `try{if(location.hash||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.elitaIntroSkip=location.pathname}catch{}`;
