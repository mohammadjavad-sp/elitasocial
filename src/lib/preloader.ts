export const preloaderSessionKey = "elita-brand-intro";

// Runs before the page paints so a repeat visit cannot flash the intro.
// Storage may be disabled; the short first-visit animation remains the fallback.
export const preloaderBootstrapScript = `try{if(location.hash||sessionStorage.getItem("${preloaderSessionKey}")==="shown")document.documentElement.dataset.elitaIntro="seen"}catch{}`;
