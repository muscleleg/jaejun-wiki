window.LEARNING_STATE = {
  updated: "2026-08-26",
  overall: { done: 17, total: 24 },
  coaching: {
    recentEvidence: "학습형 Position Embedding을 Token Embedding에 더해 [1,3,2]를 확인하고, Causal Multi-Head Attention의 출력 [1,3,2]·weight [1,2,3,3]·미래 위치 0을 검증했습니다. 이어 Causal Attention → Residual·LayerNorm → FFN 2→8→2 → Residual·LayerNorm Block의 출력 [1,3,2]도 실행했습니다.",
    diagnosis: "Tiny Decoder LM의 개별 부품은 Target shift·Token Loss·Token/Position Embedding·Causal Attention·Causal TransformerBlock까지 연결했습니다. 전체 TinyDecoderLM 클래스는 코드 설명만 받은 상태라 아직 Forward·Loss 실행 증거가 없고, 학습과 생성도 남아 있습니다.",
    warning: "개별 Block의 Shape 확인만으로 Tiny Decoder LM을 완료 처리하지 않습니다. 전체 Token 입력이 Logit [1,3,10]과 Loss로 연결되는 실행, Loss 감소, 다음 Token 생성까지 확인해야 합니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 Baseline·PyTorch MLP 결과물을 닫았습니다. → 진행: Tiny Decoder LM의 개별 Embedding·Causal Attention·Causal Block·Token Loss를 확인했습니다. → 남음: 전체 모델 Forward·Loss와 작은 학습·생성을 검증합니다. → 이후: 사전학습 텍스트 모델 적용으로 이어갑니다.",
    scheduledRotation: "1차 순환 · 현재: TinyDecoderLM 전체 조립 셀을 직접 실행해 [1,3] → [1,3,10]과 초기 Loss를 확인합니다. → 다음: 작은 데이터 학습·한 Token 생성 뒤 사전학습 텍스트 모델을 같은 문제 정의·Metric·오류 분석 흐름에 적용합니다."
  },
  rotation: {
    trigger: "회원 이탈 Baseline과 PyTorch MLP의 학습·평가·저장·복원·원본 한 명 추론을 마쳤습니다.",
    next: "TinyDecoderLM 전체 Forward와 Cross Entropy Loss를 실행한 뒤 작은 학습·생성으로 이어갑니다.",
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
      current: "Tiny Decoder LM에서 학습형 Position Embedding, 미래 위치를 가리는 Multi-Head Attention, Residual·LayerNorm·FFN을 포함한 Causal TransformerBlock까지 [1,3,2] Shape으로 구현·검증했습니다.",
      next: "TinyDecoderLM 전체 클래스의 [1,3] → Logit [1,3,10]과 초기 Loss를 실행하고 작은 학습·한 Token 생성을 구현합니다.",
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
