import argparse
import json
import re
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FACILITIES_PATH = ROOT / "public" / "data" / "facilities.json"
CACHE_PATH = ROOT / "scratch" / "kakao_geocode_cache.json"
ENV_PATH = ROOT.parent / "animap" / ".env"


def load_kakao_key() -> str:
    with open(ENV_PATH, encoding="utf-8") as f:
        for line in f:
            if line.startswith("NEXT_PUBLIC_KAKAO_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("NEXT_PUBLIC_KAKAO_API_KEY not found")


def normalize_road_addr(addr: str) -> str:
    s = re.sub(r"\(.*?\)", "", addr or "").split(",")[0]
    s = re.sub(r"\s+", " ", s).strip()
    m = re.match(r"^(.+?(?:대로|로|길)\s+\d+(?:-\d+)?)\b", s)
    if m:
        return m.group(1).strip()
    return s


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--batch", type=int, default=25)
    args = parser.parse_args()

    key = load_kakao_key()
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(FACILITIES_PATH, "r", encoding="utf-8") as f:
        facilities = json.load(f)

    cache: dict[str, dict | None] = {}
    if CACHE_PATH.exists():
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            cache = json.load(f)

    queries_needed = []
    seen = set()
    for fac in facilities:
        if fac.get("type") == "hospital":
            continue
        q = normalize_road_addr(fac.get("addr", ""))
        if q and q not in cache and q not in seen:
            seen.add(q)
            queries_needed.append(q)

    if args.limit > 0:
        queries_needed = queries_needed[: args.limit]

    print(f"Total facilities: {len(facilities)} | Cached: {len(cache)} | To geocode: {len(queries_needed)}", flush=True)

    if queries_needed:
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey={key}&libraries=services"></script></head>
<body>
<script>
const geocoder = new kakao.maps.services.Geocoder();
function geocodeOne(addr) {{
  return new Promise((resolve) => {{
    geocoder.addressSearch(addr, (result, status) => {{
      if (status === kakao.maps.services.Status.OK && result && result.length > 0) {{
        resolve({{ addr, ok: true, lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) }});
      }} else {{
        resolve({{ addr, ok: false, status }});
      }}
    }});
  }});
}}
window.geocodeBatch = async (addrs) => {{
  return await Promise.all(addrs.map(geocodeOne));
}};
</script>
</body>
</html>"""

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.route(
                "https://animap.co.kr/geo_runner",
                lambda route: route.fulfill(status=200, content_type="text/html", body=html),
            )
            page.goto("https://animap.co.kr/geo_runner", wait_until="networkidle")

            start = time.time()
            done = 0
            matched = 0
            total = len(queries_needed)

            for i in range(0, total, args.batch):
                chunk = queries_needed[i : i + args.batch]
                results = page.evaluate("window.geocodeBatch", chunk)
                for item in results:
                    q = item["addr"]
                    done += 1
                    if item.get("ok"):
                        lat = item["lat"]
                        lng = item["lng"]
                        if 33.0 <= lat <= 38.7 and 124.5 <= lng <= 132.0:
                            cache[q] = {"lat": round(lat, 6), "lng": round(lng, 6)}
                            matched += 1
                        else:
                            cache[q] = None
                    else:
                        cache[q] = None

                if done % 500 == 0 or done == total:
                    with open(CACHE_PATH, "w", encoding="utf-8") as f:
                        json.dump(cache, f, ensure_ascii=False)
                    elapsed = time.time() - start
                    rate = done / max(elapsed, 0.1)
                    eta = (total - done) / max(rate, 0.1)
                    print(
                        f"[{done}/{total}] matched={matched} ({matched*100/done:.1f}%) "
                        f"rate={rate:.1f}/s eta={eta/60:.1f}m",
                        flush=True,
                    )
                time.sleep(0.08)

            browser.close()

    if args.limit == 0:
        updated = 0
        unmatched = 0
        for fac in facilities:
            if fac.get("type") == "hospital":
                continue
            q = normalize_road_addr(fac.get("addr", ""))
            hit = cache.get(q)
            if hit:
                fac["lat"] = hit["lat"]
                fac["lng"] = hit["lng"]
                updated += 1
            else:
                unmatched += 1
        with open(FACILITIES_PATH, "w", encoding="utf-8") as f:
            json.dump(facilities, f, ensure_ascii=False, separators=(",", ":"))
        print(f"Updated {updated} non-hospital facilities with exact Kakao coordinates (unmatched: {unmatched}).")


if __name__ == "__main__":
    main()
