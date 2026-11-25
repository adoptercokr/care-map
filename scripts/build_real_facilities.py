"""
국민건강보험공단 공식 파일데이터(XLSX + CSV) 기반 전국 장기요양기관 실데이터 빌더
- facilities_status.xlsx (일반현황, 입소인원, 인력현황)
- eval_results.csv (정기/수시 평가등급, 점수, 설립주체)
- 대한민국 법정동(시도/시군구/읍면동) 실제 중심좌표(data/korea_regions.json) 매핑
"""
import csv
import hashlib
import json
import math
import urllib.request
from pathlib import Path

import openpyxl

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
REGIONS_FILE = BASE_DIR / "data" / "korea_regions.json"
OUT_FILE = BASE_DIR / "public" / "data" / "facilities.json"

REGIONS_URL = "https://raw.githubusercontent.com/swuhalee/korea-regions-with-coords/main/korea-regions-with-coords.json"


SIDO_AREA_CODE = {
    "서울": "02", "부산": "051", "대구": "053", "인천": "032",
    "광주": "062", "대전": "042", "울산": "052", "세종": "044",
    "경기": "031", "강원": "033", "충북": "043", "충남": "041",
    "전북": "063", "전남": "061", "경북": "054", "경남": "055", "제주": "064",
}


def normalize_tel(raw_tel: str, sido: str) -> str:
    t = (raw_tel or "").strip()
    if not t:
        return ""
    if t.startswith("0") or t.startswith("15") or t.startswith("16") or t.startswith("18"):
        return t
    area = SIDO_AREA_CODE.get(sido, "")
    return f"{area}-{t}" if area else t


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


def map_ownership(raw: str, name: str = "") -> str:
    if raw and ("지자체" in raw or "지방자치" in raw or "공립" in raw or "국공립" in raw):
        return "국공립"
    if any(k in name for k in ("국립", "시립", "도립", "군립", "구립", "서울특별시립", "건강보험공단")):
        return "국공립"
    if raw and "법인" in raw:
        return "법인사업자"
    if any(k in name for k in ("의료법인", "사회복지법인", "재단법인", "(의)", "(재)", "(사)")):
        return "법인사업자"
    return "개인사업자"


def classify_type(tcode: str, tname: str, name: str) -> tuple[str, str, int]:
    if tcode.startswith("A") or tcode == "S41" or "요양시설" in tname or "공동생활가정" in tname or "요양원" in name:
        return "nursing", "요양원", 1
    if tcode in ("B03", "C03") or "주야간" in tname or "주간보호" in name:
        return "daycare", "주간보호", 2
    if tcode in ("B01", "C01", "B02", "C02", "B04", "C04", "B05", "C05") or "방문" in tname:
        return "homecare", "집간병·방문요양", 3
    return "nursing", "요양원", 4


