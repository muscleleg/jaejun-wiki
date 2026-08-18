window.LEARNING_STATE = {
  updated: "2026-08-17",
  overall: { done: 10, total: 23 },
  coaching: {
    recentEvidence: "숫자형 네 열의 값 범위가 서로 다름을 확인하고 StandardScaler.fit_transform을 실행했다. 변환 뒤 열별 평균은 부동소수점 오차 수준으로 0, 표준편차는 [1,1,1,1]인 출력까지 확인했다.",
    diagnosis: "StandardScaler의 코드 동작은 확인했지만 수학적 이해는 완료되지 않았다. 평균을 뺄 때 표준편차가 유지되고 σ로 나눌 때 1이 되는 이유를 분산 공식과 작은 숫자로 증명한 뒤 전처리 통합을 계속한다.",
    warning: "Tiny Decoder LM은 Transformer의 다음 구현 항목이지만, 데이터 분할·Baseline 평가와 PyTorch 학습 구조를 연결하기 전까지 시작을 보류한다.",
    completionGate: "완료: 데이터 품질·분할·Dummy Accuracy·One-Hot·StandardScaler 출력 검증 → 현재: StandardScaler의 평균 0·표준편차 1 증명 → 전처리 통합과 Logistic Regression 비교",
    scheduledRotation: "현재: Machine Learning 회원 이탈 Baseline → 다음: PyTorch nn.Module·Optimizer → 이후: Tiny Decoder LM 복귀"
  },
  rotation: {
    trigger: "회원 이탈 Dummy·Logistic Baseline 비교와 결과 설명 완료",
    next: "작은 숫자 집합으로 (x−μ)/σ의 평균 0·표준편차 1을 분산 공식에서 증명",
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
      done: 2,
      total: 6,
      current: "StandardScaler 출력 검증 · 평균 0·표준편차 1 수학은 미해결",
      next: "중심 이동·σ 나눗셈 증명 → Scaler를 ColumnTransformer에 통합"
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
