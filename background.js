const DEFAULT_WORD_LIST = [
    "As an AI",
    "As a language model",
    "—",
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

// Fetch word list from URL
async function fetchWordListFromUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        // Parse text file - one word per line, ignore empty lines and comments
        const words = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#') && !line.startsWith('!'))
            .map(line => {
                // Remove any trailing comments
                const commentIndex = line.indexOf('#');
                return commentIndex > -1 ? line.substring(0, commentIndex).trim() : line;
            })
            .filter(word => word);
        
        return words;
    } catch (error) {
        console.error(`Failed to fetch word list from ${url}:`, error);
        throw error;
    }
}

// Update all external word lists
async function updateExternalLists() {
    const { externalLists = [], customWords = [] } = await chrome.storage.sync.get(['externalLists', 'customWords']);
    
    let allWords = [...customWords];
    
    for (const listInfo of externalLists) {
        if (listInfo.enabled) {
            // Handle built-in default list
            if (listInfo.isBuiltIn) {
                allWords = [...allWords, ...DEFAULT_WORD_LIST];
                listInfo.wordCount = DEFAULT_WORD_LIST.length;
                listInfo.lastUpdated = Date.now();
                listInfo.error = null;
            } else {
                // Handle external URL lists
                try {
                    const words = await fetchWordListFromUrl(listInfo.url);
                    allWords = [...allWords, ...words];
                    
                    // Update last updated timestamp
                    listInfo.lastUpdated = Date.now();
                    listInfo.error = null;
                    listInfo.wordCount = words.length;
                } catch (error) {
                    console.error(`Error updating list ${listInfo.name}:`, error);
                    listInfo.error = error.message;
                }
            }
        }
    }
    
    // Remove duplicates (case-insensitive)
    const uniqueWords = [...new Set(allWords.map(w => w.toLowerCase()))];
    const finalList = uniqueWords.map(w => {
        // Try to preserve original case from first occurrence
        return allWords.find(orig => orig.toLowerCase() === w) || w;
    });
    
    await chrome.storage.sync.set({ 
        wordList: finalList,
        externalLists 
    });
    
    console.log(`Updated word list with ${finalList.length} unique words`);
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
    await initializeExtension(details);
});

// Update lists on browser startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('Browser started, updating word lists...');
    await updateExternalLists();
});

async function initializeExtension(details) {
    chrome.storage.local.set({ paused: false });
    
    const { wordList, customWords, externalLists, highlightStyle, badgeColors, replacerTimeout, detectionMode, replacementText } = await chrome.storage.sync.get([
        'wordList', 'customWords', 'externalLists', 'highlightStyle', 'badgeColors', 'replacerTimeout', 'detectionMode', 'replacementText'
    ]);
    
    // Migrate old data if upgrading from previous version
    if (details.reason === 'update' && wordList && !customWords) {
        // Extract custom words: words that are in wordList but not in DEFAULT_WORD_LIST
        const defaultWordsLower = DEFAULT_WORD_LIST.map(w => w.toLowerCase());
        const migratedCustomWords = wordList.filter(word => 
            !defaultWordsLower.includes(word.toLowerCase())
        );
        
        if (migratedCustomWords.length > 0) {
            console.log(`Migrating ${migratedCustomWords.length} custom words from previous version`);
            await chrome.storage.sync.set({ customWords: migratedCustomWords });
        }
    }
    
    // Initialize custom words if not exists (fresh install)
    if (!customWords && details.reason === 'install') {
        await chrome.storage.sync.set({ customWords: [] });
    }
    
    // Initialize highlight style if not exists
    if (!highlightStyle) {
        await chrome.storage.sync.set({ 
            highlightStyle: {
                color: '#ff0000',
                backgroundColor: 'transparent',
                fontWeight: 'normal',
                textDecoration: 'none',
                border: 'none',
                borderRadius: '0px'
            }
        });
    }
    
    // Initialize badge colors if not exists
    if (!badgeColors) {
        await chrome.storage.sync.set({
            badgeColors: {
                high: { threshold: 10, color: "#ef4444" },      // red
                medium: { threshold: 5, color: "#f97316" },     // orange
                low: { threshold: 0, color: "#6b7280" },        // gray
                none: { color: "#10b981" }                      // green
            }
        });
    }
    
    // Initialize replacer timeout if not exists
    if (!replacerTimeout) {
        await chrome.storage.sync.set({ replacerTimeout: 1000 }); // 1 second default
    }
    
    // Initialize detection mode if not exists
    if (!detectionMode) {
        await chrome.storage.sync.set({ detectionMode: 'highlight' }); // highlight is default
    }
    
    // Initialize replacement text if not exists
    if (!replacementText) {
        await chrome.storage.sync.set({ replacementText: '!AI SLOP!' }); // default replacement
    }
    
    // Initialize external lists if not exists
    if (!externalLists) {
        // Create the default built-in list
        const defaultList = {
            name: "Default List",
            url: null,
            isBuiltIn: true,
            enabled: true,
            lastUpdated: Date.now(),
            wordCount: DEFAULT_WORD_LIST.length,
            error: null
        };
        await chrome.storage.sync.set({ externalLists: [defaultList] });
    } else if (details.reason === 'update') {
        // Check if default list exists, if not add it (for users upgrading)
        const hasBuiltIn = externalLists.some(list => list.isBuiltIn);
        if (!hasBuiltIn) {
            const defaultList = {
                name: "Default List",
                url: null,
                isBuiltIn: true,
                enabled: true,
                lastUpdated: Date.now(),
                wordCount: DEFAULT_WORD_LIST.length,
                error: null
            };
            externalLists.unshift(defaultList); // Add at the beginning
            await chrome.storage.sync.set({ externalLists });
        }
    }
    
    // Update external lists (this will merge custom + external + default if enabled)
    await updateExternalLists();
}

// Handle all messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    
    // Handle manual update requests
    if (message.type === 'updateExternalLists') {
        updateExternalLists()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
    
    if (message.type === "updateBadge") {
        chrome.storage.sync.get("badgeColors", ({ badgeColors }) => {
            const colors = badgeColors || {
                high: { threshold: 10, color: "#ef4444" },      // red
                medium: { threshold: 5, color: "#f97316" },     // orange
                low: { threshold: 0, color: "#6b7280" },        // gray
                none: { color: "#10b981" }                      // green
            };
            
            chrome.action.setBadgeText({ text: message.count.toString(), tabId: sender.tab.id });
            
            let badgeColor;
            if (message.count > colors.high.threshold) {
                badgeColor = colors.high.color;
            } else if (message.count > colors.medium.threshold) {
                badgeColor = colors.medium.color;
            } else if (message.count > colors.low.threshold) {
                badgeColor = colors.low.color;
            } else {
                badgeColor = colors.none.color;
            }
            
            chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: sender.tab.id });
        });
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
