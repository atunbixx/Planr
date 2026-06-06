import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planr — plan life's gatherings",
    short_name: "Planr",
    description: "Plan your wedding and every celebration in one place.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf5ec",
    theme_color: "#c25435",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