def deterministic_jitter(code: str) -> tuple[float, float]:
    # 사각 바둑판 격자 방지를 위해 원형(극좌표) 분포 사용
    h = int(hashlib.md5(code.encode("utf-8")).hexdigest()[:12], 16)
    angle = ((h % 3600) / 3600.0) * 2.0 * math.pi
    radius = math.sqrt(((h >> 12) % 1000) / 1000.0) * 0.0035
    dlat = radius * math.sin(angle)
    dlng = radius * math.cos(angle) * 1.25
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
                "ownership": map_ownership(row.get("설립주체", ""), row.get("장기요양기관명", "")),
            }

    wb = openpyxl.load_workbook(RAW_DIR / "facilities_status.xlsx", read_only=True)

    cap_map: dict[str, dict] = {}
    for i, r in enumerate(wb["입소인원"].iter_rows(values_only=True)):
        if i == 0 or not r[0]:
            continue
        code = str(r[0]).strip()
        tcode = str(r[1] or "").strip()
        tname = str(r[2] or "").strip()
        cap = int(r[3]) if isinstance(r[3], (int, float)) else None
        cur = int(r[4]) if len(r) > 4 and isinstance(r[4], (int, float)) else None
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
        def iv(idx):
            return int(r[idx] or 0) if len(r) > idx and isinstance(r[idx], (int, float)) else 0
        sw = iv(5)
        doc_f = iv(6)
        doc_p = iv(7)
        rn = iv(8)
        na = iv(9)
        pt = iv(11)
        ot = iv(12)
        care = iv(13)
        nut = iv(14)
        total_score = care + rn + na + sw + pt + doc_f + doc_p

        parts = []
        if care: parts.append(f"요양보호사 {care}명")
        if rn: parts.append(f"간호사 {rn}명")
        if na: parts.append(f"간호조무사 {na}명")
        if sw: parts.append(f"사회복지사 {sw}명")
        if pt: parts.append(f"물리치료사 {pt}명")
        if ot: parts.append(f"작업치료사 {ot}명")
        if doc_f or doc_p: parts.append(f"의사 {doc_f + doc_p}명")
        if nut: parts.append(f"영양사 {nut}명")
        detail_str = " · ".join(parts)

        prev = staff_map.get(code)
        if not prev or total_score > prev["score"]:
            staff_map[code] = {
                "care": care,
                "nurse": rn + na,
                "detail": detail_str,
                "score": total_score,
            }

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
            cap, cur = None, None

        dlat, dlng = deterministic_jitter(code)
        st = staff_map.get(code, {"care": 0, "nurse": 0, "detail": ""})
        grade = ev["grade"] if ev else "NEW"
        score = ev["score"] if ev else None
        eval_year = ev["evalYear"] if ev else ""
        ownership = ev["ownership"] if ev else map_ownership("", name)

        addr = str(r[9] or area_str).strip()
        est = str(r[7] or "").strip()
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
            "staffCare": st["care"],
            "staffNurse": st["nurse"],
            "staffDetail": st.get("detail", ""),
            "established": est_fmt,
            "tags": [ftype_name, ownership],
        })

    # 4. 건강보험심사평가원 요양병원 적정성 평가(1~5등급) 로드
    hosp_eval_map: dict[str, str] = {}
    hosp_eval_file = RAW_DIR / "hira" / "hospital_eval.xlsx"
    if hosp_eval_file.exists():
        wb_ev = openpyxl.load_workbook(hosp_eval_file, read_only=True)
        ws_ev = wb_ev.active
        for i, r in enumerate(ws_ev.iter_rows(values_only=True)):
            if i == 0 or not r[1]:
                continue
            hname = str(r[1]).replace(" ", "").strip()
            hgrade_raw = str(r[3] or "").strip()
            htel = str(r[5] or "").strip()
            g = hgrade_raw[0] if hgrade_raw and hgrade_raw[0] in ("1", "2", "3", "4", "5") else "NEW"
            if g != "NEW":
                if htel:
                    hosp_eval_map[htel] = g
                hosp_eval_map[hname] = g

    # 5. 건강보험심사평가원 전국 요양병원(전화번호·정밀좌표·실제 병상수·직종별 의사수·적정성 평가등급 포함) 병합
    beds_map: dict[str, dict] = {}
    beds_file = RAW_DIR / "hira" / "facility_beds.csv"
    if beds_file.exists():
        with open(beds_file, "r", encoding="cp949", errors="replace") as f:
            for row in csv.DictReader(f):
                if "요양병원" not in (row.get("종별코드명") or ""):
                    continue
                key = (row.get("암호화요양기호") or "").strip()
                def bi(col):
                    try: return int(float(row.get(col) or 0))
                    except ValueError: return 0
                total_beds = (
                    bi("일반입원실상급병상수")
                    + bi("일반입원실일반병상수")
                    + bi("성인중환자병상수")
                    + bi("격리병실병상수")
                )
                beds_map[key] = {
                    "beds": total_beds if total_beds > 0 else None,
                    "owner": (row.get("설립구분코드명") or "").strip(),
                }

    hira_file = RAW_DIR / "hira" / "hospitals.csv"
    hira_added = 0
    if hira_file.exists():
        with open(hira_file, "r", encoding="cp949", errors="replace") as f:
            for row in csv.DictReader(f):
                if "요양병원" not in (row.get("종별코드명") or ""):
                    continue
                key = (row.get("암호화요양기호") or "").strip()
                name = (row.get("요양기관명") or "").strip()
                addr = (row.get("주소") or "").strip()
                tel = (row.get("전화번호") or "").strip()
                try:
                    lng = float(row.get("좌표(X)") or 0)
                    lat = float(row.get("좌표(Y)") or 0)
                except ValueError:
                    lng, lat = 0.0, 0.0
                if not name or lat < 32 or lng < 124:
                    continue
                sido = short_sido((row.get("시도코드명") or "").strip())
                tel = normalize_tel(tel, sido)
                sigungu = (row.get("시군구코드명") or "").strip()
                est_raw = (row.get("개설일자") or "").strip()
                est_fmt = f"{est_raw[:4]}-{est_raw[4:6]}-{est_raw[6:8]}" if len(est_raw) >= 8 else est_raw

                def hi(col):
                    try: return int(float(row.get(col) or 0))
                    except ValueError: return 0
                docs = hi("총의사수")
                md_spec = hi("의과전문의 인원수")
                md_gen = hi("의과일반의 인원수")
                km_spec = hi("한방전문의 인원수")
                km_gen = hi("한방일반의 인원수")
                dn_total = hi("치과전문의 인원수") + hi("치과일반의 인원수")
                d_parts = []
                if md_spec: d_parts.append(f"의과전문의 {md_spec}명")
                if md_gen: d_parts.append(f"의과일반의 {md_gen}명")
                if km_spec or km_gen: d_parts.append(f"한의사 {km_spec + km_gen}명")
                if dn_total: d_parts.append(f"치과의사 {dn_total}명")
                doc_detail = " · ".join(d_parts) if d_parts else (f"총 의사 {docs}명" if docs else "")

                binfo = beds_map.get(key, {})
                h_grade = hosp_eval_map.get(tel) or hosp_eval_map.get(name.replace(" ", "")) or "NEW"
                facilities.append({
                    "id": f"HIRA-{hira_added+1:05d}",
                    "name": name,
                    "type": "hospital",
                    "typeName": "요양병원",
                    "ownership": map_ownership(binfo.get("owner", ""), name),
                    "grade": h_grade,
                    "score": None,
                    "evalYear": "2023" if h_grade != "NEW" else "",
                    "addr": addr,
                    "sido": sido,
                    "sigungu": sigungu,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "tel": tel,
                    "capacity": binfo.get("beds"),
                    "staffCare": 0,
                    "staffNurse": docs,
                    "staffDetail": doc_detail,
                    "established": est_fmt,
                    "tags": ["요양병원", "심평원등록"],
                })
                hira_added += 1

    # 6. 보건복지부 노인주거복지시설(실버타운: 노인복지주택 + 양로시설) 병합
    welfare_file = RAW_DIR / "welfare_facilities.csv"
    silver_added = 0
    if welfare_file.exists():
        import re
        with open(welfare_file, "r", encoding="cp949", errors="replace") as f:
            for row in csv.DictReader(f):
                kind = (row.get("시설종류") or "").strip()
                if kind not in ("노인복지주택", "양로시설"):
                    continue
                name = (row.get("시설명") or "").strip()
                addr = (row.get("시설주소") or "").strip()
                if not name or not addr:
                    continue
                aparts = addr.split()
                if len(aparts) < 2:
                    continue
                sido = short_sido(aparts[0])
                sigungu = aparts[1]
                # 괄호 안 법정동 추출 (예: "(평창동)")
                m = re.search(r"\(([^)]+)\)", addr)
                dong_in_paren = m.group(1).split(",")[0].strip() if m else ""
                coords = (
                    (dong_map.get(f"{sido} {sigungu} {dong_in_paren}") if dong_in_paren else None)
                    or sigungu_map.get(f"{sido} {aparts[1]} {aparts[2]}" if len(aparts) >= 3 else "")
                    or sigungu_map.get(f"{sido} {sigungu}")
                )
                if not coords:
                    continue
                dlat, dlng = deterministic_jitter(f"SLV-{silver_added}-{name}")
                facilities.append({
                    "id": f"SLV-{silver_added+1:05d}",
                    "name": name,
                    "type": "silvertown",
                    "typeName": "실버타운·양로원",
                    "ownership": map_ownership("", name),
                    "grade": "NEW",
                    "score": None,
                    "evalYear": "",
                    "addr": addr,
                    "sido": sido,
                    "sigungu": sigungu,
                    "lat": round(coords[0] + dlat, 6),
                    "lng": round(coords[1] + dlng, 6),
                    "tel": "",
                    "capacity": None,
                    "staffCare": 0,
                    "staffNurse": 0,
                    "staffDetail": kind,
                    "established": "",
                    "tags": ["실버타운", kind],
                })
                silver_added += 1

    # 우선순위 정렬: 1) 국공립(정부·지자체) 2) 요양병원 3) 요양원/주간보호/실버타운 4) 기타
    grade_rank = {"1": 0, "A": 0, "2": 1, "B": 1, "3": 2, "C": 2, "4": 3, "D": 3, "5": 4, "E": 4, "NEW": 5}
    type_rank = {"hospital": 1, "nursing": 2, "daycare": 3, "silvertown": 4, "homecare": 5}
    facilities.sort(
        key=lambda x: (
            0 if x["ownership"] == "국공립" else 1,
            type_rank.get(x["type"], 5),
            grade_rank.get(x["grade"], 5),
            -(x["score"] or 0),
        )
    )

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(facilities, f, ensure_ascii=False, separators=(",", ":"))

    print(f"[DONE] Saved {len(facilities)} real facilities (HIRA hospitals={hira_added}, silvertowns={silver_added}, unmatched={unmatched}) -> {OUT_FILE}")


if __name__ == "__main__":
    main()
