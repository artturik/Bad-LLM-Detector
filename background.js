chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ paused: false });
    chrome.storage.sync.get("wordList", ({ wordList }) => {
        if (!wordList) {
            const wordList = [
                "Delve",
                "Harnessing",
                "At the heart of",
                "In essence",
                "Facilitating",
                "Intrinsic",
                "Integral",
                "Core",
                "Facet",
                "Nuance",
                "Culmination",
                "Manifestation",
                "Inherent",
                "Confluence",
                "Underlying",
                "Intricacies",
                "Epitomize",
                "Embodiment",
                "Iteration",
                "Synthesize",
                "Amplify",
                "Impetus",
                "Catalyst",
                "Synergy",
                "Cohesive",
                "Paradigm",
                "Dynamics",
                "Implications",
                "Prerequisite",
                "Fusion",
                "Holistic",
                "Quintessential",
                "Cohesion",
                "Symbiosis",
                "Integration",
                "Encompass",
                "Unveil",
                "Unravel",
                "Emanate",
                "Illuminate",
                "Reverberate",
                "Augment",
                "Infuse",
                "Extrapolate",
                "Embody",
                "Unify",
                "Inflection",
                "Instigate",
                "Embark",
                "Envisage",
                "Elucidate",
                "Substantiate",
                "Resonate",
                "Catalyze",
                "Resilience",
                "Evoke",
                "Pinnacle",
                "Evolve",
                "Digital Bazaar",
                "Tapestry",
                "Leverage",
                "Centerpiece",
                "Subtlety",
                "Immanent",
                "Exemplify",
                "Blend",
                "Comprehensive",
                "Archetypal",
                "Unity",
                "Harmony",
                "Conceptualize",
                "Reinforce",
                "Mosaic",
                "Catering",
            ];
            chrome.storage.sync.set({ wordList });
        }
    });


});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (message.type === "updateBadge") {
        chrome.action.setBadgeText({ text: message.count.toString(), tabId: sender.tab.id });
        if(message.count > 10){
            chrome.action.setBadgeBackgroundColor({ color: "red", tabId: sender.tab.id });
        } else if(message.count > 5) {
            chrome.action.setBadgeBackgroundColor({ color: "orange", tabId: sender.tab.id });
        } else if(message.count > 0) {
            chrome.action.setBadgeBackgroundColor({ color: "gray", tabId: sender.tab.id });
        } else {
            chrome.action.setBadgeBackgroundColor({ color: "green", tabId: sender.tab.id });
        }
    }

    if (message.state === "enabled") {
        chrome.action.setIcon({path: 'icon.png'});
    }

    if(message.state === "disabled") {
        chrome.action.setIcon({path: 'icon_disabled.png'});
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        chrome.tabs.sendMessage(tab.id, { type: "updateBadge", count: 0 });
    }
});
