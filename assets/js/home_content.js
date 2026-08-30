window.HOME_CONTENT = {
  featuredProjects: [
    {
      eyebrow: "Fine-tuning · Evaluation",
      title: "한국어 Kubernetes Function Calling",
      href: "wiki/projects/ko-k8s-function-calling.html",
      description: "Qwen3-1.7B가 한국어 Kubernetes 조회 요청에 맞는 함수와 인자를 선택하도록 LoRA 파인튜닝하고 동일 조건에서 평가했습니다.",
      stack: ["Qwen3-1.7B", "LoRA", "vLLM", "Contract Eval"],
      role: "데이터셋 · 학습 · 서빙 · 평가 설계",
      evidence: "Full success 36% → 96%",
      supportingEvidence: "Argument exact match 29.41% → 95.29%"
    },
    {
      eyebrow: "AI Observability",
      title: "Kubernetes 운영 관측 AI",
      href: "wiki/projects/kubernetes-ai-observability.html",
      description: "Pod의 Metrics·Logs·Events를 수집하고, 관측 신호·해석·근거를 분리한 AI Summary로 연결했습니다.",
      stack: ["FastAPI", "React", "LangGraph", "Kubernetes"],
      role: "기획 · 풀스택 · AI Workflow",
      evidence: "Metrics · Logs · Events 근거 분리",
      supportingEvidence: "탭별 AI Summary 3개 기능 시연",
      image: "assets/images/projects/kubernetes-observability/metrics-summary-overview.webp",
      imageAlt: "Kubernetes Metrics AI Summary 화면"
    },
    {
      eyebrow: "RAG · AI Application",
      title: "Notion RAG 개인 지식 비서",
      href: "wiki/projects/notion-rag-knowledge-assistant.html",
      description: "Notion 문서 수집과 임베딩부터 근거 기반 실시간 질의응답, 퀴즈·채점·학습 통계까지 하나의 서비스로 연결했습니다.",
      stack: ["FastAPI", "Next.js", "PostgreSQL", "Qdrant"],
      role: "문서 수집 · 검색 · 생성 · 결과 관리",
      evidence: "수집 → 검색·채팅 → 퀴즈·통계",
      supportingEvidence: "WebSocket 응답과 사용자별 학습 이력",
      image: "assets/images/projects/notion-rag/rag-chat.webp",
      imageAlt: "Notion 문서 기반 RAG 채팅 화면"
    },
    {
      eyebrow: "Coding Agent Workflow · Static Wiki",
      title: "개인화 학습 코치 위키",
      href: "wiki/projects/adaptive-learning-coach.html",
      description: "코딩 에이전트가 로드맵과 학습 기록을 함께 읽어 현재 관문과 실제 학습 근거에 맞는 다음 행동을 정하고, 보류 목록과 기술 문서를 정적 HTML 위키에 축적하는 개인화 학습 시스템입니다.",
      stack: ["HTML", "JavaScript", "Node.js", "AI Workflow"],
      role: "학습 정책 · 상태 모델 · 정보 구조 · 검증",
      evidence: "학습 기록 → 로드맵과 비교 → 지금 할 한 단계",
      supportingEvidence: "현재 관문·완료 조건·확인 근거·보류 이유를 남겨 중요한 학습에 집중",
      image: "assets/images/projects/adaptive-learning-coach/personal-learning-loop-featured.svg",
      imageAlt: "학습 행동을 증거와 기억으로 축적해 개인화된 설명과 다음 행동으로 되돌리는 개인화 학습 코치 위키 흐름"
    },
    {
      eyebrow: "Personal Health Data · AI Coaching",
      title: "개인화 헬스 기록 코치",
      href: "wiki/projects/personal-health-coach.html",
      description: "하루의 운동·식사·체성분을 날짜별로 축적하고, 월별 운동일과 수행 이력, 근육 자극 분포와 영양 구성을 한눈에 확인하는 개인 헬스 기록 시스템입니다.",
      stack: ["HTML", "JavaScript", "Data Modeling", "AI Coaching"],
      role: "기록 정책 · 파생 계산 · 코칭 기준 · 정보 구조",
      evidence: "날짜별 기록 → 월별 운동일·자극·영양 분석",
      supportingEvidence: "누적 기록을 현재 패턴과 다음 행동의 근거로 재사용",
      image: "assets/images/projects/personal-health-coach/muscle-stimulation-map.webp",
      imageAlt: "최근 운동 기록을 앞뒤 인체 도해의 근육 자극 분포로 표시한 개인화 헬스 기록 코치 화면"
    }
  ],
  knowledgeAreas: [
    {
      eyebrow: "AI Systems",
      title: "LLM 시스템·에이전트",
      href: "wiki.html#wiki-category-llm-systems",
      description: "RAG, Function Calling, Agent, 모델 서빙과 평가를 실제 애플리케이션 흐름으로 연결한 기록입니다."
    },
    {
      eyebrow: "Model Internals",
      title: "Transformer",
      href: "wiki.html#wiki-category-transformer",
      description: "Embedding, Attention, Decoder와 Token Loss를 직접 구현하며 내부 계산과 Tensor Shape을 검증한 기록입니다."
    },
    {
      eyebrow: "Deep Learning",
      title: "PyTorch",
      href: "wiki.html#wiki-category-pytorch",
      description: "Tensor, Autograd, Dataset, 학습·평가 루프를 작은 실습에서 모델 구현까지 연결한 기록입니다."
    },
    {
      eyebrow: "Machine Learning",
      title: "Machine Learning",
      href: "wiki.html#wiki-category-machine-learning",
      description: "문제 정의, 데이터 분할, Baseline, Metric과 오류 분석을 중심으로 모델 판단 근거를 정리한 기록입니다."
    }
  ]
};
