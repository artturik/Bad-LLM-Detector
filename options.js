const wordListElement = document.getElementById("wordList");
const newWordInput = document.getElementById("newWord");
const addWordButton = document.getElementById("addWord");
const externalListsElement = document.getElementById("externalLists");
const newListUrlInput = document.getElementById("newListUrl");
const newListNameInput = document.getElementById("newListName");
const addListButton = document.getElementById("addList");
const updateListsButton = document.getElementById("updateLists");
const updateStatusElement = document.getElementById("updateStatus");
const totalWordsElement = document.getElementById("totalWords");

// Style elements
const textColorInput = document.getElementById("textColor");
const backgroundColorInput = document.getElementById("backgroundColor");
const fontWeightSelect = document.getElementById("fontWeight");
const textDecorationSelect = document.getElementById("textDecoration");
const borderInput = document.getElementById("border");
const borderRadiusInput = document.getElementById("borderRadius");
const stylePreview = document.getElementById("stylePreview");
const saveStyleButton = document.getElementById("saveStyle");
const resetStyleButton = document.getElementById("resetStyle");

// Detection mode elements
const detectionModeSelect = document.getElementById("detectionMode");
const replacementTextInput = document.getElementById("replacementText");

// Settings elements
const highThresholdInput = document.getElementById("highThreshold");
const highColorInput = document.getElementById("highColor");
const mediumThresholdInput = document.getElementById("mediumThreshold");
const mediumColorInput = document.getElementById("mediumColor");
const lowColorInput = document.getElementById("lowColor");
const noneColorInput = document.getElementById("noneColor");
const replacerTimeoutInput = document.getElementById("replacerTimeout");
const saveSettingsButton = document.getElementById("saveSettings");
const resetSettingsButton = document.getElementById("resetSettings");

const presetStyles = {
    'red-text': {
        color: '#ff0000',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        textDecoration: 'none',
        border: 'none',
        borderRadius: '0px'
    },
    'highlight': {
        color: '#000000',
        backgroundColor: '#ffff00',
        fontWeight: 'normal',
        textDecoration: 'none',
        border: 'none',
        borderRadius: '0px'
    },
    'orange-box': {
        color: '#ff6600',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        textDecoration: 'none',
        border: '2px solid #ff6600',
        borderRadius: '3px'
    }
};

function loadWordList() {
    chrome.storage.sync.get(["customWords", "wordList"], ({ customWords, wordList }) => {
        wordListElement.innerHTML = "";
        (customWords || []).forEach((word, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${word}</span>
                <button data-index="${index}" class="remove">Remove</button>
              `;
            wordListElement.appendChild(li);
        });

        document.querySelectorAll(".remove").forEach(button => {
            button.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                removeWord(index);
            });
        });
        
        // Update total word count
        totalWordsElement.textContent = (wordList || []).length;
    });
}

// Load external lists
function loadExternalLists() {
    chrome.storage.sync.get("externalLists", ({ externalLists }) => {
        externalListsElement.innerHTML = "";
        (externalLists || []).forEach((listInfo, index) => {
            const div = document.createElement("div");
            const isBuiltIn = listInfo.isBuiltIn;
            div.className = isBuiltIn ? 'external-list-item built-in' : 'external-list-item';
            
            const lastUpdated = listInfo.lastUpdated 
                ? new Date(listInfo.lastUpdated).toLocaleString()
                : 'Never';
            
            const statusColor = listInfo.error ? '#ef4444' : (listInfo.enabled ? '#10b981' : '#6b7280');
            const statusText = listInfo.error 
                ? `Error: ${listInfo.error}` 
                : (listInfo.enabled ? `Active (${listInfo.wordCount || 0} words)` : 'Disabled');
            
            const urlDisplay = listInfo.url ? `<div class="muted-text" style="font-size: 0.85em; margin-top: 6px; word-break: break-all;">${listInfo.url}</div>` : '';
            const builtInBadge = isBuiltIn ? '<span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75em; margin-left: 8px; font-weight: 500;">Built-in</span>' : '';
            const removeButton = isBuiltIn ? '' : `<button data-index="${index}" class="remove-list">Remove</button>`;
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 15px; font-weight: 600;">${listInfo.name}${builtInBadge}</div>
                        ${urlDisplay}
                        <div class="muted-text" style="font-size: 0.85em; margin-top: 8px;">
                            <span style="color: ${statusColor}; font-weight: 500;">● ${statusText}</span>
                            <span style="margin-left: 12px;">Updated: ${lastUpdated}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
                            <input type="checkbox" ${listInfo.enabled ? 'checked' : ''} data-index="${index}" class="toggle-list" style="cursor: pointer;">
                            <span style="font-size: 14px;">Enabled</span>
                        </label>
                        ${removeButton}
                    </div>
                </div>
            `;
            externalListsElement.appendChild(div);
        });

        // Add event listeners for toggle and remove
        document.querySelectorAll(".toggle-list").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const index = parseInt(e.target.dataset.index);
                toggleList(index, e.target.checked);
            });
        });

        document.querySelectorAll(".remove-list").forEach(button => {
            button.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                removeList(index);
            });
        });
    });
}

