## 1. Dependencies

- [ ] 1.1 Install `react-markdown` and `@types/react-markdown` (markdown rendering)
- [ ] 1.2 Install `gray-matter` and `@types/gray-matter` (frontmatter parsing)
- [ ] 1.3 Install `@tailwindcss/typography` (prose styling for rendered markdown)
- [ ] 1.4 Add `require('@tailwindcss/typography')` to `tailwind.config.ts` plugins array

## 2. Utilities

- [ ] 2.1 Create `lib/spec-utils.ts` with `extractSpecMeta(markdown: string, filename?: string): { title: string; frontmatter: Record<string, unknown> }` — parses frontmatter with gray-matter; falls back to title-casing the filename when no `title` field is present
- [ ] 2.2 Add `stripFrontmatter(markdown: string): string` to `lib/spec-utils.ts` — returns markdown body with YAML frontmatter block removed
- [ ] 2.3 Add `extractCriteriaCount(markdown: string): number` to `lib/spec-utils.ts` — counts `### Requirement:` headers in the markdown body

## 3. GitHub helpers

- [ ] 3.1 Create `lib/github-spec.ts` with `fetchSpecContent(token: string, owner: string, repo: string, specPath: string): Promise<{ markdown: string; filename: string } | null>` — calls `octokit.rest.repos.getContent`; returns decoded base64 content; returns `null` on 404
- [ ] 3.2 Add `fetchLastCommit(token: string, owner: string, repo: string, specPath: string): Promise<{ login: string | null; avatarUrl: string | null; date: string } | null>` to `lib/github-spec.ts` — calls `octokit.rest.repos.listCommits` with `path` and `per_page: 1`; extracts `author.login`, `author.avatar_url`, and `commit.author.date`
- [ ] 3.3 Add `fetchDirectoryListing(token: string, owner: string, repo: string, dirPath: string): Promise<string[]>` to `lib/github-spec.ts` — calls `octokit.rest.repos.getContent` on a directory path; returns array of filenames (type `"file"` entries only); returns `[]` on 404

## 4. Route

- [ ] 4.1 Create `app/(shell)/repo/[owner]/[name]/specs/[...specPath]/page.tsx` as an async server component — awaits `auth()`, redirects to `/login` if no session; derives `changeSlug` and `specFilename` from `specPath` segments
- [ ] 4.2 In the page server component, call `fetchSpecContent` to retrieve the markdown; render a "Spec not found" message with an "All Specs" link if `null` is returned
- [ ] 4.3 In the page server component, call `fetchLastCommit` to get author and date; pass to `SpecDetailView`
- [ ] 4.4 In the page server component, call `fetchDirectoryListing` for `openspec/changes/[changeSlug]/contracts` and `openspec/changes/[changeSlug]/tests`; pass file lists to `SpecDetailView`
- [ ] 4.5 Pass all fetched data (markdown, filename, author, date, contractFiles, testFiles) as props to `SpecDetailView`

## 5. Components

- [ ] 5.1 Create `components/SpecDetailView.tsx` as a `"use client"` component — accepts markdown, filename, author, avatarUrl, date, contractFiles, testFiles props; manages active tab state with `useState` defaulting to `"overview"`
- [ ] 5.2 Create `components/SpecTitleSection.tsx` — renders the spec title (from `extractSpecMeta`), GitHub avatar (`<Image>`) and username, formatted date ("Updated [Month] [Day], [Year]"), and a hardcoded "Draft" status badge
- [ ] 5.3 Create `components/CriteriaProgressBar.tsx` — accepts `total: number` and `validated: number` props; renders a filled progress bar with label "N of M criteria validated"; returns `null` when `total === 0`; uses green fill when `validated === total`
- [ ] 5.4 Create `components/SpecTabBar.tsx` — renders four tabs (Overview, Criteria, Contracts, Tests) with underline indicator on the active tab; accepts badge counts for Criteria, Contracts, and Tests; calls an `onTabChange` callback on click
- [ ] 5.5 Create `components/SpecMarkdownRenderer.tsx` as a `"use client"` component — wraps `ReactMarkdown` with `className="prose prose-sm max-w-none"` to apply Tailwind typography styles
- [ ] 5.6 Create `components/CriteriaTab.tsx` — accepts `markdown: string`; extracts requirement names with `extractCriteriaCount` and a `extractRequirementNames(markdown): string[]` helper; renders a read-only checklist row per requirement showing an unchecked checkbox, requirement name, and "pending" badge; renders "No criteria defined for this spec." when list is empty
- [ ] 5.7 Create `components/FileListTab.tsx` — accepts `files: string[]` and `emptyMessage: string` props; renders a document-icon row per filename; renders `emptyMessage` when `files` is empty; reused for both Contracts and Tests tabs
- [ ] 5.8 Wire `SpecDetailView` to render: `<SpecTitleSection>` → `<CriteriaProgressBar>` → `<SpecTabBar>` → tab content area switching between `<SpecMarkdownRenderer>`, `<CriteriaTab>`, and `<FileListTab>` based on active tab

## 6. Tests

- [ ] 6.1 Translate unit flows from `tests/feature-spec-detail-view.flow.md` to `tests/unit/spec-utils.test.ts` — covers `extractSpecMeta` (with and without frontmatter title), `stripFrontmatter`, `extractCriteriaCount` (partial, none, all), and `CriteriaProgressBar` render variants
- [ ] 6.2 Translate e2e flows from `tests/feature-spec-detail-view.flow.md` to `tests/e2e/spec-detail-view.spec.ts` — covers: navigation to spec, spec not found, title section (creator + date + status badge), default Overview tab, tab switching, criteria tab content, contracts tab content, tests tab content
