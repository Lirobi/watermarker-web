export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Watermarker",
  description: "Add professional watermarks to your images and videos in seconds.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Features",
      href: "/#features",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Watermarker",
      href: "/dashboard",
    },
  ],
  navMenuItems: [
    {
      label: "Watermarker",
      href: "/dashboard",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
  },
};
