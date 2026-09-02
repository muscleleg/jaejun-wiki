window.LEARNING_STATE = {
  updated: "2026-09-02",
  recentCompletion: "사전학습 tiny GPT-2에서 Tokenizer·동적 Padding·수동 Greedy·Temperature·Top-k·Top-p 생성을 연결하고, 고정 Text Loss·Perplexity 평가와 로컬 Artifact 새 프로세스 복원을 완료했습니다.",
  priorityPolicy: {
    label: "최우선 핵심 여정",
    title: "Road to LLM inference",
    rule: "현재 관문과 뒤따르는 관문 순서를 모든 다른 학습 로드맵보다 우선합니다. 핵심 여정 자체를 바꾸라는 사용자의 명시적 요청이 없으면 다른 로드맵이 현재 다음 행동을 대체할 수 없습니다.",
    supportRule: "핵심 관문을 실제로 막는 선수지식만 최소 범위로 보강하고, 막힘을 해결하면 즉시 핵심 여정으로 돌아옵니다.",
    optionalRule: "코딩 테스트·프로젝트·CS·MLOps·Agent와 관심 로드맵은 사용자가 해당 세션을 따로 선택하기 전까지 보관하며 핵심 여정의 진행률·현재 관문·다음 행동을 바꾸지 않습니다."
  },
  journey: {
    eyebrow: "Road to LLM inference",
    title: "최종 목표까지의 학습 여정",
    summary: "이 여정은 현재 학습의 최우선 방향입니다. 각 점은 읽은 주제가 아니라 직접 구현하고 설명하며 검증해야 닫히는 성취 관문입니다.",
    homePresentation: {
      title: "AI 엔지니어로 성장하는 학습 여정",
      summary: "모델을 사용하는 데서 멈추지 않고, PyTorch로 추론 원리를 직접 구현한 뒤 서빙·성능 측정·Multi-GPU 병목 분석까지 확장하고 있습니다. 아래 흐름은 그 성장을 위해 현재 쌓고 있는 역량과 도달한 위치를 보여줍니다.",
      interactionHint: "각 점을 누르면 성취 목표와 확인된 근거가 펼쳐집니다. 완료·진행 중 관문에서는 실습·코드 정리도 볼 수 있습니다.",
      finalLabel: "이 여정으로 쌓는 역량",
      finalOutcome: "모델 내부 동작을 코드로 설명하고, 실제 GPU 환경에서 추론 성능을 측정·최적화하며, 병목의 원인을 데이터와 시스템 관점에서 설명할 수 있는 AI 엔지니어로 성장하는 것이 목표입니다."
    },
    currentId: "pytorch-inference",
    finalOutcome: "핵심 종착점은 PyTorch로 이해한 추론 흐름을 vLLM과 Multi-GPU 환경까지 확장하고, 성능 차이를 재현 가능한 수치와 병목 근거로 설명하는 것입니다.",
    milestones: [
      {
        id: "ml-baseline",
        title: "표 데이터 ML Baseline",
        shortTitle: "ML Baseline",
        status: "complete",
        statusLabel: "완료",
        href: "roadmaps/roadmap_machine_learning.html",
        practiceHref: "wiki/projects/road-to-llm-inference/ml-baseline.html",
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
        practiceHref: "wiki/projects/road-to-llm-inference/pytorch-training.html",
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
        practiceHref: "wiki/projects/road-to-llm-inference/transformer-core.html",
        goal: "Token·Position Embedding부터 Q·K·V, Score Scaling, Mask, Softmax, Value 가중합, Multi-Head 병합, Output Projection, FFN, Residual, LayerNorm을 직접 연결합니다. 각 연산의 실제 숫자와 Batch·Token·Feature Shape을 예측하고 검증합니다.",
        evidence: "Causal Multi-Head Attention과 TransformerBlock을 구현하고 입력·출력 [1,3,2], Attention Weight [1,2,3,3], 미래 위치 0을 검증했습니다."
      },
      {
        id: "tiny-decoder-lm",
        title: "Tiny Decoder LM",
        shortTitle: "Tiny Decoder LM",
        status: "complete",
        statusLabel: "완료",
        href: "roadmaps/roadmap_transformer.html",
        practiceHref: "wiki/projects/road-to-llm-inference/tiny-decoder-lm.html",
        goal: "Token Embedding + Position Embedding → Causal TransformerBlock → LM Head를 하나의 모델로 조립합니다. 한 칸 이동한 Target과 Token Cross Entropy를 연결하고, 아주 작은 데이터에 학습해 Loss가 감소하는지 확인한 뒤 이전 Token만 보며 다음 Token을 한 개씩 생성합니다.",
        evidence: "[3]→7·[3,7]→2·[3,7,2]→9를 한 Forward에서 병렬 학습한다고 설명하고, 저장 실행에서 d_model=2의 Loss 0.462389 정체를 관찰한 뒤 새 d_model=4 모델에서 0.00000258까지 낮추고 [3,7,2,9] 반복 생성을 실행했습니다."
      },
      {
        id: "pretrained-causal-lm",
        title: "사전학습 Causal LM 적용",
        shortTitle: "HF Causal LM",
        status: "complete",
        statusLabel: "완료",
        href: "roadmaps/roadmap_transformer.html",
        practiceHref: "wiki/projects/road-to-llm-inference/pretrained-causal-lm.html",
        goal: "Hugging Face Dataset·Tokenizer·동적 Padding으로 input_ids와 attention_mask를 만들고 사전학습 모델의 Logit [B,S,V]를 확인합니다. generate() 없이 마지막 위치 Logit에서 Token을 선택·추가하는 루프를 만들고 Greedy·Temperature·Top-k·Top-p의 차이를 비교합니다.",
        evidence: "길이 3·7 문장의 동적 Padding과 GPT-2 Logit [2,7,50257], Batch별 마지막 실제 위치를 확인하고 generate() 없이 Greedy·Temperature·Top-k·Top-p 생성을 실행했습니다. \"I study.\"의 평균 Token Loss 10.831886·Perplexity 50609.078을 평가했으며, Tokenizer·Model을 로컬에 저장한 뒤 별도 프로세스에서 local_files_only로 복원해 Token ID [[40,2050,13]]·Logit [1,3,50257]·Loss가 일치함을 검증했습니다."
      },
      {
        id: "pytorch-inference",
        title: "PyTorch 추론 Baseline",
        shortTitle: "KV Cache·Batch",
        status: "current",
        statusLabel: "현재",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog",
        practiceHref: "wiki/projects/road-to-llm-inference/pytorch-inference.html",
        goal: "같은 모델·Prompt에서 No-cache와 KV Cache 생성, Batch 1과 Batch N을 비교합니다. GPU 실험에서는 모델·Tensor의 장치와 CPU↔GPU 메모리 이동, PyTorch의 CUDA 장치 디스패치, CUDA 비동기 실행과 동기화된 측정 경계를 확인합니다. RoPE·GQA·RMSNorm·SwiGLU를 작은 Module과 Shape으로 이해하고, 조건을 고정한 Naive PyTorch 추론 기준선을 만듭니다.",
        evidence: "Sequence Length·Batch 크기별 Latency·Peak VRAM·품질 결과와 Cache Shape을 기록합니다. Model·dtype·Token 길이·동시 요청·측정 경계를 명시하고, CPU·GPU 출력 일치, 모델·입력·Logit의 Device, H2D·D2H 이동, synchronize 전후 Timing 차이와 Profiler의 메모리 복사·CUDA Kernel 구분까지 확인하면 완료됩니다."
      },
      {
        id: "vllm-benchmark",
        title: "vLLM 서빙·관측",
        shortTitle: "vLLM Benchmark",
        status: "upcoming",
        statusLabel: "예정",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog",
        goal: "RunPod GPU에서 Model·Revision·dtype·입출력 길이·Concurrency·Warmup·반복 횟수·Seed와 Timing 경계를 고정한 Benchmark 계약으로 vLLM을 서빙합니다. Continuous Batching·Paged KV Cache·Prefix Caching·Chunked Prefill과 Scheduler 설정을 하나씩 바꾸고, Prometheus·Grafana·DCGM 또는 Profiler로 요청 지표와 GPU 상태를 함께 관찰합니다.",
        evidence: "같은 Sampling 설정과 Seed에서 Token ID 재현을 확인한 뒤 PyTorch 기준선과 TTFT·TPOT/ITL·E2E Latency·Throughput·Peak VRAM·P50/P95/P99를 비교하고, 어떤 설정이 어떤 Workload에서 유효한지 설명하면 완료됩니다."
      },
      {
        id: "distributed-inference",
        title: "Multi-GPU 분산 추론",
        shortTitle: "TP·NCCL",
        status: "upcoming",
        statusLabel: "핵심 종착점",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog",
        goal: "작은 Tensor로 AllReduce·AllGather·ReduceScatter의 입출력 Shape·값·통신 Byte를 먼저 검산합니다. 이어 Tensor Parallel 1·2·4 GPU를 같은 조건에서 실행하고 GPU 수가 늘 때 연산과 통신이 어떻게 나뉘는지 확인하며, nvidia-smi topo -m·nccl-tests·NVLink·PCIe를 실제 Scaling 결과에 연결합니다.",
        evidence: "세 Collective 결과와 통신량을 직접 계산한 뒤 GPU 수별 Throughput·TTFT·TPOT·GPU당 VRAM과 Scaling Efficiency 표를 만들고, 선형 확장을 막는 통신 병목을 근거로 설명하면 핵심 여정이 완료됩니다. 이후 측정된 필요가 있을 때만 Prefill/Decode 분리·NIXL·RDMA로 확장합니다."
      }
    ]
  },
  deferredLearningItems: {
    title: "나중에 다시 할 학습",
    summary: "학습 중 사용자가 나중에 하기로 확정한 항목입니다. 현재 관문의 순서를 바꾸지 않고, 다시 꺼낼 조건과 완료 증거를 함께 보존합니다.",
    policy: {
      reviewWhen: "평소에는 목록을 진행하지 않고, 현재 관문을 닫을 때 전체 목록을 한 번 검토합니다.",
      branchRule: "대기 중인 항목은 백로그에만 둡니다. 실제로 꺼내 학습 중이거나 검증을 마친 항목만 연결된 로드맵 관문 옆에 심화 가지로 표시하며, 이 가지는 본선 진행률·현재 관문·다음 행동을 바꾸지 않습니다.",
      activeLimit: 1,
      repeatThreshold: 2,
      types: [
        {
          id: "required",
          label: "필수 완료",
          activation: "연결된 관문의 완료 단계에 도달하면 꺼냅니다."
        },
        {
          id: "reinforcement",
          label: "반복 약점",
          activation: "같은 지점에서 두 번째로 막히거나 현재 구현의 최소 blocker가 되면 짧게 꺼냅니다."
        },
        {
          id: "interest",
          label: "장기 관심",
          activation: "사용자가 다시 선택하거나 핵심 여정 완료 뒤 실제 필요가 생길 때만 꺼냅니다."
        }
      ]
    },
    items: [
      {
        id: "hf-local-artifact-offline-restore",
        title: "Tokenizer·Model 로컬 저장과 오프라인 복원",
        type: "required",
        status: "complete",
        statusLabel: "완료",
        milestoneId: "pretrained-causal-lm",
        reason: "모델 이름으로 Tokenizer를 자동 다운로드하는 흐름을 먼저 확인한 뒤, 같은 Artifact를 로컬 파일만으로 불러오는 흐름도 익히기로 했습니다.",
        resumeWhen: "사전학습 Causal LM의 Tokenizer·Forward·수동 생성을 한 번 연결한 뒤 Artifact 저장·복원 완료 조건에서 다시 진행합니다.",
        completion: "Tokenizer·Config·Weight를 로컬 폴더에 저장하고 새 프로세스에서 로컬 경로와 local_files_only 설정으로 복원해 같은 입력의 Token ID·Logit 또는 생성 결과가 일치하는지 확인합니다.",
        href: "roadmaps/roadmap_transformer.html"
      },
      {
        id: "tiny-tokenizer-vocabulary-bridge",
        title: "작은 문자열 단어장과 Tiny Decoder 연결",
        type: "reinforcement",
        status: "queued",
        statusLabel: "개념 경계 보강",
        milestoneId: "pretrained-causal-lm",
        reason: "Tiny Decoder LM에서는 Vocabulary 크기 10과 Token ID 0~9를 직접 사용해 다음 숫자를 예측했지만, 문자열을 Token ID로 바꾸고 다시 문자열로 복원하는 Tokenizer 단어장은 만들지 않았습니다. 사전학습 모델을 불러오며 두 Vocabulary 경계를 직접 연결해볼 필요를 확인했습니다.",
        resumeWhen: "사전학습 Causal LM의 Forward와 수동 생성을 먼저 완료한 뒤, 현재 관문을 닫기 전 짧은 독립 실습으로 꺼냅니다. 그전에는 현재 흐름을 중단하지 않습니다.",
        completion: "작은 문자열↔Token ID 표와 PAD·UNK ID를 직접 정의하고, 문장을 encode해 Tiny Decoder LM의 Embedding과 LM Head에 연결한 뒤 생성된 Token ID를 문자열로 decode합니다. Tokenizer Vocabulary 크기와 Embedding·LM Head의 Vocabulary 축이 일치해야 하는 이유를 Shape으로 설명하면 완료합니다.",
        href: "wiki/transformer/transformer_token_embedding_learning.html#tokenizer-dynamic-padding"
      },
      {
        id: "tensor-axis-reverse-reconstruction",
        title: "Multi-Head Attention 전체 복습과 axis 재구성",
        type: "reinforcement",
        status: "queued",
        statusLabel: "장기 기억 보강",
        milestoneId: "transformer-core",
        reason: "Q·K·V, Score Scaling, Mask, Softmax, Value 가중합과 Head 병합을 구현하고 복습했지만 시간이 지나면 흐름과 Shape이 다시 섞일 수 있다고 판단했습니다. 기존의 view·transpose·reshape 반대 방향 보강도 같은 복습 안에서 함께 확인합니다.",
        resumeWhen: "현재 사전학습 Causal LM 관문은 그대로 진행하고, KV Cache·GQA·RoPE처럼 Attention 내부를 다시 바꾸는 단계에 들어가기 직전에 선수지식 복습으로 한 번 꺼냅니다.",
        completion: "자료 없이 [B,S,D]에서 Q·K·V Projection, [B,H,S,head_dim] 분리, Score·√head_dim Scaling, Padding·Causal Mask, Softmax·Value 가중합, Token 기준 재정렬, Head 병합과 W_O까지 Shape을 먼저 예측해 재구현합니다. 작은 Tensor에서 미래 Attention 0과 최종 [B,S,D] 복원을 검증하고 view·transpose·reshape의 반대 방향도 설명하면 완료합니다.",
        href: "wiki/transformer/transformer_multi_head_attention_learning.html"
      },
      {
        id: "pytorch-advanced-indexing-paired-selection",
        title: "PyTorch 고급 인덱싱과 Batch별 위치 선택",
        type: "reinforcement",
        status: "queued",
        statusLabel: "반복 약점 보강",
        milestoneId: "pytorch-inference",
        reason: "슬라이싱과 달리 logits[batch_indices, token_positions, :]처럼 여러 인덱스 Tensor를 짝지어 Batch마다 다른 Token 위치를 선택하는 문법이 반복해서 낯설었습니다. 현재는 (0,2)·(1,6)의 짝 선택과 결과 Shape [B,V]를 이해했지만 작은 Tensor에서 독립적으로 재구성하는 연습은 남아 있습니다.",
        resumeWhen: "현재 사전학습 Causal LM의 수동 생성 관문은 중단하지 않습니다. Batch inference 관문에 들어가기 직전, Batch마다 길이·선택 위치가 달라지는 코드를 작성하기 전에 짧은 Tensor 실습으로 꺼냅니다.",
        completion: "기본 정수 인덱싱·Slice·불린 마스크·고급 인덱싱을 결과 Shape과 View/Copy 관점에서 구분하고, [B,S,V] Tensor에서 Batch별 서로 다른 Token 위치를 선택해 [B,V]를 만드는 코드를 자료 없이 작성하고 실제 값으로 검산하면 완료합니다.",
        href: "wiki/transformer/transformer_token_embedding_learning.html#tensor-dim-semantic-axis"
      },
      {
        id: "autograd-inference-internal-tracking",
        title: "Autograd 내부 추적 심화",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "pytorch-inference",
        reason: "현재 No-cache·KV Cache 추론 비교에는 model.eval()과 torch.inference_mode()를 함께 선택하고, 계산 그래프와 backward가 비활성화된다는 점만 알면 충분합니다. Version Counter·View Tracking·in-place 변경 감지까지 파고드는 일은 현재 관문을 막지 않아 나중으로 미뤘습니다.",
        resumeWhen: "in-place 연산 때문에 backward 오류가 발생하거나, 추론의 성능·메모리 오버헤드를 실제로 분석할 때 다시 꺼냅니다.",
        completion: "작은 Tensor 코드에서 torch.no_grad()와 torch.inference_mode()의 Version Counter·View Tracking·in-place 변경 감지 차이를 먼저 예측한 뒤 실행 결과와 비교합니다. 이어 inference Tensor를 학습 계산에 재사용할 때의 제약을 실제 오류 또는 허용되는 성공 조건으로 구분해 설명하면 완료합니다.",
        href: "wiki/pytorch/pytorch_linear_regression_module_optimizer_dataset_learning.html#module-optimizer"
      },
      {
        id: "cuda-kernel-execution-optimization-internals",
        title: "CUDA 병렬 실행 내부와 Kernel 최적화",
        type: "interest",
        status: "queued",
        statusLabel: "조건부 GPU 심화 백로그",
        milestoneId: "vllm-benchmark",
        reason: "장치 이동·CUDA 디스패치·비동기 실행·동기화된 Benchmark는 PyTorch 추론 Baseline의 필수 범위로 편입했습니다. 반면 Grid·Block·Thread·Warp, 메모리 계층과 직접 Kernel 최적화까지 지금 선행하면 현재 Batch·KV Cache·Benchmark 관문을 지연시키므로 실제 병목이 확인될 때만 심화합니다.",
        resumeWhen: "RunPod의 PyTorch Profiler·Nsight 또는 vLLM Benchmark에서 특정 CUDA Kernel, H2D·D2H 복사, Memory bandwidth, 낮은 GPU utilization이 실제 병목으로 관찰되고 라이브러리 설정만으로 원인을 설명할 수 없을 때 꺼냅니다.",
        completion: "Grid·Block·Thread·Warp의 실행 계층과 Global·Shared·Register Memory의 역할을 작은 Vector 또는 Matrix Kernel의 Index 계산으로 설명합니다. 이어 Coalescing·Occupancy·Memory bandwidth와 Compute-bound 차이를 Profiler 근거에 연결하고, 실제 필요가 있을 때만 Triton 또는 CUDA Kernel 하나를 작성해 PyTorch 기준 연산과 출력·Latency를 비교합니다.",
        href: "wiki/pytorch/pytorch_device_cuda_parallel_learning.html"
      },
      {
        id: "kimi-k3-toy-architecture-handcoding",
        title: "Kimi K3 구조 교육용 축소 구현 손코딩",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "pytorch-inference",
        reason: "핵심 Road to LLM inference를 먼저 빠르게 완주하기 위해, Kimi 구조 손코딩은 현재 관문을 바꾸지 않는 장기 관심 백로그로 미뤘습니다.",
        resumeWhen: "사용자가 이 항목을 다시 선택하거나 핵심 여정을 완료한 뒤 실제 구현 필요가 생길 때만 꺼냅니다.",
        completion: "먼저 작은 Tensor로 KDA의 순환 상태 갱신을 구현하고 Shape을 예측한 뒤, Token 수에 따라 커지는 KV Cache [B,H,T,Dh]와 Sequence 길이에 독립적인 KDA 순환 상태 [B,H,Dh,Dh]를 비교합니다. 이어 채널별 감쇠와 Delta Update, 실제 Low-rank 압축을 포함한 Gated MLA, KDA 3개와 MLA 1개의 Hybrid 및 AttnRes를 단계적으로 연결하고, 교육용 축소 구현의 생략·단순화와 충실한 Kimi K3 구조의 차이를 설명하면 완료합니다.",
        href: "https://github.com/MoonshotAI/Kimi-K3"
      },
      {
        id: "moe-router-expert-handcoding",
        title: "MoE Router·Expert 손코딩과 Expert Parallel 연결",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "distributed-inference",
        reason: "Road to LLM inference를 먼저 빠르게 완주하기 위해, 일반 MoE 구조와 Routing 손코딩은 현재 관문을 바꾸지 않는 이후 학습 백로그로 미뤘습니다.",
        resumeWhen: "사용자가 이 항목을 다시 명시적으로 선택하거나, 핵심 여정을 완료한 뒤 실제 MoE 서빙·분산 필요가 생길 때만 꺼냅니다.",
        completion: "1단계에서 Dense FFN과 MoE의 계산 경계를 설명합니다. 2단계에서 작은 Router가 Expert 확률 [B,T,E]와 Top-k Expert Index·Weight [B,T,K]를 만들게 하고, 선택된 작은 Expert로 Token을 보내 출력을 가중 합산합니다. 3단계에서 Expert별 Token 수와 선택되지 않은 Expert가 출력에 기여하지 않음을 검증하고, 전체 Parameter와 Token당 활성 Parameter·FLOPs를 비교합니다. 4단계에서 Load Imbalance·Capacity·Shared Expert의 역할을 설명하고, 단일 장치 Routing을 Expert Parallel의 장치 간 Token 통신과 연결하되 Production 규모 구현을 완료했다고 간주하지 않습니다.",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog"
      },
      {
        id: "mle-entropy-kl-connection",
        title: "MLE·NLL·Entropy·KL 연결",
        type: "reinforcement",
        status: "queued",
        statusLabel: "개념 보강",
        milestoneId: "pretrained-causal-lm",
        reason: "Softmax와 Target Token의 평균 NLL까지는 실제 숫자로 확인했으며, 분포 전체를 비교하는 개념은 같은 예제로 나중에 연결하기로 했습니다.",
        resumeWhen: "사전학습 모델의 NLL·Perplexity 평가를 실행할 때 같은 분포 예제로 함께 검산합니다.",
        completion: "Log-Likelihood 최대화와 평균 NLL 최소화의 관계를 설명하고, 같은 두 분포에서 Entropy·Cross Entropy·KL Divergence를 계산해 차이를 구분합니다.",
        href: "roadmaps/roadmap_transformer.html"
      },
      {
        id: "cross-model-kv-cache-transfer-recovery",
        title: "Cross-Model KV Cache Transfer 학습 기록 복원",
        type: "interest",
        status: "unknown",
        statusLabel: "미확인",
        milestoneId: "pytorch-inference",
        reason: "학습 흔적은 남아 있지만 당시 대화 원문이 없어 이해한 범위를 완료 지식으로 확정할 수 없습니다.",
        resumeWhen: "KV Cache 관문에 도달하고 당시 원문이나 실습 근거를 찾았을 때 복원합니다.",
        completion: "동일 모델 Cache 재사용과 Cross-Model Cache 변환을 구분하고, 호환 조건·변환 비용·품질 한계를 근거와 함께 다시 기록합니다.",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog"
      },
      {
        id: "small-lm-training-foundations",
        title: "작은 언어 모델 학습 기반 재구성",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "tiny-decoder-lm",
        reason: "현재 Tiny Decoder LM은 아주 작은 고정 Token 패턴을 과적합해 추론 원리를 확인했습니다. 실제 문자열 말뭉치에서 Tokenizer를 만들고 초기화·Optimizer·Checkpoint까지 연결하는 학습 시스템은 별도의 깊이이므로 핵심 추론 여정 뒤에 보존합니다.",
        resumeWhen: "핵심 추론 여정을 완주한 뒤 모델을 처음부터 학습하는 방향을 선택하거나, 사전학습 Artifact의 생성 과정을 직접 재현할 필요가 생길 때 꺼냅니다.",
        completion: "작은 공개 말뭉치에서 Tokenizer를 학습하고 Vocabulary·Special Token을 고정합니다. 작은 Decoder LM의 초기화·AdamW·학습률·Gradient 누적·Checkpoint 저장과 중단 후 재개를 연결하고, Train·Validation Loss와 Perplexity·재현 조건을 기록하면 완료합니다.",
        href: "roadmaps/roadmap_transformer.html"
      },
      {
        id: "distributed-training-memory-sharding",
        title: "분산 학습과 메모리 Sharding",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "distributed-inference",
        reason: "DDP·FSDP·ZeRO·Activation Checkpointing·Offload는 Multi-GPU 통신을 사용하지만 현재 목표인 분산 추론 Tensor Parallel과 최적화 대상이 다릅니다. 가치 있는 별도 학습 방향으로 잃지 않되 현재 종착점을 지연시키지 않습니다.",
        resumeWhen: "분산 추론 관문을 닫은 뒤 모델 학습 메모리가 실제 제약이 되거나 사용자가 분산 학습 방향을 선택할 때 꺼냅니다.",
        completion: "같은 작은 모델과 Global Batch에서 단일 GPU·DDP·Sharded 학습의 Parameter·Gradient·Optimizer State·Activation 메모리와 Collective 통신량을 비교합니다. FSDP 또는 ZeRO 한 경로와 Activation Checkpointing·CPU Offload 중 필요한 조건 하나를 실행해 Step Time·Peak VRAM·수치 일치를 기록하면 완료합니다.",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog"
      },
      {
        id: "scaling-law-data-quality-pipeline",
        title: "Scaling Law와 학습 데이터 품질 파이프라인",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "tiny-decoder-lm",
        reason: "모델·Token·Compute 규모의 관계와 Data Filtering·Deduplication·Mixing·Lineage는 모델 학습 결과를 좌우하지만, 현재의 추론 Baseline을 완성하는 선수 조건은 아닙니다.",
        resumeWhen: "작은 언어 모델을 실제 말뭉치로 학습하는 방향을 선택하고, 데이터 양이나 혼합 비율을 근거 없이 정하게 되는 시점에 꺼냅니다.",
        completion: "작은 여러 규모의 Model·Token·Compute 실험을 고정 조건에서 반복해 Loss 추세를 적합하고 예측과 실제를 비교합니다. 이어 중복 제거·품질 필터·Dataset Mixing 조건 하나씩을 바꿔 Validation Loss와 오류 사례를 비교하고, 데이터 출처·License·변환 이력을 재현 가능하게 남기면 완료합니다.",
        href: "roadmaps/roadmap_transformer.html"
      },
      {
        id: "post-training-alignment-evaluation",
        title: "Post-training과 선호 정렬 평가",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "pretrained-causal-lm",
        reason: "SFT·Preference Optimization·RLHF·GRPO는 사전학습 모델을 목적에 맞게 조정하는 중요한 단계지만, 현재는 동일 모델의 추론 원리와 시스템 성능을 고정하는 중입니다.",
        resumeWhen: "추론 핵심 여정 뒤 특정 Task에 모델을 조정해야 하고, Base·SFT·선호 학습의 품질 차이를 측정할 데이터와 평가 기준을 정했을 때 꺼냅니다.",
        completion: "작은 공개 데이터와 고정 평가 세트에서 Base와 SFT를 먼저 비교합니다. 이후 DPO 같은 선호 최적화 한 경로 또는 작은 Reward 기반 학습 한 경로를 선택해 Objective·Reference Model·Reward·KL 역할을 설명하고, Task 품질·일반 품질·안전 실패·과적합을 함께 평가하면 완료합니다.",
        href: "roadmaps/roadmap_transformer.html"
      },
      {
        id: "serving-runtime-prefix-cache-scheduler-comparison",
        title: "Prefix Cache와 Cache-aware Scheduler Runtime 비교",
        type: "interest",
        status: "queued",
        statusLabel: "조건부 Serving 심화 백로그",
        milestoneId: "vllm-benchmark",
        reason: "vLLM의 Prefix Caching을 먼저 같은 Benchmark 계약으로 검증한 뒤에는 Radix Tree 기반 Prefix 재사용과 Cache-aware Scheduling을 다른 Runtime에서 비교할 가치가 있습니다. 하지만 제공 Runtime 사용은 vLLM 필수 관문의 선행 조건이 아닙니다.",
        resumeWhen: "vLLM Baseline을 완료했고 반복 Prefix가 많은 실제 Workload에서 Prefix Cache 정책 차이를 비교할 필요가 생길 때 꺼냅니다.",
        completion: "같은 Model·Revision·dtype·Prompt 집합·Sampling·Seed·Concurrency에서 vLLM Prefix Caching과 Radix Tree 기반 Runtime의 TTFT·Throughput·Peak VRAM·Cache Hit 또는 Reuse를 비교합니다. Scheduler나 Cache를 직접 구현한 증거와 제공 Runtime을 설정·측정한 증거를 구분하면 완료합니다.",
        href: "roadmaps/roadmap_llm_systems.html#inference-depth-backlog"
      },
      {
        id: "framework-autodiff-graph-compiler",
        title: "ML Framework의 Autodiff·Graph·Compiler 내부",
        type: "interest",
        status: "queued",
        statusLabel: "장기 관심 백로그",
        milestoneId: "pytorch-training",
        reason: "PyTorch Autograd를 사용해 학습을 완주했지만 Reverse-mode Autodiff, 계산 Graph 실행, Operator Fusion과 Compiler 최적화가 Framework 내부에서 어떻게 연결되는지는 별도 시스템 깊이입니다.",
        resumeWhen: "직접 연산 Engine을 이해해야 하거나 Graph Break·Compile·Fusion이 실제 성능 또는 디버깅 문제로 나타날 때 꺼냅니다.",
        completion: "작은 Scalar·Tensor 연산 Graph에서 Topological 순서와 Reverse-mode Gradient를 직접 계산하는 최소 Engine을 만들고 PyTorch 결과와 비교합니다. 이어 같은 함수를 Eager와 Compile 경로에서 실행해 Graph Break·Operator 수·Fusion·Latency를 관찰하고, Framework·Compiler·Kernel의 역할 경계를 설명하면 완료합니다.",
        href: "roadmaps/roadmap_pytorch.html"
      }
    ]
  },
  coaching: {
    recentEvidence: "같은 tiny GPT-2·CPU·Prompt \"I study\"·Greedy·새 Token 20개 조건에서 Warm-up 3회 뒤 20회 측정했습니다. Batch 1과 4 모두 No-cache·KV Cache 출력이 일치했고, Batch 1은 866.48→1291.32 tokens/sec, Batch 4는 2996.09→3197.07 tokens/sec로 측정했습니다.",
    diagnosis: "No-cache·KV Cache와 Batch 1·4의 출력 일치, Cache 누적 Shape, 로컬 CPU Latency·Throughput 기준선을 확보했습니다. 이제 GPU에서 Peak VRAM과 CUDA 비동기 실행을 포함한 동기화 측정 경계를 확인할 단계입니다.",
    warning: "추론 최적화 비교에서는 모델·dtype·Prompt Token 수·생성 Token 수·장치·워밍업 조건을 고정합니다. Cache 사용 여부 외의 조건이 함께 바뀌면 속도 차이의 원인을 설명할 수 없습니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 Baseline·PyTorch MLP·Transformer Block·Tiny Decoder LM·사전학습 Causal LM 적용을 닫았습니다. → 현재: PyTorch 추론 Baseline에서 No-cache와 KV Cache를 같은 조건으로 비교합니다.",
    scheduledRotation: "현재: PyTorch 추론 Baseline → 다음: Benchmark 계약을 고정한 뒤 vLLM 서빙·관측으로 이동합니다."
  },
  rotation: {
    trigger: "사전학습 Causal LM의 Tokenizer·Forward·수동 생성·평가·Artifact 복원을 완료했습니다.",
    next: "같은 tiny GPT-2와 Prompt에서 No-cache·KV Cache의 출력 일치·Cache 누적을 확인하고, Batch 1·4의 로컬 CPU Latency·Throughput 2×2 기준선을 확보했습니다.",
    after: "GPU에서 Peak VRAM·장치 이동과 CUDA 동기화 전후 Timing 차이를 같은 Benchmark 계약으로 기록합니다.",
    returnTo: "PyTorch 추론 Baseline"
  },
  tracks: [
    {
      id: "transformer",
      title: "Transformer 손코딩·적용",
      href: "roadmaps/roadmap_transformer.html",
      done: 7,
      total: 7,
      current: "사전학습 tiny GPT-2의 Tokenizer·동적 Padding·[B,S,V] Forward·Greedy·Temperature·Top-k·Top-p 수동 생성·고정 Text 평가·Artifact 복원을 완료했습니다.",
      next: "완료한 Transformer 1차 순환을 바탕으로 PyTorch 추론 Baseline의 No-cache·KV Cache 비교로 이동합니다.",
      reinforcement: "Tokenizer·Embedding·LM Head가 공통 Token ID 체계를 공유하는 이유와 Python 런타임 소스 추적법을 확인했습니다. 고급 인덱싱은 Batch inference 직전 짧은 실습으로 남깁니다."
    },
    {
      id: "pytorch",
      title: "PyTorch 실무",
      href: "roadmaps/roadmap_pytorch.html",
      done: 5,
      total: 6,
      current: "회원 이탈 MLP의 학습·평가·state_dict 복원과 원본 고객 1명의 (1,19) → [1,45] → sigmoid 출력 → Label 추론을 완료했습니다.",
      next: "별도 Tensor Shape 실험실 보강은 남기고, 현재 활성 구현인 사전학습 Causal LM의 Tokenizer·동적 Padding·수동 생성에서 같은 PyTorch Shape·평가 원칙을 재사용합니다."
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
      current: "같은 모델·Prompt·Greedy·생성 길이에서 출력 일치와 Cache 누적을 확인하고, CPU에서 No-cache·KV Cache × Batch 1·4의 Latency·Throughput을 같은 조건으로 비교했습니다.",
      next: "GPU에서 Peak VRAM과 모델·입력·Logit Device, H2D·D2H 이동, CUDA 동기화 전후 Timing 차이를 기록합니다."
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
