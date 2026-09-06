# Jaejun Wiki

GitHub Pages에 배포되는 정적 산출물 저장소입니다.

이 저장소는 비공개 `jwiki-cli` 저장소 안의 `output/`에 위치하는 유일한 생성 사이트 작업 트리입니다. HTML, Manifest와 Runtime Asset은 부모 저장소의 Markdown·JSON·Template 원본과 Renderer에서 직접 생성됩니다. `output/`을 삭제해도 부모 `jwiki-cli`에서 `npm run build`를 실행하면 공개 파일이 다시 생성됩니다.

`.git/`은 빌드 산출물이 아니므로 삭제한 경우 별도로 공개 저장소 연결을 복구해야 합니다.
