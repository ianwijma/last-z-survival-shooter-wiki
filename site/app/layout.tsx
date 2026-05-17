import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap();

  return (
    <html lang="en" suppressHydrationWarning>
      <Head faviconGlyph="🎯" />
      <body>
        <Layout
          pageMap={pageMap}
          navbar={
            <Navbar
              logo={
                <span className="font-bold">
                  Last Z: Survival Shooter Wiki
                </span>
              }
              projectLink="https://github.com/ianwijma/last-z-survival-shooter-wiki"
            />
          }
          footer={<Footer>MIT 2026 © Last Z Wiki Contributors</Footer>}
          docsRepositoryBase="https://github.com/ianwijma/last-z-survival-shooter-wiki"
          editLink="Edit this page on GitHub"
          sidebar={{
            defaultMenuCollapseLevel: 1,
            autoCollapse: true,
            toggleButton: true,
          }}
          toc={{
            title: "On This Page",
            backToTop: "Back to top",
          }}
          darkMode={true}
          navigation={{ prev: true, next: true }}
          feedback={{
            content: "Found an error? Let us know →",
            labels: "feedback",
            link: "https://github.com/ianwijma/last-z-survival-shooter-wiki/issues/new",
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
