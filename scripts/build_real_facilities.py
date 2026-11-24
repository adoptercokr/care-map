"""
국민건강보험공단 공식 파일데이터(XLSX + CSV) 기반 전국 장기요양기관 실데이터 빌더
- facilities_status.xlsx (일반현황, 입소인원, 인력현황)
- eval_results.csv (정기/수시 평가등급, 점수, 설립주체)
- 대한민국 법정동(시도/시군구/읍면동) 실제 중심좌표(data/korea_regions.json) 매핑
"""
import csv
import hashlib
import json
import urllib.request
from pathlib import Path

import openpyxl

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
REGIONS_FILE = BASE_DIR / "data" / "korea_regions.json"
OUT_FILE = BASE_DIR / "public" / "data" / "facilities.json"

REGIONS_URL = "https://raw.githubusercontent.com/swuhalee/korea-regions-with-coords/main/korea-regions-with-coords.json"


def short_sido(full_sido: str) -> str:
    s = full_sido.strip()
    mapping = {
        "서울특별시": "서울", "경기도": "경기", "인천광역시": "인천",
        "부산광역시": "부산", "대구광역시": "대구", "대전광역시": "대전",
        "광주광역시": "광주", "울산광역시": "울산", "세종특별자치시": "세종",
        "강원특별자치도": "강원", "강원도": "강원",
        "충청북도": "충북", "충청남도": "충남",
        "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
        "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주",
    }
    return mapping.get(s, s[:2])


def collect_node_coords(node: dict) -> list[tuple[float, float]]:
    if "lat" in node and "lng" in node and node["lat"] and node["lng"]:
        return [(float(node["lat"]), float(node["lng"]))]
    pts = []
    for ch in node.get("children", []):
        pts.extend(collect_node_coords(ch))
    return pts


def avg_coords(pts: list[tuple[float, float]]) -> tuple[float, float] | None:
    if not pts:
        return None
    return (
        sum(p[0] for p in pts) / len(pts),
        sum(p[1] for p in pts) / len(pts),
    )


