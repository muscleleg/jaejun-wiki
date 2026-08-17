window.LEARNING_STATE = {
  updated: "2026-08-17",
  overall: { done: 9, total: 23 },
  coaching: {
    recentEvidence: "Multi-Head Attention과 TransformerBlock.forward()를 직접 구현했다. 입력·출력 Shape [1,2,2], Token별 평균은 사실상 0, 분산은 1임을 확인했다. Q가 K와 비교해 참고 비율을 만들고 그 비율로 V를 섞어 현재 Token의 문맥을 만든다는 Attention 흐름과 두 Residual·FFN의 역할을 자기 말로 설명했다.",
    diagnosis: "TransformerBlock 완료 관문을 닫았으므로 Transformer 집중을 더 이어가기보다, 계획했던 데이터 기반 관문으로 전환할 시점이다.",
    warning: "Tiny Decoder LM은 Transformer의 다음 구현 항목이지만, 데이터 분할·Baseline 평가와 PyTorch 학습 구조를 연결하기 전까지 시작을 보류한다.",
    completionGate: "회원 이탈 데이터 위치와 파일 확인 → Pandas로 shape·dtypes·결측·중복·Label 분포 점검 → Train/Validation 분할 → Dummy·Logistic Regression을 같은 Metric으로 비교",
    scheduledRotation: "현재: Machine Learning 회원 이탈 Baseline → 다음: PyTorch nn.Module·Optimizer → 이후: Tiny Decoder LM 복귀"
  },
  rotation: {
    trigger: "회원 이탈 Dummy·Logistic Baseline 비교와 결과 설명 완료",
    next: "회원 이탈 데이터 위치·파일 확인 후 Pandas 구조와 품질 점검",
    after: "PyTorch nn.Module·Optimizer로 y=3x+2 재구현",
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
      current: "Loss 계산 그래프, Autograd와 수동 SGD 검증",
      next: "회원 이탈 Baseline 완료 뒤 nn.Module과 Optimizer로 y=3x+2 재구현"
    },
    {
      id: "machine-learning",
      title: "Machine Learning 실습",
      href: "roadmaps/roadmap_machine_learning.html",
      done: 1,
      total: 6,
      current: "활성 트랙 · 회원 이탈 실제 데이터 관문 시작",
      next: "데이터 위치·파일 확인 후 Pandas로 shape·dtypes·결측·중복·Label 분포 점검"
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
