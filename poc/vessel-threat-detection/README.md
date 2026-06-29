# 선박 위협물 탐지 PoC (AIHub 71293)

선박 추진기에 감기는 폐어구·로프·금속 등 **선박 위협물**을 영상에서 탐지·분류하는 역량 데모.
해운·항만 사회가치경영 피치용이자 SEA:CUT perception의 0단계 부트스트랩.

> ⚠️ **미검증 스캐폴드.** 받은 AIHub 71293 샘플을 연결한 뒤 실행한다. 코드는 표준 API에 맞춰 작성했으나 이 저장소에서 실행 검증하지 않았다.

설계 문서: `docs/선박위협물-탐지-PoC-설계.md`

## 실행 절차

1. **데이터 준비**: AIHub 「하천 및 항만 수중생활 폐기물」(dataSetSn=71293) 다운로드(이용 승인 필요).
2. **변환**: `python prepare_aihub.py` — 받은 샘플의 실제 JSON 스키마로 `convert_one()` 키를 확정한 뒤 `data/images,labels/{train,val}` 생성.
3. **설치**: `pip install ultralytics`
4. **학습**: `python train.py` — YOLOv11n 전이학습 → `runs/vessel-threat-v0/` + ONNX.
5. **엣지 변환**: ONNX → Hailo(.hef, Pi 5 + AI Kit) 또는 TensorRT INT8(Jetson Orin Nano).

## 클래스와 매핑

`classes.yaml`에 10종 + 선박 위협물 부분집합(`vessel_threat_ids: 낚시도구·고철·의류`) + 우리 관측 레코드 `class_dist` 매핑(`our4_map`).

## 정직한 한계

- 71293은 **수중·항만** 데이터다. 우리 현장은 하천 수면 부유물이라 **도메인 갭**이 있다. 이 PoC는 ①해운향 위협물 탐지 데모로는 직접 유효, ②우리 붐 perception으로는 사전학습 가중치로만 쓰고 합성·현장 데이터로 미세조정.
- **라이선스**: AIHub 데이터는 이용 약관 준수 대상. 원본 이미지·라벨은 이 저장소에 커밋하지 않는다(`data/`는 .gitignore 권장).
- PoC는 역량 데모이며 배포·정확 집계를 약속하지 않는다.

## 우리 시스템 연결

탐지 결과 → `our4_map`으로 `class_dist` 변환 → `/api/observations` 적재 → 수거 중량 앵커(`/api/observations/anchor`)로 보정. PoC가 곧 perception 모델 `det-v0`가 된다.
