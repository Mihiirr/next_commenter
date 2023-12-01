// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "fetchImageSources") {
        extractImageSrcFromIframe(request.iframeSelector, sender.tab.id)
            .then(imageSources => sendResponse({ imageSources }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true; // keep the messaging channel open for sendResponse
    }
});

async function extractImageSrcFromIframe(iframeSelector, tabId) {
    // Assuming you've already injected content scripts that can access the iframe
    const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: iframeContentScript,
        args: [iframeSelector]
    });
    return result.result; // The array of image sources
}

function iframeContentScript(iframeSelector) {
    // This function will be serialized and run in the context of the webpage
    const iframe = document.querySelector(iframeSelector);
    if (iframe) {
        return Array.from(iframe.contentDocument.images).map(img => img.src);
    }
    return [];
}
