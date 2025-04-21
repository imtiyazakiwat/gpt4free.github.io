window.oauthConfig = {
    clientId: '762e4f6f-2af6-437c-ad93-944cc17f9d23',
    scopes: ['inference-api']
}
window.checkUrls = [
    "https://g4f.hopto.org",
];
if (window.location.protocol !== "https:") {
    window.checkUrls.push("http://localhost:8080");
    window.checkUrls.push("http://localhost:1337");
}
if (["https:", "http:"].includes(window.location.protocol)) {
    window.checkUrls.push(window.location.origin);
}
async function checkUrl(url) {
    fetch(`${url}/backend-api/v2/version`).then((response) => {
        if (response.ok) {
            const connect_status = document.getElementById("connect_status");
            connect_status ? connect_status.innerText = " " + url : null;
            localStorage.setItem("backendUrl", url);
            window.backendUrl = url;
            return true;
        }
    }).catch((error) => {
        console.error("Error checking URL: ", error);
    });
}
window.backendUrl = localStorage.getItem('backendUrl') || "";

window.translationKey = "translations" + document.location.pathname;
window.translations = JSON.parse(localStorage.getItem(window.translationKey) || "{}");
window.translateElements = function (elements = null) {
    elements = elements || document.querySelectorAll("p:not(:has(span, a)), h1, h2, h3, h4, h5, h6, button:not(:has(span, a, i)), title, span, strong, a, div[data-translate], input, textarea, label, i, option[value='']");
    elements.forEach(function (element) {
        element.innerText = window.translate(element.innerText);
        if (element.alt) {
            element.alt = window.translate(element.alt);
        }
        if (element.title) {
            element.title = window.translate(element.title);
        }
        if (element.placeholder) {
            element.placeholder = window.translate(element.placeholder);
        }
    });
}
document.addEventListener("DOMContentLoaded", (event) => {
    translateElements();
});
let newTranslations = [];
window.translate = (text) => {
    const endWithSpace = text.endsWith(" ");
    strip_text = text.trim();
    if (strip_text in window.translations && window.translations[strip_text]) {
        return window.translations[strip_text] + (endWithSpace ? " " : "");
    }
    strip_text ? newTranslations.push(strip_text) : null;
    return text;
};
window.translateAll = async () =>{
    let allTranslations = {...window.translations};
    for (const text of newTranslations) {
        if (text === "" || text === "...") {
            continue;
        }
        allTranslations[text] = "";
    }
    console.log("newTranslations", newTranslations);
    console.log("allTranslations", allTranslations);
    const json_translations = "\n\n```json\n" + JSON.stringify(allTranslations, null, 4) + "\n```";
    const json_language = "`" + navigator.language + "`";
    const prompt = `Translate the following text snippets in a JSON object to ${json_language} (iso code): ${json_translations}`;
    const live_url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`;
    const response = await fetch(live_url);
    if (response.status !== 200) {
        const fallback_url = `${window.backendUrl}/backend-api/v2/create?prompt=${encodeURI(prompt)}&filter_markdown=true&cache=true`;
        const response = await fetch(fallback_url);
        if (response.status !== 200) {
            console.error("Error on translate: ", response.statusText);
            return;
        }
    }
    const translations = await response.json();
    if (translations[navigator.language]) {
        translations = translations[navigator.language];
    }
    localStorage.setItem(window.translationKey, JSON.stringify(translations || allTranslations));
    return allTranslations;
}