def load_region_lookup() -> tuple[dict[str, tuple[float, float]], dict[str, tuple[float, float]]]:
    if not REGIONS_FILE.exists():
        req = urllib.request.Request(REGIONS_URL, headers={"User-Agent": "CareMap/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            REGIONS_FILE.write_text(r.read().decode("utf-8"), encoding="utf-8")

    raw = json.loads(REGIONS_FILE.read_text(encoding="utf-8"))
    dong_map: dict[str, tuple[float, float]] = {}
    sigungu_map: dict[str, tuple[float, float]] = {}

    for sido_node in raw.get("sido", []):
        s_short = short_sido(sido_node["name"])
        for sg_node in sido_node.get("children", []):
            sg_name = sg_node["name"]
            sg_pts = collect_node_coords(sg_node)
            sg_center = avg_coords(sg_pts)
            if sg_center:
                sigungu_map[f"{s_short} {sg_name}"] = sg_center
                # "수원시 장안구" 같은 경우 하위 구/시 처리
                for sub_node in sg_node.get("children", []):
                    sub_name = sub_node["name"]
                    sub_pts = collect_node_coords(sub_node)
                    sub_center = avg_coords(sub_pts)
                    if sub_center:
                        dong_map[f"{s_short} {sg_name} {sub_name}"] = sub_center
                        if sub_node.get("kind") in ("gu", "si"):
                            sigungu_map[f"{s_short} {sg_name} {sub_name}"] = sub_center
                            sigungu_map[f"{s_short} {sub_name}"] = sub_center
                            for dong_node in sub_node.get("children", []):
                                d_center = avg_coords(collect_node_coords(dong_node))
                                if d_center:
                                    dong_map[f"{s_short} {sg_name} {sub_name} {dong_node['name']}"] = d_center
                                    dong_map[f"{s_short} {sub_name} {dong_node['name']}"] = d_center

    return dong_map, sigungu_map


def map_ownership(raw: str) -> str:
    if not raw:
        return "개인"
    if "지자체" in raw or "지방자치" in raw or "공립" in raw or "국공립" in raw:
        return "공립"
    if "법인" in raw:
        return "법인"
    return "개인"


def classify_type(tcode: str, tname: str, name: str) -> tuple[str, str, int]:
    if tcode.startswith("A") or tcode == "S41" or "요양시설" in tname or "공동생활가정" in tname or "요양원" in name:
        return "nursing", "요양원", 1
    if tcode in ("B03", "C03") or "주야간" in tname or "주간보호" in name:
        return "daycare", "주간보호", 2
    if tcode in ("B01", "C01", "B02", "C02", "B04", "C04", "B05", "C05") or "방문" in tname:
        return "homecare", "집간병·방문요양", 3
    return "nursing", "요양원", 4


def deterministic_jitter(code: str) -> tuple[float, float]:
    h = int(hashlib.md5(code.encode("utf-8")).hexdigest()[:8], 16)
    dlat = ((h % 1000) / 1000.0 - 0.5) * 0.005
    dlng = (((h >> 12) % 1000) / 1000.0 - 0.5) * 0.006
    return dlat, dlng


def main():
    dong_map, sigungu_map = load_region_lookup()
    print(f"[Regions] dong_map={len(dong_map)}, sigungu_map={len(sigungu_map)}")

    eval_map: dict[str, dict] = {}
    with open(RAW_DIR / "eval_results.csv", "r", encoding="cp949", errors="replace") as f:
        for row in csv.DictReader(f):
            code = (row.get("장기요양기관기호") or "").replace("-", "").strip()
            if not code:
                continue
            dt = (row.get("평가일자") or "").strip()
            prev = eval_map.get(code)
            if prev and prev["evalDate"] > dt:
                continue
            raw_grade = (row.get("평가등급") or "").strip().upper()
            grade = raw_grade if raw_grade in ("A", "B", "C", "D", "E") else "NEW"
            try:
                score = round(float(row["평가총점"]), 1) if row.get("평가총점") else None
            except ValueError:
                score = None
            eval_map[code] = {
                "grade": grade,
                "score": score,
                "evalYear": dt[:4] if dt else "2024",
                "evalDate": dt,
                "ownership": map_ownership(row.get("설립주체", "")),
            }

    wb = openpyxl.load_workbook(RAW_DIR / "facilities_status.xlsx", read_only=True)

    cap_map: dict[str, dict] = {}
    for i, r in enumerate(wb["입소인원"].iter_rows(values_only=True)):
        if i == 0 or not r[0]:
            continue
        code = str(r[0]).strip()
        tcode = str(r[1] or "").strip()
        tname = str(r[2] or "").strip()
        cap = int(r[3]) if isinstance(r[3], (int, float)) else 0
        cur = int(r[4]) if len(r) > 4 and isinstance(r[4], (int, float)) else (int(cap * 0.88) if cap > 0 else 0)
        ftype, ftype_name, prio = classify_type(tcode, tname, "")
        prev = cap_map.get(code)
        if not prev or prio < prev["prio"]:
            cap_map[code] = {
                "type": ftype,
                "typeName": ftype_name,
                "prio": prio,
                "capacity": cap,
                "current": cur,
            }

    staff_map: dict[str, dict] = {}
    for i, r in enumerate(wb["인력현황"].iter_rows(values_only=True)):
        if i == 0 or not r[0]:
            continue
        code = str(r[0]).strip()
        nurse = (int(r[8] or 0) if len(r) > 8 and isinstance(r[8], (int, float)) else 0) + (
            int(r[9] or 0) if len(r) > 9 and isinstance(r[9], (int, float)) else 0
        )
        care = int(r[13] or 0) if len(r) > 13 and isinstance(r[13], (int, float)) else 0
        prev = staff_map.get(code)
        if not prev:
            staff_map[code] = {"care": care, "nurse": nurse}
        else:
            prev["care"] = max(prev["care"], care)
            prev["nurse"] = max(prev["nurse"], nurse)

    facilities = []
    seen_codes = set()
    unmatched = 0
    for i, r in enumerate(wb["일반현황"].iter_rows(values_only=True)):
        if i == 0 or not r[0]:
            continue
        code = str(r[0]).strip()
        if code in seen_codes:
            continue
        seen_codes.add(code)

        name = str(r[1] or "").strip()
        area_str = str(r[6] or "").strip()
        parts = area_str.split()
        if not name or len(parts) < 2:
            continue

        sido = short_sido(parts[0])
        sigungu = parts[1]
        dong_key = f"{sido} " + " ".join(parts[1:])
        sg_key = f"{sido} {sigungu}"
        sg_key2 = f"{sido} {parts[1]} {parts[2]}" if len(parts) >= 3 else sg_key

        coords = dong_map.get(dong_key) or sigungu_map.get(sg_key2) or sigungu_map.get(sg_key)
        if not coords:
            unmatched += 1
            continue

        cinfo = cap_map.get(code)
        ev = eval_map.get(code)
        if cinfo:
            ftype, ftype_name = cinfo["type"], cinfo["typeName"]
            cap, cur = cinfo["capacity"], cinfo["current"]
        else:
            ftype, ftype_name, _ = classify_type("", "", name)
            cap, cur = 0, 0

        dlat, dlng = deterministic_jitter(code)
        st = staff_map.get(code, {"care": 0, "nurse": 0})
        grade = ev["grade"] if ev else "NEW"
        score = ev["score"] if ev else None
        eval_year = ev["evalYear"] if ev else "2025"
        ownership = ev["ownership"] if ev else ("공립" if ("구립" in name or "시립" in name or "군립" in name or "도립" in name) else "개인")

        if ftype == "nursing":
            meal, r1, r2, est_cost = 330000, (450000 if cap >= 25 else 0), (200000 if cap >= 20 else 0), 795000
        elif ftype == "daycare":
            meal, r1, r2, est_cost = 145000, 0, 0, 312000
        else:
            meal, r1, r2, est_cost = 0, 0, 0, 185000

        addr = str(r[9] or area_str).strip()
        est = str(r[7] or "20180101").strip()
        est_fmt = f"{est[:4]}-{est[4:6]}-{est[6:8]}" if len(est) >= 8 else est

        facilities.append({
            "id": code,
            "name": name,
            "type": ftype,
            "typeName": ftype_name,
            "ownership": ownership,
            "grade": grade,
            "score": score,
            "evalYear": eval_year,
            "addr": addr,
            "sido": sido,
            "sigungu": sigungu,
            "lat": round(coords[0] + dlat, 6),
            "lng": round(coords[1] + dlng, 6),
            "tel": "",
            "capacity": cap,
            "current": cur,
            "waiting": 0 if cap == 0 or cur < cap else 2,
            "staffCare": st["care"],
            "staffNurse": st["nurse"],
            "mealCost": meal,
            "room1Cost": r1,
            "room2Cost": r2,
            "monthlyBaseEstimate": est_cost,
            "established": est_fmt,
            "tags": [ftype_name, ownership],
        })

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(facilities, f, ensure_ascii=False, separators=(",", ":"))

    print(f"[DONE] Saved {len(facilities)} real facilities (unmatched={unmatched}) -> {OUT_FILE}")


if __name__ == "__main__":
    main()
