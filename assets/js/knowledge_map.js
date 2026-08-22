(() => {
  const node = (label, concept, options = {}) => ({ label, concept, ...options });
  const views = [
    {
      id: "topics",
      label: "주제별",
      description: "기술 분야별로 출발하되, 다른 분야와 공유하는 개념도 각 가지에 다시 배치합니다.",
      tree: node("AI 학습 지식", "ai-learning", { status: "learning", children: [
        node("Machine Learning", "machine-learning", { status: "learning", href: "roadmaps/roadmap_machine_learning.html", children: [
          node("문제 정의", "problem-framing", { status: "verified", children: [node("Feature·Label", "feature-label", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" }), node("Baseline", "baseline", { status: "learning", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" })] }),
          node("데이터 전처리", "preprocessing", { status: "learning", children: [node("One-Hot Encoding", "one-hot", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" }), node("StandardScaler", "standard-scaler", { status: "learning", href: "wiki/machine-learning/standard_scaler_mean_std_proof_learning.html" })] }),
          node("분류 평가", "classification-evaluation", { status: "learning", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html", children: [node("Confusion Matrix", "confusion-matrix", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("Precision·Recall·F1", "precision-recall-f1", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("Threshold", "threshold", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("BCE Loss", "bce-loss", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#bce" })] }),
        ] }),
        node("PyTorch", "pytorch", { status: "learning", href: "roadmaps/roadmap_pytorch.html", children: [
          node("Tensor", "tensor", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html", children: [node("Shape·dtype·device", "tensor-contract", { status: "learning", href: "wiki/pytorch/pytorch_linear_regression_learning.html" }), node("행렬곱", "matrix-multiplication", { status: "verified", href: "wiki/transformer/transformer_projection_learning.html" })] }),
          node("학습 원리", "training-loop", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer", children: [node("Loss", "loss", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer" }), node("Gradient·Autograd", "autograd", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#gradient" }), node("nn.Module", "nn-module", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer" }), node("Optimizer", "optimizer", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer" }), node("no_grad 추론", "no-grad-inference", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer" })] }),
          node("회원 이탈 MLP", "churn-mlp", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html", children: [node("Pandas → NumPy → Tensor", "pandas-numpy-tensor", { status: "verified", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#tensor" }), node("Dataset·DataLoader", "data-loader", { status: "verified", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#tensor" }), node("Batch·Feature Shape", "tensor-contract", { status: "verified", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#mlp" }), node("Linear 파라미터·마지막 축", "linear-shape", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#linear-open-question" }), node("Logit·Sigmoid", "sigmoid", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#sigmoid" }), node("BCE Loss", "bce-loss", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#bce" })] }),
        ] }),
        node("Transformer", "transformer", { status: "verified", href: "wiki/transformer/transformer_learning.html", children: [
          node("입력 표현", "input-representation", { status: "verified", children: [node("Token Embedding", "token-embedding", { status: "verified", href: "wiki/transformer/transformer_token_embedding_learning.html" }), node("Positional Encoding", "positional-encoding", { status: "verified", href: "wiki/transformer/transformer_positional_encoding_learning.html" })] }),
          node("Attention", "attention", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html", children: [node("Q·K·V Projection", "qkv-projection", { status: "verified", href: "wiki/transformer/transformer_projection_learning.html" }), node("Score·Scaling·Mask", "attention-score", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html" }), node("Multi-Head", "multi-head-attention", { status: "verified", href: "wiki/transformer/transformer_multi_head_attention_learning.html" })] }),
          node("Transformer Block", "transformer-block", { status: "verified", children: [node("Residual", "residual", { status: "verified", href: "wiki/transformer/transformer_residual_learning.html" }), node("LayerNorm", "layer-norm", { status: "verified", href: "wiki/transformer/transformer_layer_norm_learning.html" }), node("FFN", "ffn", { status: "verified", href: "wiki/transformer/transformer_ffn_learning.html" })] }),
        ] }),
        node("수학", "math", { status: "reference", href: "wiki/math/transformer_math_learning.html", children: [
          node("통계", "statistics", { status: "reference", href: "wiki/math/transformer_math_statistics_learning.html", children: [node("평균·분산·표준편차", "mean-variance-std", { status: "learning", href: "wiki/math/transformer_math_statistics_learning.html" }), node("StandardScaler", "standard-scaler", { status: "learning", href: "wiki/machine-learning/standard_scaler_mean_std_proof_learning.html" }), node("LayerNorm", "layer-norm", { status: "verified", href: "wiki/transformer/transformer_layer_norm_learning.html" })] }),
          node("벡터", "vector", { status: "reference", href: "wiki/math/transformer_math_vector_learning.html", children: [node("행렬곱", "matrix-multiplication", { status: "verified", href: "wiki/transformer/transformer_projection_learning.html" }), node("Attention Scaling", "attention-score", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html" })] }),
          node("삼각함수", "trigonometry", { status: "reference", href: "wiki/math/transformer_math_trigonometry_learning.html", children: [node("Positional Encoding", "positional-encoding", { status: "verified", href: "wiki/transformer/transformer_positional_encoding_learning.html" })] }),
        ] }),
        node("LLM 시스템·에이전트", "llm-systems", { status: "learning", href: "roadmaps/roadmap_llm_systems.html", children: [node("모델 메모리", "model-memory", { status: "reference", href: "wiki/llm-systems/tensor_element_memory_learning.html" }), node("파인튜닝·정렬", "fine-tuning-alignment", { status: "reference", href: "wiki/external-articles/llm_finetuning_12_techniques_source.html", children: [node("PEFT", "peft", { status: "learning", href: "wiki/llm-systems/lora_low_rank_adaptation_learning.html", children: [node("LoRA", "lora", { status: "learning", href: "wiki/llm-systems/lora_low_rank_adaptation_learning.html" })] }), node("선호도 정렬", "preference-alignment", { status: "reference", href: "wiki/external-articles/llm_finetuning_12_techniques_source.html#technique-rlhf-rlaif" })] }), node("Function Calling", "function-calling", { status: "learning", href: "wiki/llm-systems/function_calling_tool_contract_learning.html" }), node("서빙", "serving", { status: "reference", href: "wiki/llm-systems/llm_serving_stack_learning.html" }), node("평가 계약", "evaluation-contract", { status: "learning", href: "wiki/llm-systems/llm_evaluation_contract_learning.html" })] }),
      ] }),
    },
    {
      id: "workflow",
      label: "실행 흐름별",
      description: "원본 데이터에서 재현 가능한 추론까지 실제 프로젝트의 실행 순서로 연결합니다.",
      tree: node("재현 가능한 ML 시스템", "ml-system", { status: "learning", children: [
        node("1. 데이터 입력·이해", "data-gate", { status: "learning", children: [node("파일·SQL", "data-input", { status: "reference" }), node("Pandas 품질 검사", "data-quality", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" }), node("Feature·Label", "feature-label", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" })] }),
        node("2. 분할·전처리", "preprocessing", { status: "learning", children: [node("Train·Validation", "data-split", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" }), node("One-Hot Encoding", "one-hot", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" }), node("StandardScaler", "standard-scaler", { status: "learning", href: "wiki/machine-learning/standard_scaler_mean_std_proof_learning.html" })] }),
        node("3. Baseline", "baseline", { status: "learning", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html", children: [node("Dummy", "dummy-baseline", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("Logistic Regression", "logistic-regression", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("DecisionTree", "decision-tree", { status: "learning", href: "roadmaps/roadmap_machine_learning.html" })] }),
        node("4. PyTorch 학습", "training-loop", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html", children: [node("Dataset·DataLoader", "data-loader", { status: "verified", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#tensor" }), node("nn.Module", "nn-module", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer" }), node("MLP Forward", "churn-mlp", { status: "verified", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#mlp" }), node("Linear 파라미터·마지막 축", "linear-shape", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#linear-open-question" }), node("Logit·Sigmoid", "sigmoid", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#sigmoid" }), node("BCE Loss", "bce-loss", { status: "learning", href: "wiki/pytorch/pytorch_churn_mlp_learning.html#bce" }), node("Autograd·Optimizer", "autograd", { status: "verified", href: "wiki/pytorch/pytorch_linear_regression_learning.html#module-optimizer" })] }),
        node("5. 평가·오류 분석", "classification-evaluation", { status: "learning", children: [node("Confusion Matrix", "confusion-matrix", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("Precision·Recall·F1", "precision-recall-f1", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" }), node("Threshold", "threshold", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_evaluation_learning.html" })] }),
        node("6. 저장·추론·전달", "delivery-gate", { status: "reference", children: [node("Checkpoint", "checkpoint", { status: "reference", href: "roadmaps/roadmap_pytorch.html" }), node("Batch 추론", "batch-inference", { status: "reference", href: "pytorch_professional_roadmap.html#job-ready" }), node("API·Docker", "api-docker", { status: "reference", href: "pytorch_professional_roadmap.html#job-ready" })] }),
      ] }),
    },
    {
      id: "transformer",
      label: "Transformer 구조",
      description: "Token 입력부터 Decoder LM까지 Shape과 계산의 의존 순서로 따라갑니다.",
      tree: node("Transformer", "transformer", { status: "verified", href: "wiki/transformer/transformer_learning.html", children: [
        node("Token ID", "token-id", { status: "verified", href: "wiki/transformer/transformer_token_embedding_learning.html", children: [node("Token Embedding", "token-embedding", { status: "verified", href: "wiki/transformer/transformer_token_embedding_learning.html" }), node("Positional Encoding", "positional-encoding", { status: "verified", href: "wiki/transformer/transformer_positional_encoding_learning.html" })] }),
        node("Attention 입력", "attention-input", { status: "verified", children: [node("Q·K·V Projection", "qkv-projection", { status: "verified", href: "wiki/transformer/transformer_projection_learning.html" }), node("행렬곱", "matrix-multiplication", { status: "verified", href: "wiki/transformer/transformer_projection_learning.html" })] }),
        node("Scaled Dot-Product Attention", "attention", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html", children: [node("Score", "attention-score", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html" }), node("Scaling", "attention-scaling", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html" }), node("Mask·Softmax", "mask-softmax", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html" }), node("Value 가중합", "value-weighted-sum", { status: "verified", href: "wiki/transformer/transformer_attention_math_learning.html" })] }),
        node("Multi-Head Attention", "multi-head-attention", { status: "verified", href: "wiki/transformer/transformer_multi_head_attention_learning.html", children: [node("Head 분리·병합", "head-split-merge", { status: "verified", href: "wiki/transformer/transformer_multi_head_attention_learning.html" }), node("Output Projection", "output-projection", { status: "verified", href: "wiki/transformer/transformer_multi_head_attention_learning.html" })] }),
        node("Transformer Block", "transformer-block", { status: "verified", children: [node("Residual", "residual", { status: "verified", href: "wiki/transformer/transformer_residual_learning.html" }), node("LayerNorm", "layer-norm", { status: "verified", href: "wiki/transformer/transformer_layer_norm_learning.html" }), node("FFN", "ffn", { status: "verified", href: "wiki/transformer/transformer_ffn_learning.html" })] }),
        node("Tiny Decoder LM", "tiny-decoder-lm", { status: "learning", href: "roadmaps/roadmap_transformer.html", children: [node("Target shift", "target-shift", { status: "reference" }), node("Token Loss", "token-loss", { status: "reference" }), node("작은 생성", "generation", { status: "reference" })] }),
      ] }),
    },
    {
      id: "project",
      label: "프로젝트별",
      description: "프로젝트의 구체적인 파일과 일반 개념 문서를 함께 오가며 실행 맥락을 복원합니다.",
      tree: node("개인 프로젝트", "personal-projects", { status: "reference", href: "wiki.html#projects", children: [
        node("Kubernetes 운영 관측 AI", "k8s-ai-observability-project", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html", children: [
          node("Metrics·Logs·Events", "observability-data", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html#features", children: [node("Kubernetes", "kubernetes", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html#architecture" }), node("근거 데이터", "evidence", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html#contract" })] }),
          node("LangGraph 분석", "agent-loop", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html#architecture", children: [node("직접 신호·추론 분리", "evidence-contract", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html#contract" }), node("Agentic Loop", "agent-loop", { status: "reference", href: "wiki/external-articles/loop_engineering_agentic_loop_learning.html" })] }),
          node("FastAPI", "fastapi", { status: "reference", href: "wiki/projects/kubernetes-ai-observability.html#architecture" }),
        ] }),
        node("Notion RAG 개인 지식 비서", "notion-rag-project", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html", children: [
          node("문서 수집·임베딩", "document-ingestion", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#ingestion", children: [node("PostgreSQL", "postgresql", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#architecture" }), node("Qdrant", "vector-database", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#ingestion" })] }),
          node("RAG 채팅", "rag", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#rag", children: [node("검색 Context", "retrieval-context", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#rag" }), node("출처 링크", "evidence", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#rag" })] }),
          node("FastAPI", "fastapi", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#architecture" }),
          node("퀴즈·학습 이력", "quiz-learning", { status: "reference", href: "wiki/projects/notion-rag-knowledge-assistant.html#quiz" }),
        ] }),
        node("한국어 Kubernetes Function Calling", "k8s-function-calling-project", { status: "learning", href: "wiki/projects/ko-k8s-function-calling.html", children: [
          node("문제·범위", "project-scope", { status: "verified", href: "wiki/projects/k8s-function-calling-scope.html", children: [node("Function Calling", "function-calling", { status: "learning", href: "wiki/llm-systems/function_calling_tool_contract_learning.html" }), node("도구 Schema", "tool-schema", { status: "learning", href: "wiki/projects/k8s-function-calling-tools.html" })] }),
          node("데이터", "project-data", { status: "learning", href: "wiki/projects/k8s-function-calling-dataset.html", children: [node("Train·Validation", "data-split", { status: "verified", href: "wiki/machine-learning/machine_learning_churn_data_quality_learning.html" }), node("평가 Holdout", "evaluation-contract", { status: "learning", href: "wiki/llm-systems/llm_evaluation_contract_learning.html" })] }),
          node("학습", "project-training", { status: "learning", href: "wiki/projects/k8s-function-calling-training-code.html", children: [node("Qwen", "qwen", { status: "reference", href: "wiki/llm-systems/lora_adapters_qwen_learning.html" }), node("LoRA", "lora", { status: "learning", href: "wiki/llm-systems/lora_low_rank_adaptation_learning.html" }), node("Loss·Optimizer", "training-loop", { status: "learning", href: "wiki/projects/k8s-function-calling-training-code-explained.html" })] }),
          node("서빙", "project-serving", { status: "reference", href: "wiki/projects/k8s-function-calling-environment.html", children: [node("모델 정밀도", "precision-formats", { status: "reference", href: "wiki/external-articles/llm_precision_formats_learning.html" }), node("서빙 계층", "serving", { status: "reference", href: "wiki/llm-systems/llm_serving_stack_learning.html" })] }),
          node("평가", "project-evaluation", { status: "learning", href: "wiki/projects/k8s-function-calling-evaluation-code.html", children: [node("평가 계약", "evaluation-contract", { status: "learning", href: "wiki/llm-systems/llm_evaluation_contract_learning.html" }), node("Exact match", "exact-match", { status: "learning", href: "wiki/projects/k8s-function-calling-evaluation-code-explained.html" }), node("오류 분석", "error-analysis", { status: "reference", href: "wiki/projects/ko-k8s-function-calling.html" })] }),
        ] }),
      ] }),
    },
  ];

  const treeElement = document.getElementById("mindmapTree");
  const emptyElement = document.getElementById("mapEmpty");
  const detailElement = document.getElementById("mapDetail");
  const descriptionElement = document.getElementById("mapDescription");
  const tabsElement = document.getElementById("mapViewTabs");
  const searchElement = document.getElementById("mapSearch");
  const countElement = document.getElementById("mapDocumentCount");
  if (!treeElement || !tabsElement) return;
  if (window.KNOWLEDGE_MANIFEST && countElement) countElement.textContent = `${window.KNOWLEDGE_MANIFEST.documentCount}개`;

  let activeView = views[0];
  let occurrences = new Map();
  let renderedNodes = [];

  function countConcepts(root, counts = new Map()) {
    counts.set(root.concept, (counts.get(root.concept) || 0) + 1);
    (root.children || []).forEach((child) => countConcepts(child, counts));
    return counts;
  }

  function createTreeItem(item, path, depth, counts) {
    const listItem = document.createElement("li");
    const row = document.createElement("div");
    row.className = "map-node-row";
    const children = item.children || [];
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = `map-toggle${children.length ? "" : " placeholder"}`;
    toggle.textContent = depth < 2 ? "−" : "+";
    toggle.setAttribute("aria-label", `${item.label} 하위 개념 ${depth < 2 ? "접기" : "펼치기"}`);
    toggle.setAttribute("aria-expanded", String(depth < 2));
    row.appendChild(toggle);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-concept${counts.get(item.concept) > 1 ? " duplicate" : ""}`;
    button.dataset.concept = item.concept;
    button.innerHTML = `<span class="map-node-status ${item.status || ""}"></span><span class="map-node-label">${item.label}</span>${counts.get(item.concept) > 1 ? `<span class="map-duplicate-count">×${counts.get(item.concept)}</span>` : ""}`;
    row.appendChild(button);
    if (item.href) {
      const link = document.createElement("a");
      link.className = "map-document-link";
      link.href = item.href;
      link.setAttribute("aria-label", `${item.label} 문서 열기`);
      link.textContent = "문서 ↗";
      row.appendChild(link);
    }
    listItem.appendChild(row);

    const fullPath = [...path, item.label];
    const record = { item, listItem, button, path: fullPath, ancestors: [] };
    renderedNodes.push(record);
    if (!occurrences.has(item.concept)) occurrences.set(item.concept, []);
    occurrences.get(item.concept).push(record);

    if (children.length) {
      const childList = document.createElement("ul");
      childList.className = "map-children";
      childList.hidden = depth >= 2;
      for (const child of children) {
        const childItem = createTreeItem(child, fullPath, depth + 1, counts);
        childList.appendChild(childItem);
      }
      listItem.appendChild(childList);
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.textContent = expanded ? "+" : "−";
        childList.hidden = expanded;
      });
    }
    button.addEventListener("click", () => selectConcept(item.concept));
    return listItem;
  }

  function selectConcept(concept) {
    document.querySelectorAll(".map-concept.selected").forEach((element) => element.classList.remove("selected"));
    const matches = occurrences.get(concept) || [];
    matches.forEach(({ button }) => button.classList.add("selected"));
    if (!matches.length) return;
    const { item } = matches[0];
    const links = [...new Map(matches.filter(({ item: match }) => match.href).map(({ item: match }) => [match.href, match.label])).entries()];
    detailElement.innerHTML = `<h2>${item.label}</h2><p>이 관점에서 ${matches.length}곳에 나타납니다. 같은 개념은 위치가 달라도 함께 강조됩니다.</p><ul>${matches.map(({ path }) => `<li>${path.join(" → ")}</li>`).join("")}</ul>${links.length ? `<div class="map-detail-links">${links.map(([href, label]) => `<a href="${href}">${label} 문서 열기 →</a>`).join("")}</div>` : ""}`;
  }

  function renderView(view) {
    activeView = view;
    occurrences = new Map();
    renderedNodes = [];
    treeElement.replaceChildren();
    descriptionElement.textContent = view.description;
    const counts = countConcepts(view.tree);
    treeElement.appendChild(createTreeItem(view.tree, [], 0, counts));
    detailElement.innerHTML = "<h2>노드를 선택하세요</h2><p>개념을 선택하면 이 관점에서 등장하는 위치와 연결 문서를 보여줍니다.</p>";
    for (const button of tabsElement.querySelectorAll("button")) button.setAttribute("aria-selected", String(button.dataset.view === view.id));
    applySearch();
  }

  function applySearch() {
    const query = searchElement.value.trim().toLocaleLowerCase("ko");
    let visibleCount = 0;
    for (const record of renderedNodes) {
      const label = record.item.label.toLocaleLowerCase("ko");
      const match = !query || label.includes(query) || record.item.concept.includes(query);
      record.button.querySelector(".map-node-label").innerHTML = query && label.includes(query)
        ? record.item.label.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), (value) => `<mark>${value}</mark>`)
        : record.item.label;
      if (query && match) {
        visibleCount += 1;
        let parent = record.listItem.parentElement;
        while (parent && parent !== treeElement) {
          if (parent.classList.contains("map-children")) {
            parent.hidden = false;
            const toggle = parent.parentElement.querySelector(":scope > .map-node-row > .map-toggle");
            if (toggle) { toggle.setAttribute("aria-expanded", "true"); toggle.textContent = "−"; }
          }
          parent = parent.parentElement;
        }
        record.button.classList.add("selected");
      } else if (query) {
        record.button.classList.remove("selected");
      }
    }
    emptyElement.hidden = !query || visibleCount > 0;
    if (query && visibleCount) {
      const first = renderedNodes.find((record) => record.button.classList.contains("selected"));
      if (first) selectConcept(first.item.concept);
    }
  }

  for (const view of views) {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.dataset.view = view.id;
    button.textContent = view.label;
    button.setAttribute("aria-selected", "false");
    button.addEventListener("click", () => renderView(view));
    tabsElement.appendChild(button);
  }
  searchElement.addEventListener("input", applySearch);
  renderView(activeView);
})();
