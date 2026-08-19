window.LEARNING_STATE = {
  updated: "2026-08-19",
  overall: { done: 10, total: 23 },
  coaching: {
    recentEvidence: "Logistic Regression을 전처리된 Train (5634,45)으로 학습해 Validation Accuracy 80.55%를 확인했고, Dummy 73.46%보다 7.10%p 높았다. Confusion Matrix에서 Yes Recall 55.88%·Precision 65.72%·F1 60.40%를 직접 계산하고, classification report의 macro·weighted 평균도 인원수 가중치와 연결해 읽었다.",
    diagnosis: "첫 Logistic Baseline의 학습과 지표 해석은 끝났다. StandardScaler 수학 전개는 작은 숫자로 따라갔지만 아직 자기 말로 완전히 설명한 증거가 없어 복습 참조로 유지한다. 현재 다음 질문은 모델 확률과 Threshold를 바꾸면 Recall·Precision이 어떻게 trade-off되는가다.",
    warning: "Tiny Decoder LM은 Transformer의 다음 구현 항목이지만, 데이터 분할·Baseline 평가와 PyTorch 학습 구조를 연결하기 전까지 시작을 보류한다.",
    completionGate: "완료: 데이터 품질·분할·Dummy Accuracy·One-Hot·StandardScaler 통합 검증·Logistic 평가 → 현재: 예측 확률과 Threshold에 따른 Precision·Recall trade-off 비교 → 복습: StandardScaler 평균 0·표준편차 1 수학 설명",
    scheduledRotation: "현재: Machine Learning 회원 이탈 Baseline → 다음: PyTorch nn.Module·Optimizer → 이후: Tiny Decoder LM 복귀"
  },
  rotation: {
    trigger: "회원 이탈 Baseline의 Threshold 비교와 Tree 모델 비교 완료",
    next: "Logistic Regression의 predict_proba()를 확인하고 Threshold를 바꿔 Precision·Recall 변화를 비교",
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
      current: "Logistic Baseline과 분류 지표 해석 완료 · StandardScaler 수학 전개는 복습 참조",
      next: "predict_proba()와 Threshold로 Precision·Recall trade-off 비교"
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
