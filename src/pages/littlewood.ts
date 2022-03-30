import { createApp } from "vue";
import createI18n from "@/util/internationalization";
import App from "./Littlewood.vue";

import "bootstrap/scss/bootstrap.scss";
import "bootstrap-icons/font/bootstrap-icons.css";

const app = createApp(App);
app.use(createI18n());
app.mount("#app");
