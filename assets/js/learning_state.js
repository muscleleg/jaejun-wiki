window.LEARNING_STATE = {
  updated: "2026-08-27",
  recentCompletion: "Causal Multi-Head Attention과 TransformerBlock을 직접 구현하고 [1,3,2] 출력, [1,2,3,3] Attention Weight와 미래 위치 Mask를 검증했습니다.",
  journey: {
    eyebrow: "Road to LLM inference",
    title: "최종 목표까지의 학습 여정",
    summary: "각 점은 읽은 주제가 아니라 직접 구현하고 설명하며 검증해야 닫히는 성취 관문입니다.",
    currentId: "tiny-decoder-lm",
    finalOutcome: "핵심 종착점은 PyTorch로 이해한 추론 흐름을 vLLM과 Multi-GPU 환경까지 확장하고, 성능 차이를 재현 가능한 수치와 병목 근거로 설명하는 것입니다.",
    milestones: [
      {
        id: "ml-baseline",
        title: "표 데이터 ML Baseline",
        shortTitle: "ML Baseline",
        status: "complete",
        statusLabel: "완료",
        href: "roadmaps/roadmap_machine_learning.html",
        goal: "파일을 Pandas로 읽고 데이터 품질·Label 분포를 확인한 뒤 Train·Validation을 분리합니다. 같은 전처리 기준에서 Dummy·Logistic Regression·Decision Tree를 비교하고 Accuracy만이 아니라 Precision·Recall·F1과 일반화 차이를 근거로 모델을 판단합니다.",
        evidence: "회원 이탈 7,043행 데이터에서 전처리·Baseline·Threshold·과적합 비교를 수행하고, 평가 결과와 한계를 설명했습니다."
      },
      {
        id: "pytorch-training",
        title: "PyTorch 학습 결과물",
        shortTitle: "PyTorch 학습",
        status: "complete",
        statusLabel: "완료",
        href: "roadmaps/roadmap_pytorch.html",
        goal: "NumPy·Pandas 데이터를 Tensor·Dataset·DataLoader로 연결하고, nn.Module·Loss·Optimizer로 학습 루프를 구성합니다. Train과 Validation을 구분해 평가하고 state_dict 저장·복원과 원본 데이터 한 건의 추론까지 재현합니다.",
        evidence: "회원 이탈 MLP를 학습·평가하고 Validation Metric, Weight 복원 결과, 원본 고객 한 명의 전처리와 추론까지 확인했습니다."
      },
      {
        id: "transformer-core",
        title: "Transformer 핵심 손코딩",
        shortTitle: "Transformer Block",
        status: "complete",
        statusLabel: "완료",
        href: "roadmaps/roadmap_transformer.html",
        goal: "Token·Position Embedding부터 Q·K·V, Score Scaling, Mask, Softmax, Value 가중합, Multi-Head 병합, Output Projection, FFN, Residual, LayerNorm을 직접 연결합니다. 각 연산의 실제 숫자와 Batch·Token·Feature Shape을 예측하고 검증합니다.",
        evidence: "Causal Multi-Head Attention과 TransformerBlock을 구현하고 입력·출력 [1,3,2], Attention Weight [1,2,3,3], 미래 위치 0을 검증했습니다."
      },
      {
        id: "tiny-decoder-lm",
        title: "Tiny Decoder LM",
        shortTitle: "Tiny Decoder LM",
        status: "current",
        statusLabel: "현재",
        href: "roadmaps/roadmap_transformer.html",
        goal: "Token Embedding + Position Embedding → Causal TransformerBlock → LM Head를 하나의 모델로 조립합니다. 한 칸 이동한 Target과 Token Cross Entropy를 연결하고, 아주 작은 데이터에 학습해 Loss가 감소하는지 확인한 뒤 이전 Token만 보며 다음 Token을 한 개씩 생성합니다.",
        evidence: "Token·Position Embedding → Causal TransformerBlock → LM Head를 수동 연결해 [1,3] → [1,3,10] Forward를 실행하고, 위치별 Logit이 다음 Token 후보 점수가 되는 학습 원리를 설명했습니다. 전체 클래스로 묶어 Loss를 연결하고 작은 데이터 학습·Autoregressive Generation을 실행하면 완료됩니다."
      },
      {
        id: "pretrained-causal-lm",
        title: "사전학습 Causal LM 적용",
        shortTitle: "HF Causal LM",
        status: "upcoming",
        statusLabel: "예정",
        href: "roadmaps/roadmap_transformer.html",
        goal: "Hugging Face Dataset·Tokenizer·동적 Padding으로 input_ids와 attention_mask를 만들고 사전학습 모델의 Logit [B,S,V]를 확인합니다. generate() 없이 마지막 위치 Logit에서 Token을 선택·추가하는 루프를 만들고 Greedy·Temperature·Top-k·Top-p의 차이를 비교합니다.",
        evidence: "고정 Prompt에서 수동 생성과 NLL·Perplexity 또는 과제별 품질·오류를 기록하고, Tokenizer·Config·Weight를 저장·복원해 같은 결과를 재현하면 완료됩니다."
      },
      {
        id: "pytorch-inference",
        title: "PyTorch 추론 Baseline",
        shortTitle: "KV Cache·Batch",
        status: "upcoming",
        statusLabel: "예정",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog",
        goal: "같은 모델·Prompt에서 No-cache와 KV Cache 생성, Batch 1과 Batch N을 비교합니다. RoPE·GQA·RMSNorm·SwiGLU를 작은 Module과 Shape으로 이해하고, 조건을 고정한 Naive PyTorch 추론 기준선을 만듭니다.",
        evidence: "Sequence Length·Batch 크기별 Latency·Peak VRAM·품질 결과와 Cache Shape을 기록하고, Model·dtype·Token 길이·동시 요청·측정 경계를 명시하면 완료됩니다."
      },
      {
        id: "vllm-benchmark",
        title: "vLLM 서빙·관측",
        shortTitle: "vLLM Benchmark",
        status: "upcoming",
        statusLabel: "예정",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog",
        goal: "RunPod GPU에서 같은 Benchmark 계약으로 vLLM을 서빙하고 Continuous Batching·Paged KV Cache·Prefix Caching·Chunked Prefill과 Scheduler 설정을 하나씩 바꿉니다. Prometheus·Grafana·DCGM 또는 Profiler로 요청 지표와 GPU 상태를 함께 관찰합니다.",
        evidence: "PyTorch 기준선과 TTFT·TPOT/ITL·E2E Latency·Throughput·Peak VRAM·P50/P95/P99를 비교하고, 어떤 설정이 어떤 Workload에서 유효한지 설명하면 완료됩니다."
      },
      {
        id: "distributed-inference",
        title: "Multi-GPU 분산 추론",
        shortTitle: "TP·NCCL",
        status: "upcoming",
        statusLabel: "핵심 종착점",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog",
        goal: "Tensor Parallel 1·2·4 GPU를 같은 조건에서 실행하고 GPU 수가 늘 때 연산과 통신이 어떻게 나뉘는지 확인합니다. nvidia-smi topo -m, nccl-tests, NVLink·PCIe와 AllReduce를 실제 Scaling 결과에 연결합니다.",
        evidence: "GPU 수별 Throughput·TTFT·TPOT·GPU당 VRAM과 Scaling Efficiency 표를 만들고, 선형 확장을 막는 통신 병목을 근거로 설명하면 핵심 여정이 완료됩니다. 이후 측정된 필요가 있을 때만 Prefill/Decode 분리·NIXL·RDMA로 확장합니다."
      }
    ]
  },
  coaching: {
    recentEvidence: "Token·Position Embedding → Causal TransformerBlock → LM Head를 직접 연결해 [1,3] → [1,3,2] → [1,3,10] Forward를 실행했습니다. [B,S,D] 축, 위치별 Prefix 문맥, Linear(D,V)의 행별 적용과 shifted Target이 Logit에 다음 Token 후보라는 의미를 부여하는 이유를 자기 말로 설명했습니다.",
    diagnosis: "Tiny Decoder LM의 부품별 실행을 넘어 수동 Forward 연결과 위치별 Logit의 학습 의미까지 이해했습니다. 다만 아직 하나의 TinyDecoderLM 클래스로 묶은 Loss 실행, 작은 데이터 학습과 생성 결과는 없습니다.",
    warning: "[1,3,10] Forward Shape과 의미 설명만으로 Tiny Decoder LM을 완료 처리하지 않습니다. Target Cross Entropy 실행, Loss 감소, 마지막 위치 Logit을 이용한 다음 Token 생성까지 확인해야 합니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 Baseline·PyTorch MLP 결과물을 닫았습니다. → 진행: Tiny Decoder LM의 수동 Forward [1,3] → [1,3,10]과 위치별 다음 Token 학습 원리를 확인했습니다. → 남음: 전체 클래스·Loss·작은 학습·생성을 검증합니다. → 이후: 사전학습 Causal LM의 [B,S,V] Forward·수동 생성·평가·Artifact 복원으로 이어갑니다.",
    scheduledRotation: "1차 순환 · 현재: 수동으로 연결한 Forward를 TinyDecoderLM 클래스로 묶고 shifted Target의 Cross Entropy Loss를 실행합니다. → 다음: 작은 데이터 Loss 감소·한 Token 생성을 확인한 뒤 Hugging Face 입력 파이프라인과 사전학습 Causal LM 수동 생성으로 이어갑니다."
  },
  rotation: {
    trigger: "회원 이탈 Baseline과 PyTorch MLP의 학습·평가·저장·복원·원본 한 명 추론을 마쳤습니다.",
    next: "수동 Forward를 TinyDecoderLM 클래스로 묶고 Cross Entropy Loss를 실행한 뒤 작은 학습·생성으로 이어갑니다.",
    after: "작은 공개 텍스트 데이터의 동적 Padding 첫 Batch를 사전학습 Causal LM에 넣고 [B,S,V] Forward·수동 생성·평가·저장·복원을 연결합니다.",
    returnTo: "Tiny Decoder LM → 사전학습 Causal LM 추론 브리지"
  },
  tracks: [
    {
      id: "transformer",
      title: "Transformer 손코딩·적용",
      href: "roadmaps/roadmap_transformer.html",
      done: 5,
      total: 7,
      current: "Token·Position Embedding → Causal TransformerBlock → LM Head를 수동 연결해 [1,3] → [1,3,2] → Logit [1,3,10]을 실행하고, 위치별 문맥과 다음 Token 학습 의미를 설명했습니다.",
      next: "같은 흐름을 TinyDecoderLM 클래스로 묶어 Target Cross Entropy Loss를 실행하고 작은 학습·한 Token 생성을 구현합니다.",
      reinforcement: "[B,S,D]를 Batch 문장 수·문장당 Token 위치 수·Token당 벡터 차원으로 구분하고, Block이 위치를 합치지 않으며 LM Head가 마지막 축 D만 V로 바꾼다는 점을 다시 설명했습니다."
    },
    {
      id: "pytorch",
      title: "PyTorch 실무",
      href: "roadmaps/roadmap_pytorch.html",
      done: 5,
      total: 6,
      current: "회원 이탈 MLP의 학습·평가·state_dict 복원과 원본 고객 1명의 (1,19) → [1,45] → sigmoid 출력 → Label 추론을 완료했습니다.",
      next: "별도 Tensor Shape 실험실 보강은 남기고, 현재 활성 구현은 Tiny Decoder LM으로 전환합니다."
    },
    {
      id: "machine-learning",
      title: "Machine Learning 실습",
      href: "roadmaps/roadmap_machine_learning.html",
      done: 6,
      total: 6,
      current: "회원 이탈 문제를 데이터 이해·Baseline·MLP 평가·한계 분석·저장·복원·원본 고객 한 명 추론까지 연결했습니다.",
      next: "현재 1차 ML 관문은 완료했으며, Tiny Decoder LM 뒤 사전학습 Causal LM의 고정 Text·NLL/Perplexity 또는 과제별 품질·오류 검사에서 같은 평가 원칙을 재사용합니다."
    },
    {
      id: "llm-systems",
      title: "LLM 시스템·최적화",
      href: "roadmaps/roadmap_llm_systems.html",
      done: 1,
      total: 5,
      current: "Forward·Hidden State·Logits와 MTP 검증 흐름을 정리했습니다.",
      next: "Acceptance length와 추론 비용을 작은 계산으로 검증합니다."
    }
  ]
};

window.LEARNING_STATE.overall = window.LEARNING_STATE.tracks.reduce(
  (overall, track) => ({
    done: overall.done + track.done,
    total: overall.total + track.total,
  }),
  { done: 0, total: 0 },
);
