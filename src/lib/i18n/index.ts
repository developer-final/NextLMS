import { Language, DictionaryType, SUPPORTED_LANGUAGES } from "./types";
import { vi } from "./vi";
import { en } from "./en";

export const dictionaries: Record<Language, DictionaryType> = {
  vi,
  en,
};

export function getDictionary(lang: Language): DictionaryType {
  return dictionaries[lang] || dictionaries.vi;
}

export * from "./types";
