import { createI18n as vueCreateI18n } from "vue-i18n";
// @ts-ignore
import languages from "val-loader!../lang/import";

console.log(languages);

export default function createI18n() {
  return vueCreateI18n({
    locale: "nl",
    messages: languages,
  });
}
