"""YOLOv11n 전이학습 — 선박 위협물 탐지 PoC (미검증 스캐폴드).

목적: AIHub 71293(하천·항만 수중 폐기물)로 선박 위협물(폐어구·고철 등) 탐지 역량 데모.
실행 전: prepare_aihub.py로 데이터를 YOLO 형식(data/)으로 변환할 것.
설치: pip install ultralytics

산출: runs/vessel-threat-v0/ 가중치 + ONNX(엣지 Hailo/TensorRT 변환 입력).
설계 근거: docs/선박위협물-탐지-PoC-설계.md
"""
from ultralytics import YOLO

VESSEL_THREAT_IDS = [0, 8, 7]  # 낚시도구·고철·의류 (classes.yaml과 동일)


def main():
    model = YOLO("yolo11n.pt")  # 사전학습 nano 가중치에서 전이학습

    model.train(
        data="classes.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        patience=10,
        project="runs",
        name="vessel-threat-v0",
    )

    metrics = model.val()
    print(f"mAP50={metrics.box.map50:.4f}  mAP50-95={metrics.box.map:.4f}")
    # 선박 위협물 클래스 재현율 우선 확인(놓치면 사고)
    for cid in VESSEL_THREAT_IDS:
        try:
            print(f"  [위협물] class {cid} recall={metrics.box.r[cid]:.4f}")
        except (IndexError, TypeError):
            pass

    # 엣지 배포 입력 — ONNX → Hailo(.hef)/TensorRT INT8 변환
    model.export(format="onnx", imgsz=640, opset=12)


if __name__ == "__main__":
    main()
