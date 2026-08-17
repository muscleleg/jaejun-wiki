window.LEARNING_STATE = {
  updated: "2026-08-17",
  overall: { done: 10, total: 23 },
  coaching: {
    recentEvidence: "데이터 이해와 분할을 마친 뒤 most_frequent Dummy를 fit했다. y_train의 No 비율 0.73464679를 확인하고 Validation 1,409개를 모두 No로 예측해 Accuracy 73.456%가 실제 Validation의 No 비율과 같아지는 과정을 직접 설명하고 계산했다.",
    diagnosis: "Dummy 챕터는 완료했지만 재현 가능한 Baseline 관문 전체는 아직 끝나지 않았다. 범주형·수치형 전처리 Pipeline을 만든 뒤 Logistic Regression을 같은 Split과 Accuracy·Precision·Recall로 비교해야 한다.",
    warning: "Tiny Decoder LM은 Transformer의 다음 구현 항목이지만, 데이터 분할·Baseline 평가와 PyTorch 학습 구조를 연결하기 전까지 시작을 보류한다.",
    completionGate: "완료: 데이터 품질·분할·Dummy Accuracy 73.456% 재현 → 현재: 범주형·수치형 전처리 Pipeline → Logistic Regression을 같은 Split의 Accuracy·Precision·Recall로 비교",
    scheduledRotation: "현재: Machine Learning 회원 이탈 Baseline → 다음: PyTorch nn.Module·Optimizer → 이후: Tiny Decoder LM 복귀"
  },
  rotation: {
    trigger: "회원 이탈 Dummy·Logistic Baseline 비교와 결과 설명 완료",
    next: "범주형·수치형 Feature를 구분하고 ColumnTransformer·Pipeline의 역할 확인",
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
      current: "데이터 분할·Dummy Accuracy 73.456% 재현 완료 · Logistic 전처리 단계",
      next: "ColumnTransformer·Pipeline 구성 → Logistic을 같은 Validation의 Accuracy·Precision·Recall로 비교"
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
