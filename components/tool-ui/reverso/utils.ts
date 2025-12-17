/**
 * Get display name for language code
 */
export function getLanguageDisplayName(langCode: string): string {
	const languageMap: Record<string, string> = {
		french: "Français",
		english: "English",
		spanish: "Español",
		german: "Deutsch",
		italian: "Italiano",
		portuguese: "Português",
		russian: "Русский",
		chinese: "中文",
		japanese: "日本語",
		fr: "Français",
		en: "English",
		es: "Español",
		de: "Deutsch",
		it: "Italiano",
		pt: "Português",
		ru: "Русский",
		zh: "中文",
		ja: "日本語",
	};

	return languageMap[langCode.toLowerCase()] || langCode;
}
