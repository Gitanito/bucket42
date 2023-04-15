/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/

'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const DEFAULT_SETTINGS = {
    template: `{{text}}\n> [Wikipedia]({{url}})`,
    shouldUseParagraphTemplate: true,
    shouldBoldSearchTerm: true,
    paragraphTemplate: `> {{paragraphText}}\n>\n`,
    language: "en",
};
const extractApiUrl = "wikipedia.org/w/api.php?format=json&action=query&prop=extracts&explaintext=1&redirects&origin=*&titles=";
const disambiguationIdentifier = "may refer to:";
class WikipediaPlugin extends obsidian.Plugin {
    getLanguage() {
        return this.settings.language ? this.settings.language : "en";
    }
    getUrl(title) {
        return `https://${this.getLanguage()}.wikipedia.org/wiki/${encodeURI(title)}`;
    }
    getApiUrl() {
        return `https://${this.getLanguage()}.` + extractApiUrl;
    }
    formatExtractText(extract, searchTerm) {
        const text = extract.text;
        let formattedText = "";
        if (this.settings.shouldUseParagraphTemplate) {
            const split = text.split("==")[0].trim().split("\n");
            formattedText = split
                .map((paragraph) => this.settings.paragraphTemplate.replace("{{paragraphText}}", paragraph))
                .join("")
                .trim();
        }
        else {
            formattedText = text.split("==")[0].trim();
        }
        if (this.settings.shouldBoldSearchTerm) {
            const pattern = new RegExp(searchTerm, "i");
            formattedText = formattedText.replace(pattern, `**${searchTerm}**`);
        }
        return formattedText;
    }
    handleNotFound(searchTerm) {
        new obsidian.Notice(`${searchTerm} not found on Wikipedia.`);
    }
    handleCouldntResolveDisambiguation() {
        new obsidian.Notice(`Could not automatically resolve disambiguation.`);
    }
    hasDisambiguation(extract) {
        if (extract.text.includes(disambiguationIdentifier)) {
            return true;
        }
        return false;
    }
    parseResponse(json) {
        const pages = json.query.pages;
        const pageKeys = Object.keys(pages);
        if (pageKeys.includes("-1")) {
            return undefined;
        }
        const extracts = pageKeys.map((key) => {
            const page = pages[key];
            const extract = {
                title: page.title,
                text: page.extract,
                url: this.getUrl(page.title),
            };
            return extract;
        });
        return extracts[0];
    }
    formatExtractInsert(extract, searchTerm) {
        const formattedText = this.formatExtractText(extract, searchTerm);
        const template = this.settings.template;
        const formattedTemplate = template
            .replace("{{text}}", formattedText)
            .replace("{{searchTerm}}", searchTerm)
            .replace("{{url}}", extract.url);
        return formattedTemplate;
    }
    getWikipediaText(title) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.getApiUrl() + encodeURIComponent(title);
            const requestParam = {
                url: url,
            };
            const resp = yield obsidian.request(requestParam)
                .then((r) => JSON.parse(r))
                .catch(() => new obsidian.Notice("Failed to get Wikipedia. Check your internet connection or language prefix."));
            const extract = this.parseResponse(resp);
            return extract;
        });
    }
    pasteIntoEditor(editor, searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            let extract = yield this.getWikipediaText(searchTerm);
            if (!extract) {
                this.handleNotFound(searchTerm);
                return;
            }
            if (this.hasDisambiguation(extract)) {
                new obsidian.Notice(`Disambiguation found for ${searchTerm}. Choosing first result.`);
                const newSearchTerm = extract.text
                    .split(disambiguationIdentifier)[1]
                    .trim()
                    .split(",")[0]
                    .split("==")
                    .pop()
                    .trim() + '\n\n';
                extract = yield this.getWikipediaText(newSearchTerm);
                if (!extract) {
                    this.handleCouldntResolveDisambiguation();
                    return;
                }
            }
            editor.replaceSelection(this.formatExtractInsert(extract, searchTerm));
        });
    }
    getWikipediaTextForActiveFile(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const activeFile = yield this.app.workspace.getActiveFile();
            if (activeFile) {
                const searchTerm = activeFile.basename;
                if (searchTerm) {
                    yield this.pasteIntoEditor(editor, searchTerm);
                }
            }
        });
    }
    getWikipediaTextForSearchTerm(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            new WikipediaSearchModal(this.app, this, editor).open();
        });
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.addCommand({
                id: "wikipedia-get-active-note-title",
                name: "Get Wikipedia for Active Note Title",
                editorCallback: (editor) => this.getWikipediaTextForActiveFile(editor),
            });
            this.addCommand({
                id: "wikipedia-get-search-term",
                name: "Get Wikipedia for Search Term",
                editorCallback: (editor) => this.getWikipediaTextForSearchTerm(editor),
            });
            this.addSettingTab(new WikipediaSettingTab(this.app, this));
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
}
class WikipediaSearchModal extends obsidian.Modal {
    constructor(app, plugin, editor) {
        super(app);
        this.plugin = plugin;
        this.editor = editor;
    }
    onOpen() {
        let { contentEl } = this;
        contentEl.createEl("h2", { text: "Enter Search Term:" });
        const inputs = contentEl.createDiv("inputs");
        const searchInput = new obsidian.TextComponent(inputs).onChange((searchTerm) => {
            this.searchTerm = searchTerm;
        });
        searchInput.inputEl.focus();
        searchInput.inputEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.close();
            }
        });
        const controls = contentEl.createDiv("controls");
        const searchButton = controls.createEl("button", {
            text: "Search",
            cls: "mod-cta",
            attr: {
                autofocus: true,
            },
        });
        searchButton.addEventListener("click", this.close.bind(this));
        const cancelButton = controls.createEl("button", { text: "Cancel" });
        cancelButton.addEventListener("click", this.close.bind(this));
    }
    onClose() {
        return __awaiter(this, void 0, void 0, function* () {
            let { contentEl } = this;
            contentEl.empty();
            if (this.searchTerm) {
                yield this.plugin.pasteIntoEditor(this.editor, this.searchTerm);
            }
        });
    }
}
class WikipediaSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Obsidian Wikipedia" });
        new obsidian.Setting(containerEl)
            .setName("Wikipedia Language Prefix")
            .setDesc(`Choose Wikipedia language prefix to use (ex. en for English)`)
            .addText((textField) => {
            textField
                .setValue(this.plugin.settings.language)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.language = value;
                yield this.plugin.saveSettings();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Wikipedia Extract Template")
            .setDesc(`Set markdown template for extract to be inserted.\n
        Available template variables are {{text}}, {{searchTerm}} and {{url}}.
        `)
            .addTextArea((textarea) => textarea
            .setValue(this.plugin.settings.template)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.template = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName("Bold Search Term?")
            .setDesc("If set to true, the first instance of the search term will be **bolded**")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.shouldBoldSearchTerm)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.shouldBoldSearchTerm = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName("Use paragraph template?")
            .setDesc("If set to true, the paragraph template will be inserted for each paragraph of text for {{text}} in main template.")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.shouldUseParagraphTemplate)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.shouldUseParagraphTemplate = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName("Paragraph Template")
            .setDesc(`Set markdown template for extract paragraphs to be inserted.\n
        Available template variables are: {{paragraphText}}
        `)
            .addTextArea((textarea) => textarea
            .setValue(this.plugin.settings.paragraphTemplate)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.paragraphTemplate = value;
            yield this.plugin.saveSettings();
        })));
    }
}

module.exports = WikipediaPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbIlBsdWdpbiIsIk5vdGljZSIsInJlcXVlc3QiLCJNb2RhbCIsIlRleHRDb21wb25lbnQiLCJQbHVnaW5TZXR0aW5nVGFiIiwiU2V0dGluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXVEQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0s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
