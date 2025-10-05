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

// Load detected words from current page
function loadDetectedWords() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length || !tabs[0].url?.startsWith("http")) {
            document.getElementById("detected-words-list").innerHTML = '<div class="no-data">Not applicable for this page</div>';
            return;
        }
        
        chrome.tabs.sendMessage(tabs[0].id, { type: "getDetectedWords" }, (response) => {
            const detectedWordsList = document.getElementById("detected-words-list");
            
            if (chrome.runtime.lastError || !response || !response.detectedWords) {
                detectedWordsList.innerHTML = '<div class="no-data">No words detected</div>';
                return;
            }
            
            const detectedWords = response.detectedWords;
            const wordEntries = Object.entries(detectedWords);
            
            if (wordEntries.length === 0) {
                detectedWordsList.innerHTML = '<div class="no-data">No words detected</div>';
                return;
            }
            
            // Sort by count (descending) then alphabetically
            wordEntries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
            
            detectedWordsList.innerHTML = wordEntries
                .map(([word, count]) => `
                    <div class="word-item">
                        <span class="word">${escapeHtml(word)}</span>
                        <span class="count">${count}</span>
                    </div>
                `)
                .join('');
        });
    });
}

// Load all-time statistics
function loadStatistics() {
    chrome.storage.local.get(['wordStats'], (result) => {
        const statsList = document.getElementById("statistics-list");
        const stats = result.wordStats || {};
        const statsEntries = Object.entries(stats);
        
        if (statsEntries.length === 0) {
            statsList.innerHTML = '<div class="no-data">No statistics yet</div>';
            return;
        }
        
        // Sort by count (descending) then alphabetically
        statsEntries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        
        // Show top 20 words
        const topWords = statsEntries.slice(0, 20);
        
        statsList.innerHTML = topWords
            .map(([word, count]) => `
                <div class="word-item">
                    <span class="word">${escapeHtml(word)}</span>
                    <span class="count">${count}</span>
                </div>
            `)
            .join('');
    });
}

// Reset statistics
document.getElementById("reset-stats-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all statistics?")) {
        chrome.storage.local.set({ wordStats: {} }, () => {
            loadStatistics();
        });
    }
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    updateState();
    loadDetectedWords();
    loadStatistics();
});
