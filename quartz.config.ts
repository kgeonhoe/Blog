import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Gray's DataHub",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "ko-KR",
    baseUrl: "kgeonhoe.github.io/Blog",
    ignorePatterns: ["private", "templates", "Templates", ".obsidian", "Notes", "Daily"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      // 실제 화면 폰트는 Pretendard Variable (Head.tsx에서 CDN 로드, custom.scss에서 최우선 지정).
      // 아래 Noto Sans KR는 폴백 + OG 이미지(satori) 한글 렌더링용 — Google Fonts에 있는 폰트만 지정할 것.
      typography: {
        header: "Noto Sans KR",
        body: "Noto Sans KR",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#faf9f5", // 웜 크림 배경
          lightgray: "#e8e4db", // 경계선
          gray: "#9a9384", // 날짜·그래프 링크
          darkgray: "#3d3a34", // 본문 텍스트
          dark: "#1f1e1d", // 제목
          secondary: "#a84f2f", // 링크·사이트 타이틀 (테라코타)
          tertiary: "#c96442", // 호버
          highlight: "rgba(201, 100, 66, 0.08)",
          textHighlight: "#f7e39a88",
        },
        darkMode: {
          light: "#1f1e1d", // 웜 차콜 배경
          lightgray: "#3a3733", // 경계선
          gray: "#89826f", // 날짜·그래프 링크
          darkgray: "#d5d1c7", // 본문 텍스트
          dark: "#f0eee6", // 제목 (아이보리)
          secondary: "#d97757", // 링크·사이트 타이틀 (코럴)
          tertiary: "#e69873", // 호버
          highlight: "rgba(217, 119, 87, 0.1)",
          textHighlight: "#f5d76e40",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
