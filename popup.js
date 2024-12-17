const stateText = document.getElementById("status");
const togglePauseBtn = document.getElementById("toggle-pause-btn");
const disableHostnameBtn = document.getElementById("disable-hostname-btn");

const updateState = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length || !tabs[0].url?.startsWith("http")) {
            stateText.textContent = "Status: Not applicable";
            return;
        }
        const currentUrl = new URL(tabs[0].url);
        const hostname = currentUrl.hostname;

        chrome.storage.local.get({ disabledHostnames: [] }, (data) => {
            const disabledHostnames = data.disabledHostnames;
            const isDisabledSite = disabledHostnames.includes(hostname);
            disableHostnameBtn.textContent = isDisabledSite
                ? "Enable on this site"
                : "Disable on this site";

            chrome.storage.local.get({ paused: false }, (data) => {
                const paused = data.paused;
                stateText.textContent = paused || isDisabledSite
                    ? "Status: Paused"
                    : "Status: Active";
                if(paused || isDisabledSite){
                    chrome.runtime.sendMessage({ state: "disabled" });
                } else {
                    chrome.runtime.sendMessage({ state: "enabled" });
                }
                togglePauseBtn.textContent = paused ? "Resume" : "Pause";
            });
        });
    });
};

togglePauseBtn.addEventListener("click", () => {
    chrome.storage.local.get({ paused: false }, (data) => {
        const newState = !data.paused;
        chrome.storage.local.set({ paused: newState }, () => {
            updateState();
            chrome.runtime.sendMessage({ paused: newState });
        });
    });
});

disableHostnameBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = new URL(tabs[0].url);
        const hostname = currentUrl.hostname;

        chrome.storage.local.get({ disabledHostnames: [] }, (data) => {
            let disabledHostnames = data.disabledHostnames;

            if (!disabledHostnames.includes(hostname)) {
                disabledHostnames.push(hostname);
                chrome.storage.local.set({ disabledHostnames }, () => {
                    updateState();
                });
            } else {
                disabledHostnames = disabledHostnames.filter((h) => h !== hostname);
                chrome.storage.local.set({ disabledHostnames }, () => {
                    updateState();
                });
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", updateState);
