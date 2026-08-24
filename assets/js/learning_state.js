window.LEARNING_STATE = {
  updated: "2026-08-24",
  overall: { done: 17, total: 24 },
  coaching: {
    recentEvidence: "Token [[3,7,2,9]]에서 입력 [[3,7,2]]와 다음 Token 정답 [[7,2,9]]을 만들어 두 Shape [1,3]을 확인했습니다. 길이 3의 Boolean Causal Mask를 만들고 미래 Score를 -inf로 바꾼 뒤 Softmax 결과 [1,0,0]·[0.2689,0.7311,0]과 행별 합 1을 확인했습니다.",
    diagnosis: "예약한 교차 트랙을 마치고 Tiny Decoder LM 구현을 실제로 재개했습니다. Target shift와 Causal Mask의 생성·Score 적용·Masked Softmax까지 연결했으며, Tiny Decoder LM 전체 완료에는 Vocabulary Logit·Token Cross Entropy·학습·작은 생성 검증이 남아 있습니다.",
    warning: "Causal Mask 예제 실행만으로 Tiny Decoder LM을 완료 처리하지 않습니다. 다음에는 위치별 Logit [batch,token,vocab]과 Target [batch,token]을 Cross Entropy로 연결하고, 작은 데이터 학습과 한 Token씩 생성까지 재현합니다.",
    completionGate: "1차 순환 · 완료: 회원 이탈 Baseline·PyTorch MLP 결과물을 닫았습니다. → 진행: Tiny Decoder LM의 Target shift·Causal Mask·Masked Softmax를 확인했습니다. → 남음: Token Loss·작은 학습·생성을 연결합니다. → 이후: 사전학습 텍스트 모델 적용으로 이어갑니다.",
    scheduledRotation: "1차 순환 · 현재: Tiny Decoder LM의 Token Loss부터 이어갑니다. → 다음: Tiny LM 학습·생성 뒤 사전학습 텍스트 모델을 같은 문제 정의·Metric·오류 분석 흐름에 적용합니다."
  },
  rotation: {
    trigger: "회원 이탈 Baseline과 PyTorch MLP의 학습·평가·저장·복원·원본 한 명 추론을 마쳤습니다.",
    next: "Tiny Decoder LM에서 Vocabulary Logit과 위치별 Token Cross Entropy를 연결한 뒤 작은 학습·생성으로 이어갑니다.",
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
      current: "Tiny Decoder LM에서 Target shift [1,3], 길이 3 Causal Mask, 미래 Score의 -inf 적용과 Masked Softmax를 구현·검증했습니다.",
      next: "Vocabulary Logit [1,3,10]과 Target [1,3]의 Token Cross Entropy를 연결하고 작은 학습·생성을 구현합니다.",
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
