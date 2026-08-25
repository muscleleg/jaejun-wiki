window.LEARNING_STATE = {
  updated: "2026-08-25",
  overall: { done: 17, total: 24 },
  coaching: {
    recentEvidence: "수동 Logit [1,3,10]에서 dim=-1 Softmax와 Target [7,2,9]의 행별 열 선택을 확인하고, 위치별 Cross Entropy [0.7966,1.4612,0.3702]와 평균 0.8760을 검산했습니다. LM Head로 [1,3,2]→[1,3,10], Token Embedding으로 [1,3]→[1,3,2]가 되는 실행 결과도 확인했습니다.",
    diagnosis: "Tiny Decoder LM의 Target shift·Causal Mask에 이어 Vocabulary Logit·Token Cross Entropy·LM Head·Token Embedding까지 연결했습니다. Position Embedding의 실제 합, 기존 Causal TransformerBlock 연결, 전체 학습과 작은 생성은 아직 남아 있습니다.",
    warning: "오늘의 Logit과 Hidden State 일부는 Shape·Loss를 이해하려고 손으로 만든 연습용 값입니다. 이를 학습된 Decoder 출력으로 보거나 Tiny Decoder LM 전체를 완료 처리하지 않습니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 Baseline·PyTorch MLP 결과물을 닫았습니다. → 진행: Tiny Decoder LM의 Target shift·Causal Mask·Token Loss·LM Head·Token Embedding을 확인했습니다. → 남음: Position Embedding·Causal Block 연결·작은 학습·생성을 검증합니다. → 이후: 사전학습 텍스트 모델 적용으로 이어갑니다.",
    scheduledRotation: "1차 순환 · 현재: Token Embedding에 Position Embedding을 더하는 단계부터 이어갑니다. → 다음: Causal TransformerBlock·LM Head·Loss를 연결해 Tiny LM을 학습·생성한 뒤 사전학습 텍스트 모델을 같은 문제 정의·Metric·오류 분석 흐름에 적용합니다."
  },
  rotation: {
    trigger: "회원 이탈 Baseline과 PyTorch MLP의 학습·평가·저장·복원·원본 한 명 추론을 마쳤습니다.",
    next: "Token Embedding에 Position Embedding을 더하고 Causal TransformerBlock·LM Head를 연결한 뒤 작은 학습·생성으로 이어갑니다.",
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
      current: "Tiny Decoder LM에서 위치별 Logit [1,3,10], Target의 행별 열 선택, Cross Entropy 평균, LM Head [1,3,2]→[1,3,10], Token Embedding [1,3]→[1,3,2]를 구현·검증했습니다.",
      next: "Position Embedding의 합을 실행하고 Causal TransformerBlock·LM Head·Token Loss를 하나로 연결해 작은 학습·생성을 구현합니다.",
      reinforcement: "TransformerBlock 전체 흐름과 Embedding·Score Scaling의 분산 계산, LayerNorm의 중심·배율 정돈 의미를 다시 설명했습니다."
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