function addWord() {
    const word = newWordInput.value.trim();
    if (!word) return;

    chrome.storage.sync.get("customWords", ({ customWords }) => {
        const updatedList = customWords ? [...customWords, word] : [word];
        chrome.storage.sync.set({ customWords: updatedList }, () => {
            // Trigger rebuild of word list
            chrome.runtime.sendMessage({ type: "updateExternalLists" }, () => {
                loadWordList();
            });
        });
        newWordInput.value = "";
    });
}

function removeWord(index) {
    chrome.storage.sync.get("customWords", ({ customWords }) => {
        customWords.splice(index, 1);
        chrome.storage.sync.set({ customWords }, () => {
            // Trigger rebuild of word list
            chrome.runtime.sendMessage({ type: "updateExternalLists" }, () => {
                loadWordList();
            });
        });
    });
}

function addList() {
    const url = newListUrlInput.value.trim();
    const name = newListNameInput.value.trim();
    
    if (!url || !name) {
        alert("Please provide both URL and name for the list");
        return;
    }
    
    // Basic URL validation
    try {
        new URL(url);
    } catch (e) {
        alert("Please provide a valid URL");
        return;
    }

    chrome.storage.sync.get("externalLists", ({ externalLists }) => {
        const newList = {
            name,
            url,
            enabled: true,
            lastUpdated: null,
            wordCount: 0,
            error: null
        };
        
        const updatedLists = externalLists ? [...externalLists, newList] : [newList];
        chrome.storage.sync.set({ externalLists: updatedLists }, () => {
            newListUrlInput.value = "";
            newListNameInput.value = "";
            
            // Trigger update
            updateListsButton.click();
        });
    });
}

function removeList(index) {
    chrome.storage.sync.get("externalLists", ({ externalLists }) => {
        // Prevent removing built-in list
        if (externalLists[index].isBuiltIn) {
            alert("Cannot remove the built-in default list. You can disable it instead.");
            return;
        }
        
        if (!confirm("Are you sure you want to remove this list?")) return;
        
        externalLists.splice(index, 1);
        chrome.storage.sync.set({ externalLists }, () => {
            // Trigger rebuild of word list
            chrome.runtime.sendMessage({ type: "updateExternalLists" }, () => {
                loadExternalLists();
                loadWordList();
            });
        });
    });
}

function toggleList(index, enabled) {
    chrome.storage.sync.get("externalLists", ({ externalLists }) => {
        externalLists[index].enabled = enabled;
        chrome.storage.sync.set({ externalLists }, () => {
            // Trigger rebuild of word list
            chrome.runtime.sendMessage({ type: "updateExternalLists" }, () => {
                loadExternalLists();
                loadWordList();
            });
        });
    });
}

function updateLists() {
    updateStatusElement.textContent = "Updating lists...";
    updateStatusElement.style.color = "#666";
    
    chrome.runtime.sendMessage({ type: "updateExternalLists" }, (response) => {
        if (response && response.success) {
            updateStatusElement.textContent = "Lists updated successfully!";
            updateStatusElement.style.color = "green";
        } else {
            updateStatusElement.textContent = `Update failed: ${response?.error || 'Unknown error'}`;
            updateStatusElement.style.color = "red";
        }
        
        setTimeout(() => {
            updateStatusElement.textContent = "";
        }, 3000);
        
        loadExternalLists();
        loadWordList();
    });
}

// Event listeners
addWordButton.addEventListener("click", addWord);
addListButton.addEventListener("click", addList);
updateListsButton.addEventListener("click", updateLists);

newWordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addWord();
});

newListUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addList();
});

newListNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addList();
});

// Style functions
function loadStyle() {
    chrome.storage.sync.get("highlightStyle", ({ highlightStyle }) => {
        const style = highlightStyle || presetStyles['red-text'];
        
        textColorInput.value = style.color;
        backgroundColorInput.value = style.backgroundColor === 'transparent' ? '#ffffff' : style.backgroundColor;
        fontWeightSelect.value = style.fontWeight;
        textDecorationSelect.value = style.textDecoration;
        borderInput.value = style.border === 'none' ? '' : style.border;
        borderRadiusInput.value = style.borderRadius;
        
        updatePreview();
    });
}

function updatePreview() {
    const style = {
        color: textColorInput.value,
        backgroundColor: backgroundColorInput.value,
        fontWeight: fontWeightSelect.value,
        textDecoration: textDecorationSelect.value,
        border: borderInput.value || 'none',
        borderRadius: borderRadiusInput.value || '0px'
    };
    
    stylePreview.style.color = style.color;
    stylePreview.style.backgroundColor = style.backgroundColor;
    stylePreview.style.fontWeight = style.fontWeight;
    stylePreview.style.textDecoration = style.textDecoration;
    stylePreview.style.border = style.border;
    stylePreview.style.borderRadius = style.borderRadius;
    if (style.borderRadius !== '0px') {
        stylePreview.style.padding = '2px 4px';
    } else {
        stylePreview.style.padding = '0';
    }
}

