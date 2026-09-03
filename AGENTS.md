# Jaejun Wiki Public Output

## 저장소 경계

- 이 공개 저장소는 GitHub Pages에 배포되는 생성 HTML과 정적 Runtime Asset만 관리한다.
- Markdown·JSON 작성 원본, 학습 상태, Queue, Writer, Renderer, Audit, Repository CLI, Codex Hook과 저장소 전용 Skill의 단일 원본은 형제 비공개 저장소 `../jwiki-cli/`다.
- 이 저장소의 생성 산출물을 직접 편집하지 않는다. 변경은 `jwiki-cli`에서 원본을 수정하고 Build·Audit를 통과한 뒤 `npm run publish`로 동기화한다.

## 검증·Git 경계

- Git 변경 전 Branch, `git status --short`, Remote를 확인하고 사용자 변경을 보존한다.
- 동기화 뒤 공개 저장소에는 HTML, CSS, 브라우저 JavaScript, 이미지, 공개 JSON 색인, sitemap과 최소 저장소 메타데이터만 남아야 한다.
- Commit, Push와 GitHub Pages 배포는 각각 별도 단계로 검증한다.
