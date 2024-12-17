const wordListElement = document.getElementById("wordList");
const newWordInput = document.getElementById("newWord");
const addWordButton = document.getElementById("addWord");

function loadWordList() {
    chrome.storage.sync.get("wordList", ({ wordList }) => {
        wordListElement.innerHTML = "";
        (wordList || []).forEach((word, index) => {
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
    });
}

function addWord() {
    const word = newWordInput.value.trim();
    if (!word) return;

    chrome.storage.sync.get("wordList", ({ wordList }) => {
        const updatedList = wordList ? [...wordList, word] : [word];
        chrome.storage.sync.set({ wordList: updatedList }, loadWordList);
        newWordInput.value = "";
    });
}

function removeWord(index) {
    chrome.storage.sync.get("wordList", ({ wordList }) => {
        wordList.splice(index, 1);
        chrome.storage.sync.set({ wordList }, loadWordList);
    });
}

addWordButton.addEventListener("click", addWord);
loadWordList();
