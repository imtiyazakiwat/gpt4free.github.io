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
if (window.location.protocol in ["https:", "http:"]) {
    window.checkUrls.push(window.location.origin);
}
async function checkUrl(url) {
    try {
        const response = await fetch(`${url}/backend-api/v2/version`);
        if (response.ok) {
            const connect_status = document.getElementById("connect_status");
            connect_status ? connect_status.innerText = " " + url : null;
            localStorage.setItem("backendUrl", url);
            window.backendUrl = url;
            return true;
        }
    } catch (e) {
        console.debug(e);
    }
}
window.backendUrl = localStorage.getItem('backendUrl') || "";