window.LEARNING_STATE = {
  updated: "2026-08-16",
  overall: { done: 8, total: 23 },
  tracks: [
    {
      id: "transformer",
      title: "Transformer 손코딩",
      href: "roadmaps/roadmap_transformer.html",
      done: 4,
      total: 6,
      current: "Multi-Head Attention 전체 forward 구현과 최종 Shape 검증 완료",
      next: "Residual 결과에 LayerNorm을 적용하고 Token별 마지막 차원 통계 확인",
      reinforcement: "transpose(1,2)로 Head별 묶음이 Token별 묶음으로 바뀌는 값 위치 검증 완료"
    },
    {
      id: "pytorch",
      title: "PyTorch 실무",
      href: "roadmaps/roadmap_pytorch.html",
      done: 2,
      total: 6,
      current: "Loss 계산 그래프, Autograd와 수동 SGD 검증",
      next: "nn.Module과 Optimizer로 같은 학습 재구현"
    },
    {
      id: "machine-learning",
      title: "Machine Learning 실습",
      href: "roadmaps/roadmap_machine_learning.html",
      done: 1,
      total: 6,
      current: "이진 분류의 Feature·Label·Loss·Metric 개념 정리",
      next: "회원 이탈 데이터로 Dummy·Logistic Baseline 구성"
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