function saveStyle() {
    const style = {
        color: textColorInput.value,
        backgroundColor: backgroundColorInput.value,
        fontWeight: fontWeightSelect.value,
        textDecoration: textDecorationSelect.value,
        border: borderInput.value || 'none',
        borderRadius: borderRadiusInput.value || '0px'
    };
    
    chrome.storage.sync.set({ highlightStyle: style }, () => {
        alert('Style saved! Reload pages to see the changes.');
    });
}

function resetStyle() {
    if (confirm('Reset to default red text style?')) {
        chrome.storage.sync.set({ highlightStyle: presetStyles['red-text'] }, () => {
            loadStyle();
            alert('Style reset! Reload pages to see the changes.');
        });
    }
}

function applyPreset(presetName) {
    const style = presetStyles[presetName];
    if (style) {
        textColorInput.value = style.color;
        backgroundColorInput.value = style.backgroundColor === 'transparent' ? '#ffffff' : style.backgroundColor;
        fontWeightSelect.value = style.fontWeight;
        textDecorationSelect.value = style.textDecoration;
        borderInput.value = style.border === 'none' ? '' : style.border;
        borderRadiusInput.value = style.borderRadius;
        
        updatePreview();
        
        // Auto-save preset
        chrome.storage.sync.set({ highlightStyle: style }, () => {
            console.log('Preset applied:', presetName);
        });
    }
}

// Event listeners for style inputs
textColorInput.addEventListener("input", updatePreview);
backgroundColorInput.addEventListener("input", updatePreview);
fontWeightSelect.addEventListener("change", updatePreview);
textDecorationSelect.addEventListener("change", updatePreview);
borderInput.addEventListener("input", updatePreview);
borderRadiusInput.addEventListener("input", updatePreview);

saveStyleButton.addEventListener("click", saveStyle);
resetStyleButton.addEventListener("click", resetStyle);

// Preset buttons
document.querySelectorAll(".preset-style").forEach(button => {
    button.addEventListener("click", (e) => {
        const preset = e.target.dataset.preset;
        applyPreset(preset);
    });
});

// Settings functions
function loadSettings() {
    chrome.storage.sync.get(["badgeColors", "replacerTimeout", "detectionMode", "replacementText"], ({ badgeColors, replacerTimeout, detectionMode, replacementText }) => {
        const colors = badgeColors || {
            high: { threshold: 10, color: "#ef4444" },
            medium: { threshold: 5, color: "#f97316" },
            low: { threshold: 0, color: "#6b7280" },
            none: { color: "#10b981" }
        };
        
        highThresholdInput.value = colors.high.threshold;
        highColorInput.value = colors.high.color;
        mediumThresholdInput.value = colors.medium.threshold;
        mediumColorInput.value = colors.medium.color;
        lowColorInput.value = colors.low.color;
        noneColorInput.value = colors.none.color;
        replacerTimeoutInput.value = replacerTimeout || 1000;
        detectionModeSelect.value = detectionMode || 'highlight';
        replacementTextInput.value = replacementText || 'Maybe AI: $0';
    });
}

function saveSettings() {
    const badgeColors = {
        high: { 
            threshold: parseInt(highThresholdInput.value), 
            color: highColorInput.value 
        },
        medium: { 
            threshold: parseInt(mediumThresholdInput.value), 
            color: mediumColorInput.value 
        },
        low: { 
            threshold: 0, 
            color: lowColorInput.value 
        },
        none: { 
            color: noneColorInput.value 
        }
    };
    
    const replacerTimeout = parseInt(replacerTimeoutInput.value);
    const detectionMode = detectionModeSelect.value;
    const replacementText = replacementTextInput.value || 'Maybe AI: $0';
    
    chrome.storage.sync.set({ badgeColors, replacerTimeout, detectionMode, replacementText }, () => {
        alert('Settings saved! Reload pages to see the changes.');
    });
}

function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
        const defaultColors = {
            high: { threshold: 10, color: "#ef4444" },
            medium: { threshold: 5, color: "#f97316" },
            low: { threshold: 0, color: "#6b7280" },
            none: { color: "#10b981" }
        };
        
        chrome.storage.sync.set({ 
            badgeColors: defaultColors,
            replacerTimeout: 1000,
            detectionMode: 'highlight',
            replacementText: 'Maybe AI: $0'
        }, () => {
            loadSettings();
            alert('Settings reset to defaults!');
        });
    }
}

saveSettingsButton.addEventListener("click", saveSettings);
resetSettingsButton.addEventListener("click", resetSettings);

// Initial load
loadWordList();
loadExternalLists();
loadStyle();
loadSettings();
