import { defineConfig } from "i18next-cli";

export default defineConfig({
	locales: [
		"en-US",
		"en-GB",
		"be-BY",
		"de-DE",
		"es-ES",
		"fr-FR",
		"hi-IN",
		"it-IT",
		"ko-KR",
		"nb-NO",
		"pl-PL",
		"pt-PT",
		"ru-RU",
		"tr-TR",
		"uk-UA",
		"zh-CN",
		"zh-TW",
	],
	extract: {
		input: ["src/**/*.{ts,tsx}"],
		output: "src/translation/{{language}}.json",
		ignore: ["src/translation/**"],
		// Keys use dots as part of the key name (e.g. "Common.On"), not as nesting separators
		keySeparator: false,
		nsSeparator: false,
		defaultNS: "translation",
		mergeNamespaces: true,
		primaryLanguage: "en-US",
		defaultValue: null,
		removeUnusedKeys: true,
		preservePatterns: [
			"Files.FileType.*",
			"SideBar.*",
			"TimeControl.*",
			"Annotate.*",
			"GoMode.*",
			"Errors.*"
		],
		sort: true,
	},
	types: {
		input: ["src/translation/en-US.json"],
		output: "src/i18next.d.ts",
		resourcesFile: "src/types/resources.d.ts",
	},
});
