"""
국민건강보험공단 장기요양기관 공공데이터 수집 및 변환 스크립트
- 모드 1: DATA_GO_KR_API_KEY 환경변수가 있으면 공식 OpenAPI(장기요양기관 검색) 호출
- 모드 2: data/raw/*.csv 에 공공데이터포털 CSV 파일이 있으면 자동 병합(시설현황 + 평가결과)
- 모드 3: 키/CSV 미설정 시 UI·지도 즉시 검증용 전국 권역별 실제형 시드 데이터 생성

실행: python scripts/collect_care_data.py
"""
import csv
import glob
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
OUT_FILE = BASE_DIR / "public" / "data" / "facilities.json"

DATA_GO_KR_KEY = os.environ.get("DATA_GO_KR_API_KEY", "").strip()
KAKAO_REST_KEY = os.environ.get("KAKAO_REST_API_KEY", "").strip()


def geocode_kakao(address: str) -> tuple[float, float] | None:
    if not KAKAO_REST_KEY or not address:
        return None
    url = f"https://dapi.kakao.com/v2/local/search/address.json?query={urllib.parse.quote(address)}"
    req = urllib.request.Request(url, headers={"Authorization": f"KakaoAK {KAKAO_REST_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            docs = data.get("documents", [])
            if docs:
                return float(docs[0]["y"]), float(docs[0]["x"])
    except Exception:
        return None
    return None


def map_type(raw_type: str) -> tuple[str, str]:
    if "주야간" in raw_type or "주간" in raw_type:
        return "daycare", "주야간보호"
    if "방문" in raw_type:
        return "visit", "방문요양"
    return "nursing", "노인요양시설"


def map_grade(raw_grade: str) -> str:
    g = (raw_grade or "").strip().upper()
    if g in ("A", "B", "C", "D", "E"):
        return g
    if "최우수" in raw_grade:
        return "A"
    if "우수" in raw_grade:
        return "B"
    if "양호" in raw_grade:
        return "C"
    if "보통" in raw_grade:
        return "D"
    if "미흡" in raw_grade:
        return "E"
    return "NEW"


def collect_from_openapi() -> list[dict]:
    """공공데이터포털 국민건강보험공단 장기요양기관 검색 API 호출"""
    if not DATA_GO_KR_KEY:
        return []
    facilities = []
    # 주요 시도 코드 예시: 11(서울), 41(경기), 26(부산), 28(인천), 27(대구), 30(대전), 29(광주), 31(울산)
    sido_codes = ["11", "41", "26", "28", "27", "30", "29", "31", "36", "42", "43", "44", "45", "46", "47", "48", "50"]
    endpoint = "http://apis.data.go.kr/B550928/searchLtcInsttService01/getLtcInsttSeachList01"
    for sido in sido_codes:
        params = urllib.parse.urlencode({
            "serviceKey": urllib.parse.unquote(DATA_GO_KR_KEY),
            "siDoCd": sido,
            "numOfRows": 100,
            "pageNo": 1,
        })
        try:
            with urllib.request.urlopen(f"{endpoint}?{params}", timeout=10) as resp:
                body = resp.read().decode("utf-8", errors="ignore")
                if "<ltcAdminSym>" not in body:
                    continue
                # 간단 XML 파싱 (표준 라이브러리 xml.etree.ElementTree 사용)
                import xml.etree.ElementTree as ET
                root = ET.fromstring(body)
                for item in root.findall(".//item"):
                    name = (item.findtext("adminNm") or "").strip()
                    addr = (item.findtext("roadNmAddr") or item.findtext("siDoNm") or "").strip()
                    sym = (item.findtext("ltcAdminSym") or "").strip()
                    kind = (item.findtext("longTermAdminSym") or "노인요양시설").strip()
                    coords = geocode_kakao(addr)
                    if not coords:
                        continue
                    ftype, ftype_name = map_type(kind)
                    facilities.append({
                        "id": sym or f"api-{len(facilities)+1}",
                        "name": name,
                        "type": ftype,
                        "typeName": ftype_name,
                        "grade": "NEW",
                        "score": None,
                        "evalYear": "2024",
                        "addr": addr,
                        "sido": (item.findtext("siDoNm") or "")[:2],
                        "sigungu": (item.findtext("siGunGuNm") or "").strip(),
                        "lat": coords[0],
                        "lng": coords[1],
                        "tel": (item.findtext("telNo") or "").strip(),
                        "capacity": int(item.findtext("totPer") or 30),
                        "current": int(item.findtext("curPer") or 26),
                        "waiting": 0,
                        "staffCare": 12,
                        "staffNurse": 2,
                        "mealCost": 330000,
                        "room1Cost": 450000,
                        "room2Cost": 200000,
                        "monthlyBaseEstimate": 780000,
                        "established": (item.findtext("longTermPermsnDt") or "2018-01-01"),
                        "tags": [ftype_name],
                    })
        except Exception as e:
            print(f"[OpenAPI] sido={sido} skipped: {e}")
    return facilities


def collect_from_csv() -> list[dict]:
    """공공데이터포털 CSV (장기요양기관 시설별 현황 + 평가결과) 병합"""
    csv_files = glob.glob(str(RAW_DIR / "*.csv"))
    if not csv_files:
        return []
    eval_map: dict[str, dict] = {}
    facilities: list[dict] = []

    for fpath in csv_files:
        if "평가" in os.path.basename(fpath):
            with open(fpath, "r", encoding="utf-8-sig", errors="replace") as f:
                for row in csv.DictReader(f):
                    sym = (row.get("장기요양기관기호") or row.get("기관기호") or "").strip()
                    if sym:
                        eval_map[sym] = {
                            "grade": map_grade(row.get("평가등급", "")),
                            "score": float(row["평가총점"]) if row.get("평가총점") else None,
                            "evalYear": (row.get("평가일자") or "2024")[:4],
                        }

    for fpath in csv_files:
        if "평가" in os.path.basename(fpath):
            continue
        with open(fpath, "r", encoding="utf-8-sig", errors="replace") as f:
            for idx, row in enumerate(csv.DictReader(f)):
                sym = (row.get("장기요양기관기호") or row.get("기관기호") or f"csv-{idx}").strip()
                name = (row.get("기관명") or row.get("장기요양기관명") or "").strip()
                addr = (row.get("도로명주소") or row.get("주소") or "").strip()
                if not name or not addr:
                    continue
                lat = row.get("위도") or row.get("Y좌표")
                lng = row.get("경도") or row.get("X좌표")
                if lat and lng:
                    coords = (float(lat), float(lng))
                else:
                    coords = geocode_kakao(addr)
                if not coords:
                    continue
                ftype, ftype_name = map_type(row.get("급여종류", "노인요양시설"))
                ev = eval_map.get(sym, {"grade": "NEW", "score": None, "evalYear": "2024"})
                cap = int(row.get("정원") or 30)
                cur = int(row.get("현원") or 25)
                facilities.append({
                    "id": sym,
                    "name": name,
                    "type": ftype,
                    "typeName": ftype_name,
                    "grade": ev["grade"],
                    "score": ev["score"],
                    "evalYear": ev["evalYear"],
                    "addr": addr,
                    "sido": addr.split()[0][:2] if addr else "서울",
                    "sigungu": addr.split()[1] if len(addr.split()) > 1 else "",
                    "lat": coords[0],
                    "lng": coords[1],
                    "tel": (row.get("전화번호") or "").strip(),
                    "capacity": cap,
                    "current": cur,
                    "waiting": max(0, cur - cap + 2) if cur >= cap else 0,
                    "staffCare": int(row.get("요양보호사") or max(4, cur // 2)),
                    "staffNurse": int(row.get("간호사") or max(1, cur // 15)),
                    "mealCost": 330000 if ftype == "nursing" else 140000,
                    "room1Cost": 450000 if ftype == "nursing" else 0,
                    "room2Cost": 200000 if ftype == "nursing" else 0,
                    "monthlyBaseEstimate": 780000 if ftype == "nursing" else 310000,
                    "established": (row.get("지정일자") or "2019-01-01"),
                    "tags": [f"평가 {ev['grade']}등급" if ev["grade"] != "NEW" else "신설기관", ftype_name],
                })
    return facilities


def build_seed_data() -> list[dict]:
    """API 키/CSV 미연동 시 즉시 지도·필터·비교함 검증용 전국 권역별 정밀 시드 데이터"""
    regions = [
        ("서울", "강남구", 37.4979, 127.0276, "서울특별시 강남구 테헤란로 312"),
        ("서울", "송파구", 37.5145, 127.1059, "서울특별시 송파구 올림픽로 295"),
        ("서울", "마포구", 37.5663, 126.9019, "서울특별시 마포구 월드컵북로 120"),
        ("서울", "노원구", 37.6542, 127.0568, "서울특별시 노원구 동일로 1350"),
        ("서울", "강서구", 37.5509, 126.8495, "서울특별시 강서구 화곡로 210"),
        ("서울", "영등포구", 37.5264, 126.8963, "서울특별시 영등포구 국회대로 612"),
        ("경기", "분당구", 37.3827, 127.1189, "경기도 성남시 분당구 정자로 105"),
        ("경기", "수원시", 37.2636, 127.0286, "경기도 수원시 팔달구 효원로 241"),
        ("경기", "용인시", 37.2411, 127.1775, "경기도 용인시 처인구 중부대로 1199"),
        ("경기", "고양시", 37.6584, 126.8320, "경기도 고양시 덕양구 화정로 52"),
        ("경기", "부천시", 37.5034, 126.7660, "경기도 부천시 원미구 길주로 210"),
        ("경기", "남양주시", 37.6360, 127.2165, "경기도 남양주시 경춘로 1037"),
        ("인천", "연수구", 37.4102, 126.6782, "인천광역시 연수구 컨벤시아대로 165"),
        ("인천", "남동구", 37.4472, 126.7315, "인천광역시 남동구 인주대로 593"),
        ("부산", "해운대구", 35.1631, 129.1636, "부산광역시 해운대구 좌동순환로 433"),
        ("부산", "부산진구", 35.1628, 129.0531, "부산광역시 부산진구 중앙대로 702"),
        ("대구", "수성구", 35.8581, 128.6306, "대구광역시 수성구 달구벌대로 2450"),
        ("대전", "유성구", 36.3622, 127.3561, "대전광역시 유성구 대학로 99"),
        ("광주", "서구", 35.1520, 126.8895, "광주광역시 서구 상무중앙로 78"),
        ("울산", "남구", 35.5446, 129.3301, "울산광역시 남구 삼산로 231"),
        ("세종", "세종시", 36.4800, 127.2890, "세종특별자치시 한누리대로 2130"),
        ("강원", "춘천시", 37.8813, 127.7298, "강원특별자치도 춘천시 중앙로 120"),
        ("충남", "천안시", 36.8151, 127.1139, "충청남도 천안시 서북구 번영로 156"),
        ("전북", "전주시", 35.8242, 127.1480, "전북특별자치도 전주시 완산구 기린대로 213"),
        ("경남", "창원시", 35.2280, 128.6811, "경상남도 창원시 성산구 중앙대로 151"),
        ("제주", "제주시", 33.4996, 126.5312, "제주특별자치도 제주시 연삼로 473"),
    ]

    templates = [
        ("효사랑", "nursing", "요양원", "A", 94.5, 48, 45, 0, 22, 4, 330000, 450000, 220000, 795000, ["치매전담실", "물리치료", "CCTV운영"]),
        ("한마음", "hospital", "요양병원", "A", 91.8, 120, 108, 0, 38, 18, 360000, 900000, 450000, 1150000, ["전문의상주", "재활치료실", "인공신장"]),
        ("햇살", "daycare", "주간보호", "A", 93.1, 35, 31, 0, 11, 2, 145000, 0, 0, 312000, ["송영차량", "인지프로그램", "족욕실"]),
        ("더편안", "silvertown", "실버타운", "B", 88.4, 80, 74, 3, 14, 4, 480000, 0, 0, 1850000, ["식사제공", "피트니스", "응급호출"]),
        ("케어플러스", "hospcare", "병원간병", "A", 92.0, 60, 50, 0, 42, 2, 0, 0, 0, 130000, ["24시간간병", "배상책임보험"]),
        ("다솜", "homecare", "집간병·방문요양", "B", 87.6, 50, 42, 0, 28, 1, 0, 0, 0, 185000, ["방문목욕", "치매전문교육"]),
    ]

    result = []
    idx = 1
    for r_idx, (sido, sigungu, lat, lng, base_addr) in enumerate(regions):
        for t_idx, (prefix, ftype, ftype_name, grade, score, cap, cur, wait, care, nurse, meal, r1, r2, est, tags) in enumerate(templates):
            if (r_idx + t_idx) % 2 == 1 and t_idx >= 3:
                continue
            d_lat = ((t_idx - 2) * 0.008) + ((r_idx % 3 - 1) * 0.004)
            d_lng = ((t_idx % 3 - 1) * 0.009) - ((r_idx % 2) * 0.004)
            actual_grade = grade if (r_idx + t_idx) % 7 != 0 else ("NEW" if t_idx == 2 else "C")
            actual_score = score if actual_grade != "NEW" else None
            if actual_grade == "C":
                actual_score = 76.4
            suffix = "센터" if ftype in ("daycare", "hospcare", "homecare") else ""
            ownership = "공립" if (idx % 5 == 0 and ftype in ("nursing", "daycare", "hospital")) else ("법인" if idx % 2 == 0 else "개인")
            result.append({
                "id": f"21100{idx:05d}",
                "name": f"{sigungu} {prefix} {ftype_name.split('·')[0]}{suffix}",
                "type": ftype,
                "typeName": ftype_name,
                "ownership": ownership,
                "grade": actual_grade,
                "score": actual_score,
                "evalYear": "2024",
                "addr": f"{base_addr} {10 + t_idx * 17}",
                "sido": sido,
                "sigungu": sigungu,
                "lat": round(lat + d_lat, 6),
                "lng": round(lng + d_lng, 6),
                "tel": f"02-555-{1000 + idx:04d}" if sido == "서울" else f"031-777-{1000 + idx:04d}",
                "capacity": cap,
                "current": cur,
                "waiting": wait,
                "staffCare": care,
                "staffNurse": nurse,
                "mealCost": meal,
                "room1Cost": r1,
                "room2Cost": r2,
                "monthlyBaseEstimate": est,
                "established": f"{2016 + (idx % 8)}-0{(idx % 9) + 1}-15",
                "tags": tags,
            })
            idx += 1
    return result


def main():
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    data = collect_from_openapi()
    source = "OpenAPI (국민건강보험공단)"
    if not data:
        data = collect_from_csv()
        source = "CSV (공공데이터포털)"
    if not data:
        data = build_seed_data()
        source = "Seed (전국 권역별 표준 스키마)"

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] {source} -> {len(data)}개 장기요양기관 저장 완료: {OUT_FILE}")


if __name__ == "__main__":
    main()
