export const preloaderSessionKey = "elita-brand-intro";

// Skip repeated navigations before paint, but replay on a full reload.
// Storage may be disabled; the short entrance remains the fallback.
export const preloaderBootstrapScript = `try{const n=performance.getEntriesByType("navigation")[0];if(location.hash||(n?.type!=="reload"&&sessionStorage.getItem("${preloaderSessionKey}")==="shown"))document.documentElement.dataset.elitaIntro="seen"}catch{}`;
