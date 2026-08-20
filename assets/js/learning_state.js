window.LEARNING_STATE = {
  updated: "2026-08-20",
  overall: { done: 12, total: 23 },
  coaching: {
    recentEvidence: "기본 DecisionTree의 깊이 22·잎 1,106개와 Train 99.8048%·Validation 72.8886%를 확인했다. max_depth=3·5·7과 min_samples_leaf=10을 같은 split에서 비교했고, Tree 중 깊이 5가 Validation 79.8439%로 최고였지만 Logistic 80.5536%보다 낮았다.",
    diagnosis: "회원 이탈 scikit-learn Baseline 단위를 닫았다. 데이터·평가와 Transformer 내부 이해는 쌓였지만, AI/ML 엔지니어 결과물에 필요한 PyTorch 학습 루프와 저장·복원·추론 전달 증거는 아직 비어 있다. StandardScaler 수학 전개와 Recall·Precision 축 읽기는 복습 참조로 유지한다.",
    warning: "Transformer 내부 학습만 더 깊게 들어가기 전에, PyTorch Module·Optimizer를 회원 이탈 MLP와 최소 추론 전달까지 연결해 작은 end-to-end 프로젝트 하나를 먼저 닫는다.",
    completionGate: "완료: 회원 이탈 scikit-learn Baseline → 현재: PyTorch nn.Module·Optimizer로 y=3x+2 학습 루프 구현 → 연결: 같은 split의 MLP 비교·저장/복원·간단한 추론 API → 이후: Tiny Decoder LM 복귀",
    scheduledRotation: "현재: PyTorch nn.Module·Optimizer → 다음: 회원 이탈 MLP·최소 전달 → 이후: Tiny Decoder LM"
  },
  rotation: {
    trigger: "회원 이탈 Baseline의 Threshold·Tree 복잡도 비교 완료",
    next: "PyTorch nn.Module과 Optimizer로 y=3x+2의 forward·loss·backward·step 흐름 재구현",
    after: "같은 회원 이탈 split에 MLP를 연결하고 저장·복원·간단한 추론 API로 최소 전달 검증",
    returnTo: "Tiny Decoder LM"
  },
  tracks: [
    {
      id: "transformer",
      title: "Transformer 손코딩",
      href: "roadmaps/roadmap_transformer.html",
      done: 5,
      total: 6,
      current: "TransformerBlock.forward() 구현·Shape·전체 흐름 설명 완료",
      next: "ML·PyTorch 기반 관문 완료 뒤 Tiny Decoder LM으로 복귀",
      reinforcement: "transpose(1,2)로 Head별 묶음이 Token별 묶음으로 바뀌는 값 위치 검증 완료"
    },
    {
      id: "pytorch",
      title: "PyTorch 실무",
      href: "roadmaps/roadmap_pytorch.html",
      done: 2,
      total: 6,
      current: "Loss 계산 그래프·Autograd·수동 SGD 완료, nn.Module·Optimizer 학습 시작",
      next: "nn.Module과 Optimizer로 y=3x+2의 학습 루프를 직접 구현"
    },
    {
      id: "machine-learning",
      title: "Machine Learning 실습",
      href: "roadmaps/roadmap_machine_learning.html",
      done: 4,
      total: 6,
      current: "회원 이탈 scikit-learn Baseline 완료: Threshold·Tree 과적합·제약 비교 검증",
      next: "PyTorch 학습 루프를 만든 뒤 같은 회원 이탈 split에 MLP를 연결"
    },
    {
      id: "llm-systems",
      title: "LLM 시스템·최적화",
      href: "roadmaps/roadmap_llm_systems.html",
      done: 1,
      total: 5,
      current: "Forward·Hidden State·Logits와 MTP 검증 흐름 정리",
      next: "Acceptance length와 추론 비용을 작은 계산으로 검증"
    }
  ]
};
