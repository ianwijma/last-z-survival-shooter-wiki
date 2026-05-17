import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
  search: {
    codeblocks: false,
  },
  whiteListTagsStyling: ["table", "thead", "tbody", "tr", "th", "td"],
});

export default withNextra({
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.WIKI_BASE_PATH ?? "",
  trailingSlash: true,
  reactStrictMode: true,
});
