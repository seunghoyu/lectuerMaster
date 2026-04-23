# -*- coding: utf-8 -*-
"""
unifiedLcms.json 필드 밀림·오매핑 복구 스크립트.

원본 CSV가 없을 때 기존 JSON을 읽어 다음을 정정합니다.
- 강좌명/강좌제작주체: 제목 자리에 '외부강의(입점)'·'내부강의(자체제작)'만 있고
  제작주체 자리에 실제 강좌명이 들어간 경우 스왑 후 제작주체는 내부/외부강좌로 통일.
- 선생님 배열이 숫자 문자열(가격)만 담은 경우 → price로 이동.
- 수강일수(durationDays)가 가격대(1000 이상)로 잘못 들어간 경우 정리.
- instructors 내 'undefined' 문자열 제거.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SWAP_TITLES = frozenset(
    {
        "외부강의(입점)",
        "내부강의(자체제작)",
    }
)

LABEL_TO_SOURCE = {
    "외부강의(입점)": "외부강좌",
    "내부강의(자체제작)": "내부강좌",
}

CANONICAL_LECTURE_SOURCES = frozenset({"내부강좌", "외부강좌"})

BAD_STRINGS = frozenset({"undefined", "null", "None"})


def _clean_instructors(value):
    if not isinstance(value, list):
        return value
    out = []
    for x in value:
        if not isinstance(x, str):
            out.append(x)
            continue
        t = x.strip()
        if not t or t in BAD_STRINGS:
            continue
        out.append(t)
    return out


def _coerce_price_empty(price):
    return price is None or price == ""


def repair_record(r: dict) -> dict:
    row = dict(r)

    ins = _clean_instructors(row.get("instructors"))
    row["instructors"] = ins

    lt = row.get("lectureTitle")
    ls = row.get("lectureSource")
    if lt in SWAP_TITLES and isinstance(ls, str):
        s = ls.strip()
        if s and not s.isdigit():
            row["lectureTitle"] = s
            row["lectureSource"] = LABEL_TO_SOURCE.get(lt, lt)

    ins = row.get("instructors")
    if (
        isinstance(ins, list)
        and ins
        and all(isinstance(x, str) and x.isdigit() for x in ins)
    ):
        if _coerce_price_empty(row.get("price")):
            row["price"] = int(ins[0])
        row["instructors"] = []

    pr = row.get("price")
    dd = row.get("durationDays")
    # 가격과 동일한 큰 숫자가 수강일수에 중복된 경우만 제거 (0==0 은 무료·기간 미설정 등으로 유지)
    if (
        isinstance(pr, int)
        and isinstance(dd, int)
        and dd == pr
        and pr != 0
    ):
        row["durationDays"] = None

    dd = row.get("durationDays")
    pr = row.get("price")
    if isinstance(dd, int) and dd >= 1000:
        if _coerce_price_empty(pr):
            row["price"] = dd
        row["durationDays"] = None

    return row


def fix_title_empty_misplaced_in_source(row: dict) -> dict:
    """
    강좌명(lectureTitle)이 비어 있고 강좌제작주체(lectureSource)에 강좌명이 들어간 경우.
    → 제작주체 문자열을 강좌명으로 옮기고 제작주체는 내부강좌로 둔다(다수 레코드가 내부강좌).
    """
    r = dict(row)
    ls = r.get("lectureSource")
    if not isinstance(ls, str):
        return r
    s = ls.strip()
    if s in CANONICAL_LECTURE_SOURCES:
        return r
    lt = r.get("lectureTitle")
    lt_str = str(lt).strip() if lt is not None else ""
    if lt_str:
        return r
    if not s:
        return r
    r["lectureTitle"] = s
    r["lectureSource"] = "내부강좌"
    return r


def normalize_undefined_strings(row: dict) -> dict:
    """스칼라 필드에 문자열 'undefined' 등이 들어간 경우 null 처리."""
    for key, val in list(row.items()):
        if isinstance(val, str) and val.strip() in BAD_STRINGS:
            row[key] = None
    return row


def main():
    parser = argparse.ArgumentParser(description="Rebuild unifiedLcms.json from existing JSON with repairs.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "unifiedLcms.json",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "unifiedLcms.json",
    )
    parser.add_argument("--dry-run", action="store_true", help="통계만 출력하고 파일은 쓰지 않음")
    args = parser.parse_args()

    raw = args.input.read_text(encoding="utf-8")
    data = json.loads(raw)
    if not isinstance(data, list):
        print("입력은 JSON 배열이어야 합니다.", file=sys.stderr)
        sys.exit(1)

    repaired = [
        normalize_undefined_strings(fix_title_empty_misplaced_in_source(repair_record(r)))
        for r in data
    ]

    swap_titles_left = sum(1 for r in repaired if r.get("lectureTitle") in SWAP_TITLES)
    bad_source_left = sum(
        1
        for r in repaired
        if isinstance(r.get("lectureSource"), str)
        and r["lectureSource"].strip() not in CANONICAL_LECTURE_SOURCES
    )
    dur_suspect = sum(
        1 for r in repaired if isinstance(r.get("durationDays"), int) and r["durationDays"] >= 1000
    )
    num_inst = sum(
        1
        for r in repaired
        if isinstance(r.get("instructors"), list)
        and r["instructors"]
        and all(isinstance(x, str) and x.isdigit() for x in r["instructors"])
    )

    print(f"records: {len(repaired)}")
    print(f"still label-as-title (needs manual check): {swap_titles_left}")
    print(f"non-canonical lectureSource remaining: {bad_source_left}")
    print(f"durationDays>=1000 remaining: {dur_suspect}")
    print(f"numeric-only instructors remaining: {num_inst}")

    if args.dry_run:
        return

    args.output.write_text(
        json.dumps(repaired, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"written: {args.output}")


if __name__ == "__main__":
    main()
