window.CODING_TEST_STATE = {
  journey: {
    eyebrow: "Road to coding test",
    title: "실전 문제 해결까지의 학습 여정",
    summary: "사용자가 코딩 테스트를 하겠다고 선택한 세션에만 진행합니다. 속도는 처음부터 기록하되 기초 단계에서는 합격 판정이 아니라 막힌 지점을 찾는 데 사용하고, 대표 문제 학습 → 같은 패턴 전이 → 제한시간 혼합 세트의 세 단계로 올라갑니다. 매 시도의 시간·막힌 위치·힌트·재풀이 증거로 다음 문제 또는 보강 방식을 결정합니다.",
    currentId: "binary-search",
    finalOutcome: "핵심 종착점은 유형 이름을 미리 보지 않은 문제에서도 제약을 읽고 후보 풀이를 비교한 뒤, 제한 시간 안에 구현·검증하고 실패 원인과 시간·공간 복잡도를 설명하며 다시 풀 수 있는 상태입니다.",
    milestones: [
      {
        id: "python-modeling",
        title: "문제 해석·Python 기초",
        shortTitle: "해석·Python",
        status: "complete",
        statusLabel: "완료",
        href: "wiki/coding-test/index.html#problems",
        goal: "입력·출력·제약을 작은 예제로 바꾸고 예상 결과를 코드 전에 말합니다. list·dict·set·문자열·정렬 같은 Python 도구를 값의 저장 방식과 필요한 연산에 맞춰 선택하고, 단순 반복문의 실행 흐름을 직접 추적합니다.",
        evidence: "문자열·배열·Hash 문제를 포함한 여러 문제에서 dict·set·정렬·문자열 변환을 사용했고, 문제별 문서에 풀이 흐름과 헷갈린 지점을 남겼습니다."
      },
      {
        id: "core-patterns",
        title: "완전탐색·그리디·Stack·Queue",
        shortTitle: "핵심 패턴",
        status: "complete",
        statusLabel: "기초 적용 완료",
        href: "wiki/coding-test/index.html#algorithms",
        goal: "가능한 후보를 빠짐없이 만드는 완전탐색, 현재 선택이 이후 선택을 망치지 않는 그리디 근거, 최근 값 또는 먼저 들어온 값을 처리하는 Stack·Queue 상태를 구분합니다. 단순 풀이와 개선 풀이의 연산 수를 비교합니다.",
        evidence: "조합·완전탐색·정렬 뒤 선택·기능개발 Queue를 실제 문제에 적용했고, 프로세스에서는 원래 인덱스를 보존하며 Queue 회전과 실제 실행 횟수를 구분했습니다. 올바른 괄호는 이전 풀이를 보지 않고 다시 풀어 조기 종료 조건을 설명했습니다."
      },
      {
        id: "dfs-bfs-dp-basic",
        title: "DP·DFS·BFS 기초 적용",
        shortTitle: "DP·DFS·BFS",
        status: "complete",
        statusLabel: "기초 적용 완료",
        href: "wiki/coding-test/index.html#current-position",
        goal: "DP에서는 저장할 상태와 이전 상태의 관계를 정하고, DFS에서는 한 경로의 선택과 복귀를 추적하며, BFS에서는 FIFO Queue가 같은 거리의 상태를 먼저 처리해 무가중치 최단거리를 만드는 이유를 설명합니다.",
        evidence: "피보나치 수에서 이전 값을 저장했고, 타겟 넘버의 이진 선택을 DFS로, 게임 맵 최단거리를 2차원 BFS로 구현했습니다. 일반 그래프와 2차원 DP로의 전이는 아직 남아 있습니다."
      },
      {
        id: "binary-search",
        title: "이분 탐색 경계 설계",
        shortTitle: "이분 탐색",
        status: "current",
        statusLabel: "현재",
        href: "wiki/coding-test/index.html#first-loop",
        goal: "프로그래머스 입국심사에서 사람을 직접 배치하는 문제를 ‘주어진 시간 안에 n명을 처리할 수 있는가?’라는 가능 여부 문제로 바꿉니다. 첫 대표 풀이에서는 걸린 시간을 기록만 하고 작은 입력의 처리 인원과 경계 이동을 충분히 추적합니다. 이후 단조롭게 변하는 범위, left·right의 의미, mid 판정과 종료 뒤 최소 가능 시간이 어느 변수인지 설명하고 자료 없이 다시 구현합니다.",
        evidence: "개념 문서는 준비되어 있지만 실제 문제 풀이 증거는 아직 없습니다. 작은 입력의 처리 인원 예측, 경계 갱신 추적, 정답 제출, 복잡도 설명과 자료 없는 재구현을 확인하면 완료됩니다."
      },
      {
        id: "heap-general-graph",
        title: "Heap 적용·일반 그래프 탐색",
        shortTitle: "Heap·Graph",
        status: "upcoming",
        statusLabel: "Heap 적용 완료 · Graph 예정",
        href: "wiki/coding-test/index.html#first-loop",
        goal: "더 맵게에서 매 단계 최솟값 두 개를 꺼내야 하는 이유와 Heap이 반복 정렬보다 유리한 조건을 설명합니다. 네트워크·단어 변환에서는 격자가 아닌 연결 관계를 만들고, 연결 요소 개수와 최소 단계라는 목표에 따라 DFS와 BFS를 선택합니다.",
        evidence: "더 맵게에서 heap[0]만 최솟값을 보장한다는 점과 heappop·heappush·원소 부족 종료 조건을 적용했습니다. 이 관문 전체를 닫으려면 네트워크·단어 변환에서 인접 관계 구성, 방문 처리와 DFS/BFS 선택 근거를 구현하고 자료 없이 다시 설명해야 합니다."
      },
      {
        id: "weighted-path-dp",
        title: "가중치 최단경로·DP 상태 설계",
        shortTitle: "Dijkstra·DP",
        status: "upcoming",
        statusLabel: "예정",
        href: "wiki/coding-test/index.html#first-loop",
        goal: "배달 문제에서 가중치가 다르면 일반 BFS로 최소 비용을 보장할 수 없는 이유를 설명하고, 거리 갱신과 우선순위 Queue를 연결합니다. 정수 삼각형·등굣길에서는 dp[r][c]의 뜻을 먼저 문장으로 정의하고 점화식·초깃값·계산 순서를 구현합니다.",
        evidence: "직접 만든 작은 그래프의 거리 갱신 순서와 DP Table을 손으로 추적하고, 대표 문제와 조건을 바꾼 문제에서 같은 상태 정의를 다시 구성하면 완료됩니다."
      },
      {
        id: "mst-practical-transfer",
        title: "최소 연결·혼합 실전 전이",
        shortTitle: "MST·실전",
        status: "upcoming",
        statusLabel: "핵심 종착점",
        href: "wiki/coding-test/index.html#final-gate",
        goal: "섬 연결하기에서 모든 정점을 최소 비용으로 연결하면서 Cycle을 막는 기준을 구현합니다. 이후 유형이 표시되지 않은 프로그래머스 혼합 문제에서 문제 해석 → Baseline → 알고리즘 선택 → 구현 → 예외 검증 → 복잡도 설명의 순서를 제한 시간 안에 반복합니다.",
        evidence: "최소 연결 문제의 선택 기준과 Union-Find 또는 동등한 Cycle 방지 방식을 설명하고, 처음 보는 혼합 문제 세트에서 실패 지점을 분류해 보완한 뒤 이전 코드를 보지 않고 재풀이하면 핵심 여정이 완료됩니다."
      }
    ]
  }
};
