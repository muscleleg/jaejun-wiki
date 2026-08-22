window.HOME_CONTENT = {
  featuredProjects: [
    {
      eyebrow: "AI observability",
      title: "Kubernetes 운영 관측 AI",
      href: "wiki/projects/kubernetes-ai-observability.html",
      description: "Pod의 Metrics·Logs·Events를 수집하고, LangGraph와 structured output으로 관측 신호·해석·근거를 나누어 보여주는 운영 관측 시스템입니다.",
      stack: ["FastAPI", "React", "LangGraph", "Kubernetes"],
      evidence: "탭별 AI Summary · 컨테이너별 근거 · 3개 기능 시연"
    },
    {
      eyebrow: "RAG learning tool",
      title: "Notion RAG 개인 지식 비서",
      href: "wiki/projects/notion-rag-knowledge-assistant.html",
      description: "Notion 문서 수집과 임베딩부터 근거 기반 실시간 질의응답, 퀴즈 생성·채점·학습 통계까지 하나의 흐름으로 연결한 서비스입니다.",
      stack: ["FastAPI", "Next.js", "PostgreSQL", "Qdrant"],
      evidence: "문서 수집 → 검색·채팅 → 퀴즈·결과 관리"
    },
    {
      eyebrow: "Fine-tuning & evaluation",
      title: "한국어 Kubernetes Function Calling",
      href: "wiki/projects/ko-k8s-function-calling.html",
      description: "Qwen3-1.7B가 한국어 Kubernetes 조회 요청에 맞는 함수와 인자를 선택하도록 LoRA 파인튜닝하고, 같은 조건에서 평가한 프로젝트입니다.",
      stack: ["Qwen3-1.7B", "LoRA", "vLLM", "RunPod"],
      evidence: "Full success 36% → 96%"
    }
  ],
  knowledgeAreas: [
    {
      eyebrow: "Model internals",
      title: "Transformer",
      href: "wiki/transformer/transformer_learning.html",
      description: "Embedding부터 Attention·Residual·LayerNorm·FFN까지 직접 구현하고, Shape과 계산 흐름을 검증한 기록입니다."
    },
    {
      eyebrow: "Training framework",
      title: "PyTorch",
      href: "wiki.html#pytorch",
      description: "Tensor, Autograd, Optimizer와 Dataset·DataLoader가 학습 코드로 이어지는 과정을 확인한 기록입니다."
    },
    {
      eyebrow: "Data modeling",
      title: "Machine Learning",
      href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html",
      description: "문제 정의와 데이터 분할·전처리부터 Baseline, 평가와 오류 분석까지 연결한 기록입니다."
    },
    {
      eyebrow: "Model operations",
      title: "LLM 시스템",
      href: "wiki/llm-systems/llm_serving_stack_learning.html",
      description: "모델 메모리, LoRA, 정밀도와 양자화, 서빙 계층과 평가 계약을 정리한 기록입니다."
    },
    {
      eyebrow: "Tool orchestration",
      title: "AI 에이전트",
      href: "wiki/llm-systems/function_calling_tool_contract_learning.html",
      description: "Function Calling의 Schema와 도구 계약, 서버 검증과 Agent Loop의 경계를 확인한 기록입니다."
    },
    {
      eyebrow: "Data preparation",
      title: "Pandas·데이터 전처리",
      href: "wiki/pandas/pandas_dataframe_drop_learning.html",
      description: "모델 입력을 만들기 위한 DataFrame 선택·변환·정리 방법을 기록합니다."
    },
    {
      eyebrow: "Data storage",
      title: "Database",
      href: "wiki/database/database_index_learning.html",
      description: "Page와 Heap부터 B-Tree·Hash·GIN까지 저장 구조와 검색 범위를 연결한 기록입니다."
    },
    {
      eyebrow: "Math support",
      title: "수학",
      href: "wiki/math/transformer_math_learning.html",
      description: "통계·벡터·삼각함수처럼 현재 구현을 막는 수학을 작은 계산으로 확인한 기록입니다."
    },
    {
      eyebrow: "Algorithms",
      title: "코딩 테스트",
      href: "wiki/coding-test/index.html",
      description: "문제별 풀이 흐름과 Python 문법, DFS·BFS 등 다시 확인할 알고리즘을 기록합니다."
    }
  ]
};
