window.CODING_TEST_STATE = {
  journey: {
    eyebrow: "Road to coding test",
    title: "실전 문제 해결까지의 학습 여정",
    summary: "사용자가 코딩 테스트를 하겠다고 선택한 세션에만 진행합니다. 프로그래머스 공식 빈출 유형과 공개 기업 시험 사례를 기준으로 처음 접하는 핵심 패턴을 대표 문제와 안내 풀이로 빠르게 장착합니다. 새 패턴 학습과 이전 패턴의 자료 없는 재구현을 병행한 뒤, 핵심 묶음이 갖춰지면 유형을 미리 밝히지 않은 3문제·120분 혼합 세트로 전환합니다.",
    currentId: "weighted-path-dp",
    finalOutcome: "핵심 종착점은 학습한 패턴의 코드를 그대로 암기하는 것이 아니라 유형 이름을 미리 보지 않은 문제에서도 제약을 읽고 사용할 패턴을 선택·변형해, 3문제·120분 기본 세트에서 구현·검증하고 실패 원인과 시간·공간 복잡도를 설명하며 다시 풀 수 있는 상태입니다.",
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
        evidence: "피보나치 수에서 이전 값을 저장했고, 타겟 넘버의 이진 선택을 DFS로, 게임 맵 최단거리를 2차원 BFS로 구현했습니다. 이후 네트워크의 연결 요소를 DFS로, 단어 변환의 최소 단계를 BFS로 구현해 일반 그래프까지 전이했습니다. 2차원 DP 상태 설계는 다음 관문에 남아 있습니다."
      },
      {
        id: "binary-search",
        title: "이분 탐색 경계 설계",
        shortTitle: "이분 탐색",
        status: "complete",
        statusLabel: "완료",
        href: "wiki/coding-test/index.html#first-loop",
        goal: "프로그래머스 입국심사에서 사람을 직접 배치하는 문제를 ‘주어진 시간 안에 n명을 처리할 수 있는가?’라는 가능 여부 문제로 바꿉니다. 첫 대표 풀이에서는 걸린 시간을 기록만 하고 작은 입력의 처리 인원과 경계 이동을 충분히 추적합니다. 이후 단조롭게 변하는 범위, left·right의 의미, mid 판정과 종료 뒤 최소 가능 시간이 어느 변수인지 설명하고 자료 없이 다시 구현합니다.",
        evidence: "입국심사와 퍼즐 게임 챌린지 제출 통과 뒤 하루가 지난 2026-08-31에 입국심사를 기존 코드 없이 다시 구현해 전체 테스트에 통과했습니다. 27분은 불가능하고 28분은 최초 가능인 경계에서 left·right가 교차하는 이유를 설명하고, 심사관 m명을 매번 확인하는 전체 시간 복잡도를 O(m log R)로 교정해 이분 탐색 관문을 완료했습니다."
      },
      {
        id: "heap-general-graph",
        title: "Heap 적용·일반 그래프 탐색",
        shortTitle: "Heap·Graph",
        status: "complete",
        statusLabel: "완료",
        href: "wiki/coding-test/index.html#first-loop",
        goal: "더 맵게에서 매 단계 최솟값 두 개를 꺼내야 하는 이유와 Heap이 반복 정렬보다 유리한 조건을 설명합니다. 네트워크·단어 변환에서는 격자가 아닌 연결 관계를 만들고, 연결 요소 개수와 최소 단계라는 목표에 따라 DFS와 BFS를 선택합니다.",
        evidence: "더 맵게에서 heap[0]만 최솟값을 보장한다는 점과 heappop·heappush·원소 부족 종료 조건을 적용했습니다. 네트워크에서는 인접 행렬의 연결 요소를 DFS 시작 횟수로 세고 O(n²) 복잡도를 설명했으며, 단어 변환에서는 한 글자 차이 상태를 BFS Queue와 방문 집합으로 탐색해 최소 단계를 구하고 두 문제 모두 제출에 통과했습니다."
      },
      {
        id: "weighted-path-dp",
        title: "가중치 최단경로·DP 상태 설계",
        shortTitle: "Dijkstra·DP",
        status: "current",
        statusLabel: "현재 · DP 상태 설계",
        href: "wiki/coding-test/index.html#first-loop",
        goal: "배달 문제의 가중치 최단경로 첫 학습을 마쳤습니다. 이제 땅따먹기·정수 삼각형·등굣길의 안내 풀이로 dp[i] 또는 dp[r][c]의 뜻, 점화식·초깃값·계산 순서를 빠르게 장착합니다.",
        evidence: "배달에서 양방향 인접 리스트·distance 초기화·최소 Heap·낡은 후보 확인·거리 완화·결과 계산을 다시 구성했고, 표준 코드로 프로그래머스 정확성 100점·전체 32개 테스트 통과 증거를 확인했습니다. Heap Tuple 순서와 누적 new_cost 전달은 힌트로 교정했으며, 일반 BFS가 가중치 최소 비용을 보장하지 못하는 이유, 개선되지 않은 경로를 다시 넣지 않는 이유, 일반 O((V+E) log V)와 빽빽한 그래프의 O(V² log V)를 설명했습니다. 다익스트라 첫 학습은 완료했고 DP 상태 설계가 남아 통합 관문은 현재로 유지합니다."
      },
      {
        id: "range-scan-backtracking",
        title: "구간 탐색·백트래킹 패턴",
        shortTitle: "구간·백트래킹",
        status: "upcoming",
        statusLabel: "예정 · 핵심 패턴 장착",
        href: "wiki/coding-test/index.html#transfer-loop",
        goal: "연속된 부분 수열의 합·할인 행사·광고 삽입에서 투 포인터·슬라이딩 윈도우·누적합이 경계를 이동하거나 계산을 재사용하는 방식을 구분합니다. 피로도에서는 선택 → 재귀 → 상태 복원의 흐름과 가지치기 조건을 구현합니다.",
        evidence: "각 패턴의 사용 신호·핵심 상태·갱신 규칙을 설명하고 안내받은 대표 문제를 구현한 뒤, 다음 학습일에 자료 없이 하나씩 다시 구성하면 완료됩니다."
      },
      {
        id: "mst-practical-transfer",
        title: "Union-Find·MST·위상 정렬",
        shortTitle: "Graph 확장",
        status: "upcoming",
        statusLabel: "예정 · 그래프 패턴 장착",
        href: "wiki/coding-test/index.html#transfer-loop",
        goal: "섬 연결하기에서 Union-Find로 같은 집합 여부를 관리하고, MST로 모든 정점을 최소 비용으로 연결하면서 Cycle을 막습니다. 위상 정렬은 작은 자체 그래프에서 진입 차수와 Queue로 실행 순서를 만든 뒤 스킬트리의 선행관계 해석과 차이를 구분합니다.",
        evidence: "각 패턴의 핵심 상태와 선택 기준을 작은 그래프로 추적하고 대표 문제를 구현한 뒤, 자료 없이 다시 구성하면 완료됩니다."
      },
      {
        id: "mixed-practical-transfer",
        title: "유형 비공개 혼합 문제 적용",
        shortTitle: "혼합 적용",
        status: "upcoming",
        statusLabel: "핵심 종착점",
        href: "wiki/coding-test/index.html#final-gate",
        goal: "핵심 패턴의 첫 학습과 자료 없는 재구현을 닫은 뒤, 유형이 표시되지 않은 프로그래머스 3문제·120분 세트에서 구현·문자열, 자료구조·탐색, DP·그래프·이분 탐색 후보를 비교하고 구현·검증합니다.",
        evidence: "3문제 중 2문제 이상을 완전히 통과하는 결과를 세 세트 연속 만들고, 실패 지점을 분류해 보완한 뒤 각 미해결 문제도 이전 코드를 보지 않고 다시 풀면 핵심 여정이 완료됩니다. 이 기준은 특정 기업의 공식 합격선이 아닌 내부 훈련 기준입니다."
      }
    ]
  }
};
