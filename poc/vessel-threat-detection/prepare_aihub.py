"""AIHub 71293 어노테이션 → YOLO 형식 변환 (미검증 스텁).

AIHub 라벨의 실제 JSON 스키마는 받은 샘플로 확정할 것 — 아래는 일반적 bbox JSON 가정이다.
출력 구조(ultralytics 표준):
  data/images/{train,val}/*.jpg
  data/labels/{train,val}/*.txt   # 각 줄: <cls> <cx> <cy> <w> <h> (0~1 정규화)

설계 근거: docs/선박위협물-탐지-PoC-설계.md
"""
import json
import os

CLASS_TO_ID = {
    "낚시도구": 0, "봉돌": 1, "유리병": 2, "음료캔": 3, "통조림": 4,
    "PET병": 5, "장갑": 6, "의류": 7, "고철": 8, "마스크": 9,
}


def to_yolo(box, img_w, img_h):
    """box = [x_min, y_min, x_max, y_max] (픽셀) 가정 → (cx, cy, w, h) 정규화."""
    x0, y0, x1, y1 = box
    return (
        (x0 + x1) / 2 / img_w,
        (y0 + y1) / 2 / img_h,
        (x1 - x0) / img_w,
        (y1 - y0) / img_h,
    )


def convert_one(ann_path):
    """한 어노테이션 JSON → YOLO 라벨 줄 목록.
    TODO: 받은 샘플의 실제 키로 수정(annotations/objects, label/category, bbox/box, image size)."""
    data = json.load(open(ann_path, encoding="utf-8"))
    img_w = data.get("image", {}).get("width") or data.get("width")
    img_h = data.get("image", {}).get("height") or data.get("height")
    if not img_w or not img_h:
        raise ValueError(f"이미지 크기 없음: {ann_path} — 실제 스키마로 키 확정 필요")

    lines = []
    for obj in data.get("annotations", data.get("objects", [])):
        name = obj.get("label") or obj.get("category") or obj.get("class")
        box = obj.get("bbox") or obj.get("box")
        if name in CLASS_TO_ID and box:
            cx, cy, w, h = to_yolo(box, img_w, img_h)
            lines.append(f"{CLASS_TO_ID[name]} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
    return lines


if __name__ == "__main__":
    print(
        "AIHub 71293 → YOLO 변환 스텁입니다.\n"
        "받은 샘플의 실제 JSON 스키마를 열어 convert_one()의 키(annotations/label/bbox/size)를 "
        "확정한 뒤, 디렉터리 순회·train/val 분할·이미지 복사를 추가해 실행하세요."
    )
