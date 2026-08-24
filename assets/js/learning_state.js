window.LEARNING_STATE = {
  updated: "2026-08-23",
  overall: { done: 17, total: 24 },
  coaching: {
    recentEvidence: "원본 Validation 고객 1명을 DataFrame (1,19)로 유지해 Train 전처리 기준의 NumPy (1,45)와 float32 Tensor [1,45]로 바꿨습니다. 복원 모델의 Logit -2.61555147, sigmoid 출력 0.06814424를 0.5 Threshold로 판정해 예측 0과 실제 0이 일치함을 확인했습니다.",
    diagnosis: "회원 이탈 MLP에서 Dataset/DataLoader 학습·Validation Accuracy와 Yes Recall·Baseline 비교·state_dict 저장·복원·동일 출력·원본 고객 한 명 추론을 모두 연결했습니다. 예약한 교차 트랙 완료 조건이 충족됐으므로 새 ML 심화를 추가하지 않고 Tiny Decoder LM으로 복귀합니다.",
    warning: "새 주제를 늘리거나 Pandas·NumPy 장기 기초 과정으로 돌아가지 않습니다. 현재 MLP 안에서 자료 조작과 Shape·dtype 예측을 짧게 반복하고, 반복 뒤에도 재현하지 못할 때만 별도 보강합니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 Baseline·PyTorch MLP 학습·평가·저장·복원·원본 고객 한 명 추론까지 닫았습니다. → 현재: Tiny Decoder LM의 입력·Target shift·Causal Mask·Token Loss·작은 생성을 연결합니다. → 이후: 사전학습 텍스트 모델 적용으로 이어갑니다.",
    scheduledRotation: "1차 순환 · 현재: 예약한 대로 Tiny Decoder LM으로 복귀합니다. → 다음: 사전학습 텍스트 모델을 같은 문제 정의·Metric·오류 분석 흐름에 적용합니다."
  },
  rotation: {
    trigger: "회원 이탈 Baseline과 PyTorch MLP의 학습·평가·저장·복원·원본 한 명 추론을 마쳤습니다.",
    next: "Tiny Decoder LM에서 입력·Target shift·Causal Mask·Token Loss·작은 생성을 연결합니다.",
    after: "작은 공개 텍스트 문제에 사전학습 텍스트 모델을 적용하고 Baseline과 비교합니다.",
    returnTo: "Tiny Decoder LM → 사전학습 텍스트 모델 적용"
  },
  tracks: [
    {
      id: "transformer",
      title: "Transformer 손코딩·적용",
      href: "roadmaps/roadmap_transformer.html",
      done: 5,
      total: 7,
      current: "TransformerBlock.forward() 구현·Shape·전체 흐름 설명 뒤 예약했던 ML·PyTorch 기반 관문을 완료했습니다.",
      next: "Tiny Decoder LM에서 Target shift·Causal Mask·Token Loss·작은 생성을 구현합니다.",
      reinforcement: "transpose(1,2)로 Head별 묶음이 Token별 묶음으로 바뀌는 값 위치를 검증했습니다."
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
      next: "현재 1차 ML 관문은 완료했으며, Tiny Decoder LM 뒤 사전학습 텍스트 모델 적용에서 같은 평가 원칙을 재사용합니다."
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
