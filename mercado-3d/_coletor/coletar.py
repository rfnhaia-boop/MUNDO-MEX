"""
Coletor de produtos reais (Open Food Facts) para o NEW Mercado.
- Busca produtos brasileiros por categoria, baixa a foto da embalagem e grava tudo em ../real-products.js
  (fotos embutidas em base64 -> a demonstração funciona offline e sem restrição de CORS).
- Fotos/dados: Open Food Facts, licença CC BY-SA 3.0 / ODbL. Mantenha o crédito.
- Preços são ESTIMADOS (a base não tem preço). No sistema final, preço e produto vêm do ERP.
Uso:  python coletar.py
"""
import base64, io, json, math, os, sys, time, urllib.request, urllib.parse
from PIL import Image

UA = "NEW-prototype/1.0 (demo de vitrine 3D)"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "real-products.js")

# tag da base, setor, formato 3D, medidas (m), preço-base estimado, quantidade
CATS = [
 # mercearia
 ("rices","mercearia","bag",{"size":[.20,.30,.085]},27.9,2),
 ("beans","mercearia","bag",{"size":[.13,.21,.06]},8.9,2),
 ("pastas","mercearia","box",{"size":[.15,.23,.04]},5.5,2),
 ("coffees","mercearia","bag",{"size":[.10,.155,.06]},19.9,2),
 ("sugars","mercearia","bag",{"size":[.13,.20,.06]},5.9,1),
 ("tomato-sauces","mercearia","can",{"r":.037,"h":.105},4.5,2),
 ("vegetable-oils","mercearia","bottle",{"r":.04,"h":.26},7.9,1),
 ("olive-oils","mercearia","wine",{"r":.036,"h":.26},29.9,1),
 ("wheat-flours","mercearia","bag",{"size":[.13,.20,.06]},5.2,1),
 # matinal
 ("breakfast-cereals","matinal","box",{"size":[.19,.30,.07]},14.9,2),
 ("biscuits","matinal","box",{"size":[.17,.10,.05]},4.9,3),
 ("cocoa-and-chocolate-powders","matinal","tub",{"r":.055,"h":.14},9.9,1),
 ("milks","matinal","carton",{"size":[.07,.235,.07]},5.8,2),
 ("condensed-milks","matinal","can",{"r":.038,"h":.10},6.9,1),
 ("breads","matinal","bag",{"size":[.28,.12,.09]},9.9,1),
 # bebidas
 ("carbonated-drinks","bebidas","bottle",{"r":.055,"h":.33},9.5,3),
 ("waters","bebidas","bottle",{"r":.045,"h":.30},3.2,1),
 ("juices-and-nectars","bebidas","carton",{"size":[.095,.235,.065]},7.4,2),
 ("beers","bebidas","can",{"r":.033,"h":.122},6.9,2),
 ("wines","bebidas","wine",{"r":.038,"h":.30},39.9,1),
]

def get(url, tries=8, binary=False):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            if binary: return data
            if data[:1] == b"{": return json.loads(data)
        except Exception as e:
            pass
        time.sleep(3 + i * 3)
    return None

def avg_color(img):
    w, h = img.size
    c = img.crop((int(w*.2), int(h*.25), int(w*.8), int(h*.75))).resize((24, 24))
    px = [p for p in c.getdata() if not (p[0] > 225 and p[1] > 225 and p[2] > 225)] or list(c.getdata())
    r = sum(p[0] for p in px)//len(px); g = sum(p[1] for p in px)//len(px); b = sum(p[2] for p in px)//len(px)
    return "#%02x%02x%02x" % (r, g, b)

def shade(hexc, k):
    r, g, b = [int(hexc[i:i+2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % (min(255, int(r*k)), min(255, int(g*k)), min(255, int(b*k)))

out, seen = [], set()
ONLY = [t for t in os.environ.get("ONLY", "").split(",") if t]   # ex.: ONLY=biscuits,milks  -> só estas categorias, somando ao arquivo atual
if ONLY and os.path.exists(OUT):
    prev = open(OUT, encoding="utf-8").read()
    out = json.loads(prev[prev.index("=") + 1:].rstrip().rstrip(";"))
    seen = {o["ean"] for o in out}
for tag, cat, kind, dims, base, n in CATS:
    if ONLY and tag not in ONLY: continue
    q = urllib.parse.urlencode({"categories_tags_en": tag, "countries_tags_en": "brazil", "page_size": 30,
                                "sort_by": "unique_scans_n", "fields": "code,product_name,brands,quantity,image_front_small_url"})
    res = get("https://world.openfoodfacts.org/api/v2/search?" + q)
    if not res or not res.get("products"):
        print("sem resultado:", tag); continue
    picked, brands = 0, {}
    for p in res["products"]:
        name = (p.get("product_name") or "").strip(); brand = (p.get("brands") or "").split(",")[0].strip()
        img = p.get("image_front_small_url"); code = p.get("code")
        if not (name and brand and img and code) or code in seen or len(name) < 4: continue
        if brands.get(brand.lower(), 0) >= 1 and picked < n and len(res["products"]) > n * 3: continue
        data = get(img.replace(".200.jpg", ".400.jpg"), tries=3, binary=True) or get(img, tries=3, binary=True)
        if not data: continue
        try:
            im = Image.open(io.BytesIO(data)).convert("RGB")
        except Exception:
            continue
        im.thumbnail((300, 300)); col = avg_color(im)
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=80)
        factor = 1 + ((int(code[-3:]) % 21) - 10) / 100 if code[-3:].isdigit() else 1
        price = math.floor(base * factor) + .9
        item = {"id": "ean" + code, "ean": code, "name": name[:44], "brand": brand, "qty": (p.get("quantity") or "").strip(),
                "cat": cat, "kind": kind, "price": price, "color": col, "accent": "#ffffff",
                "img": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()}
        item.update(dims)
        if kind in ("bottle", "wine"):
            item["liquid"] = shade(col, .55); item["cap"] = shade(col, .8)
        out.append(item); seen.add(code); brands[brand.lower()] = brands.get(brand.lower(), 0) + 1; picked += 1
        print("ok", tag, "-", brand, "|", name[:40])
        if picked >= n: break
    time.sleep(2)

js = "/* Produtos reais — fotos e dados: Open Food Facts (CC BY-SA 3.0 / ODbL). Preços estimados (demonstração). Gerado por _coletor/coletar.py */\nwindow.REAL_PRODUCTS=" + json.dumps(out, ensure_ascii=False) + ";\n"
with open(OUT, "w", encoding="utf-8") as f: f.write(js)
print("TOTAL", len(out), "produtos ->", os.path.abspath(OUT), round(len(js)/1024), "KB")
