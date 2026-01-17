import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: "system", // Keep system for now, assuming user has dark mode or we force it via CSS.
      // Actually, let's allow manual toggle or just force it.
      // User requested "professional audio app", usually dark.
      // Let's rely on standard dark mode.
      cssLayer: {
        name: "primevue",
        order: "tailwind-base, primevue, tailwind-utilities",
      },
    },
  },
});

app.mount("#app");
