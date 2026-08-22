window.LEARNING_STATE = {
  updated: "2026-08-22",
  overall: { done: 13, total: 24 },
  coaching: {
    recentEvidence: "회원 이탈 원본 표를 같은 Train·Validation 기준으로 전처리해 NumPy [5634,45]·[1409,45], float32 Tensor와 batch_size=64 DataLoader로 옮겼습니다. MLP의 [64,45] → [64,16] → [64,1] Forward와 초기 BCE 0.6564000844955444를 확인하고, SGD 한 Step 뒤 같은 Batch Loss가 0.6511512994766235로 내려가는 실행까지 확인했습니다.",
    diagnosis: "원본 데이터 → Pandas → NumPy/Tensor → DataLoader → MLP Forward → SGD 한 Step까지는 연결했습니다. Linear의 파라미터 수·다차원 입력 Shape와 BCE 계산은 다시 설명하는 확인이 필요하며, 한 Batch 과적합·Validation Metric·저장·복원·추론을 자료 없이 연결한 증거는 아직 부족합니다.",
    warning: "새 주제를 늘리거나 Pandas·NumPy 장기 기초 과정으로 돌아가지 않습니다. 현재 MLP 안에서 자료 조작과 Shape·dtype 예측을 짧게 반복하고, 반복 뒤에도 재현하지 못할 때만 별도 보강합니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 scikit-learn Baseline·PyTorch nn.Module/Optimizer·작은 회귀 Batch 학습과 실제 회원 이탈 DataLoader·MLP Forward를 검증했습니다. → 현재: 한 Batch 과적합과 Train/Validation Metric을 만듭니다. → 다음: 저장·복원·간단한 추론 API를 연결합니다. → 이후: Tiny Decoder LM과 사전학습 텍스트 모델 적용으로 이어갑니다.",
    scheduledRotation: "1차 순환 · 현재: 회원 이탈 MLP의 한 Batch 과적합과 Train·Validation Metric을 검증합니다. → 다음: 저장·복원과 최소 추론을 검증합니다. → 이후: Tiny Decoder LM → 사전학습 텍스트 모델 적용으로 이어갑니다."
  },
  rotation: {
    trigger: "회원 이탈 Baseline과 PyTorch nn.Module·Optimizer 학습을 마쳤습니다.",
    next: "회원 이탈 MLP의 Linear 파라미터·Shape를 재확인하고, 이미 실행한 SGD 한 Step을 반복해 한 Batch 과적합과 Train·Validation Metric을 검증합니다.",
    after: "같은 회원 이탈 MLP와 전처리·Label mapping을 저장·복원하고 간단한 추론 API로 최소 전달을 검증합니다.",
    returnTo: "Tiny Decoder LM → 사전학습 텍스트 모델 적용"
  },
  tracks: [
    {
      id: "transformer",
      title: "Transformer 손코딩·적용",
      href: "roadmaps/roadmap_transformer.html",
      done: 5,
      total: 7,
      current: "TransformerBlock.forward() 구현·Shape·전체 흐름 설명을 완료했습니다.",
      next: "ML·PyTorch 기반 관문을 마친 뒤 Tiny Decoder LM으로 복귀하고 사전학습 텍스트 모델을 적용합니다.",
      reinforcement: "transpose(1,2)로 Head별 묶음이 Token별 묶음으로 바뀌는 값 위치를 검증했습니다."
    },
    {
      id: "pytorch",
      title: "PyTorch 실무",
      href: "roadmaps/roadmap_pytorch.html",
      done: 3,
      total: 6,
      current: "회원 이탈 데이터를 Pandas → NumPy → Tensor → DataLoader로 옮기고 [batch,45] → [batch,16] → [batch,1] MLP Forward·초기 BCE와 SGD 한 Step의 Loss 감소를 확인했습니다.",
      next: "한 Batch 과적합 뒤 Train Loss와 Validation Accuracy·Yes Recall을 기존 Logistic Baseline과 비교합니다."
    },
    {
      id: "machine-learning",
      title: "Machine Learning 실습",
      href: "roadmaps/roadmap_machine_learning.html",
      done: 4,
      total: 6,
      current: "회원 이탈 scikit-learn Baseline을 완료하고 Threshold·Tree 과적합·제약 비교를 검증했습니다.",
      next: "같은 회원 이탈 split의 MLP를 학습하고 Validation Accuracy·Yes Recall을 Logistic Baseline과 비교합니다."
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
