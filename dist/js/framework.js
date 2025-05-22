window.oauthConfig = {
    clientId: '762e4f6f-2af6-437c-ad93-944cc17f9d23',
    scopes: ['inference-api']
}

const checkUrls = [];
if (window.location.protocol === "file:") {
    checkUrls.push("http://localhost:1337");
    checkUrls.push("http://localhost:8080");
}
if (["https:", "http:"].includes(window.location.protocol)) {
    checkUrls.push(window.location.origin);
}
checkUrls.push("https://g4f.hopto.org");
async function checkUrl(url) {
    let response;
    try {
        response = await fetch(`${url}/backend-api/v2/version?cache=true`);
    } catch (error) {
        console.debug("Error check url: ", url);
        return false;
    }
    if (response.ok) {
        const connectStatus = document.getElementById("connect_status");
        connectStatus ? connectStatus.innerText = url : null;
        localStorage.setItem("backendUrl", url);
        window.backendUrl = url;
        return true;
    }
    return false;
}
window.backendUrl = localStorage.getItem('backendUrl') || "";
window.connectToBackend = async () => {
    for (const url of checkUrls) {
        if(await checkUrl(url)) {
            return;
        }
    }
};

window.translationKey = "translations" + document.location.pathname;
window.translations = JSON.parse(localStorage.getItem(window.translationKey) || "{}");
window.translateElements = function (elements = null) {
    elements = elements || document.querySelectorAll("p:not(:has(span, a)), h1, h2, h3, h4, h5, h6, button:not(:has(span, a, i)), title, span:not(:has(a, i)), strong, a, div[data-translate], input, textarea, label:not(:has(span, a, i)), i, option[value='']");
    elements.forEach(function (element) {
        if (element.textContent.trim()) {
            element.textContent = window.translate(element.textContent);
        }
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
    if (!window.backendUrl) {
        window.connectToBackend();
    }
    translateElements();
});
let newTranslations = [];
window.translate = (text) => {
    if (text) {
        const endWithSpace = text.endsWith(" ");
        strip_text = text.trim();
        if (strip_text in window.translations && window.translations[strip_text]) {
            return window.translations[strip_text] + (endWithSpace ? " " : "");
        }
        strip_text && !newTranslations.includes(strip_text) ? newTranslations.push(strip_text) : null;
    }
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
    response = await query(prompt, true);
    let translations = await response.text();
    translations = JSON.parse(translations.split('\n---\n')[0]);
    if (translations[navigator.language]) {
        translations = translations[navigator.language];
    }
    localStorage.setItem(window.translationKey, JSON.stringify(translations || allTranslations));
    return allTranslations;
}
async function query(prompt, json) {
    const liveUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}` + (json ? "?json=true" : "");
    const response = await fetch(liveUrl);
    if (response.status !== 200) {
        let fallbackUrl = `${window.backendUrl}/backend-api/v2/create?prompt=${encodeURIComponent(prompt)}&cache=true`;
        fallbackUrl += (json ? "&filter_markdown=true" : "");
        const response = await fetch(fallbackUrl);
        if (response.status !== 200) {
            console.error("Error on query: ", response.statusText);
            return;
        }
    }
    return response;
}
const renderMarkdown = (content) => {
    if (!content) {
        return "";
    }
    if (!window.markdownit) {
        return escapeHtml(content);
    }
    if (Array.isArray(content)) {
        content = content.map((item) => {
            if (!item.name) {
                size = parseInt(appStorage.getItem(`bucket:${item.bucket_id}`), 10);
                return `**Bucket:** [[${item.bucket_id}]](${item.url})${size ? ` (${formatFileSize(size)})` : ""}`
            }
            if (item.name.endsWith(".wav") || item.name.endsWith(".mp3")) {
                return `<audio controls src="${item.url}"></audio>` + (item.text ? `\n${item.text}` : "");
            }
            if (item.name.endsWith(".mp4") || item.name.endsWith(".webm")) {
                return `<video controls src="${item.url}"></video>` + (item.text ? `\n${item.text}` : "");
            }
            return `[![${item.name}](${item.url})]()`;
        }).join("\n");
    }
    const markdown = window.markdownit({
        html: window.sanitizeHtml ? true : false,
        breaks: true
    });
    content = markdown.render(content)
        .replaceAll("<a href=", '<a target="_blank" href=')
        .replaceAll('<code>', '<code class="language-plaintext">')
        .replaceAll('<iframe src="', '<iframe frameborder="0" height="400" width="400" src="')
        .replaceAll('<iframe type="text/html" src="', '<iframe type="text/html" frameborder="0" allow="fullscreen" height="224" width="400" src="')
        .replaceAll('"></iframe>', `?enablejsapi=1"></iframe>`)
        .replaceAll('src="/', `src="${window.backendUrl}/`)
    if (window.sanitizeHtml) {
        content = window.sanitizeHtml(content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'audio', 'video']),
            allowedAttributes: {
                a: [ 'href', 'title', 'target' ],
                i: [ 'class' ],
                code: [ 'class' ],
                img: [ 'src', 'alt', 'width', 'height' ],
                iframe: [ 'src', 'type', 'frameborder', 'allow', 'height', 'width' ],
                audio: [ 'src', 'controls' ],
                video: [ 'src', 'controls', 'loop', 'autoplay', 'muted' ],
            },
            allowedIframeHostnames: ['www.youtube.com']
        });
    }
    return content;
};
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
function filterMarkdown(text, allowedTypes = null, defaultValue = null) {
    const match = text.match(/```(.+)\n(?<code>[\s\S]+?)(\n```|$)/);
    if (match) {
        const [, type, code] = match;
        if (!allowedTypes || allowedTypes.includes(type)) {
            return code;
        }
    }
    return defaultValue;
}
window.framework = {
    query: query,
    renderMarkdown: renderMarkdown
}