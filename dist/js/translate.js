window.translationKey = "translations" + document.location.pathname;
window.translations = JSON.parse(localStorage.getItem(window.translationKey) || "{}");
window.addEventListener('DOMContentLoaded', async function() {
    const elements = document.querySelectorAll("p:not(:has(span, a)), h1, h2, h3, h4, h5, h6, button:not(:has(span, a, i)), title, span, strong, a, div[data-translate], input, textarea, label, i");
    elements.forEach(function (element) {
        element.innerText = translate(element.innerText);
        if (element.alt) {
            element.alt = translate(element.alt);
        }
        if (element.title) {
            element.title = translate(element.title);
        }
        if (element.placeholder) {
            element.placeholder = translate(element.placeholder);
        }
    });
});
let newTranslations = [];
function translate(text) {
    const endWithSpace = text.endsWith(" ");
    text = text.trim();
    if (text in window.translations && window.translations[text]) {
        return window.translations[text] + (endWithSpace ? " " : "");
    }
    text ? newTranslations.push(text) : null;
    return text;
}
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
    const response = await fetch(`${window.backendUrl}/backend-api/v2/create?prompt=${encodeURI(prompt)}&filter_markdown=json&provider=PollinationsAI&cache=true`);
    if (response.status !== 200) {
        console.error("Error: ", response.statusText);
        return;
    }
    const translations = await response.json();
    localStorage.setItem(window.translationKey, JSON.stringify(translations || allTranslations));
    return allTranslations;
}