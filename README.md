# Bad LLM Detector

Chrome extension that helps you identify AI generated texts while browsing the web. It highlights words frequently used by large language models (LLMs) to give you quick (but not perfect) clues that the content might be AI generated.

The extension uses a customizable list of words, originally sourced from [FareedKhan-dev/Detect-AI-text-Easily](https://github.com/FareedKhan-dev/Detect-AI-text-Easily).

> **Disclaimer**: Detection is not accurate! The name "BAD" in "Bad LLM Detector" reflects a LOTS of false-positive and false-negative results.

Use this extension as a fun and quick way to identify potential AI-written content, but always verify content sources manually.

---

## Features
- Automatically highlights commonly used LLM words on any webpage
- **Built-in default word list**: Based on LLM-generated text analysis (can be disabled)
- **Custom word lists**: Add your own words
- **Detected words statistic**
- **External word list URLs**: Subscribe to third-party .txt word lists from URLs
- **Enable/disable lists**: Toggle any list on or off without removing it
- Visual badge indicator showing the number of detected words on each page

---

## How to Install (Unpacked Extension)
1. Download or clone this repository to your local machine
   ```bash
   git clone https://github.com/artturik/Bad-LLM-Detector.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select the folder where you downloaded/cloned the extension
6. The extension will now appear in your extensions list

---

### Detection Mode
Choose how detected words are displayed on web pages:

#### Highlight Mode (Default)
- Detected words are styled with custom colors, borders, backgrounds, etc.
- The original word remains visible but highlighted
- Configure appearance in the "Highlight Style" section

#### Replace Mode
- Detected words are replaced with custom text
- Default replacement: `!AI SLOP!`
- Supports `$0` placeholder to include the original word
  - Example: `[$0]` would replace "delve" with "[delve]"
  - Example: `!AI SLOP!` would replace all words with "!AI SLOP!"

### Adding External Word Lists
1. Go to the Options page
2. Under "External Word Lists", enter:
   - **List URL**: A direct URL to a .txt file (e.g., `https://example.com/llm-words.txt`)
   - **List Name**: A friendly name for the list
3. Click "Add List"
4. The list will be fetched immediately and updated on every browser startup

### Word List Format
External word lists should be plain text files (`.txt`) with:
- One word or phrase per line
- Comments starting with `#` (ignored)
- Empty lines (ignored)

Example:
```
# My LLM words list
Delve
Leverage
# This is a comment
Revolutionary
```

See `example-wordlist.txt` for a complete example.

---

## License
MIT License

---

## Credits
- Word list inspired by [FareedKhan-dev/Detect-AI-text-Easily](https://github.com/FareedKhan-dev/Detect-AI-text-Easily)
- findAndReplaceDOMText by James Padolsey
