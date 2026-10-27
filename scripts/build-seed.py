"""Generates seed/seed.sql (sample Lao café menu). Run: python3 scripts/build-seed.py"""
import json, pathlib

def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, int):
        return str(v)
    if not isinstance(v, str):
        v = json.dumps(v, ensure_ascii=False)
    return "'" + v.replace("'", "''") + "'"

settings = dict(
    restaurant_name="Mune Café",
    tagline="ກາເຟພິເສດ ແລະ ເບເກີຣີອົບສົດ",
    currency="LAK",
    phone="+856 20 5555 0100",
    address="ຖະໜົນເສດຖາທິລາດ, ວຽງຈັນ",
    opening_hours="ທຸກມື້ 07:00 – 19:00",
    default_language="lo",
    languages=["lo", "en", "zh"],
    timezone="Asia/Vientiane",
    translations={
        "en": {"tagline": "Specialty coffee & fresh bakes", "address": "Setthathirath Road, Vientiane", "openingHours": "Daily 07:00 – 19:00"},
        "zh": {"tagline": "精品咖啡与新鲜烘焙", "address": "万象塞塔提拉路", "openingHours": "每天 07:00 – 19:00"},
    },
)

# (lo, en, zh)
categories = [
    ("ກາເຟ", "Coffee", "咖啡"),
    ("ກາເຟເຢັນ", "Iced Coffee", "冰咖啡"),
    ("ຊາ", "Tea", "茶"),
    ("ເຄື່ອງດື່ມບໍ່ມີກາເຟ", "Non-Coffee", "非咖啡饮品"),
    ("ນ້ຳປັ່ນ & ແຟຣັບເປ້", "Smoothies & Frappes", "冰沙"),
    ("ເບເກີຣີ", "Bakery", "烘焙"),
    ("ເຄັກ & ຂອງຫວານ", "Cakes & Desserts", "蛋糕与甜点"),
    ("ອາຫານເຊົ້າ & ອາຫານຫວ່າງ", "Breakfast & Snacks", "早餐与小吃"),
]

# category, price (kip), available, (lo name, lo desc), (en name, en desc), (zh name, zh desc)
items = [
    (1, 25000, True, ("ເອສເປຣສໂຊ", "ຊັອດຄູ່, ກາເຟເບລນຂອງຮ້ານ"), ("Espresso", "Double shot, house blend"), ("意式浓缩", "双份浓缩，本店拼配豆")),
    (1, 28000, True, ("ອາເມຣິກາໂນ່", "ເອສເປຣສໂຊ ກັບ ນ້ຳຮ້ອນ"), ("Americano", "Espresso with hot water"), ("美式咖啡", "浓缩咖啡加热水")),
    (1, 32000, True, ("ຄາປູຊິໂນ່", "ເອສເປຣສໂຊ, ນົມຮ້ອນ, ຟອງນົມໜາ"), ("Cappuccino", "Espresso, steamed milk, thick foam"), ("卡布奇诺", "浓缩咖啡、热牛奶、厚奶泡")),
    (1, 32000, True, ("ລາເຕ້", "ເອສເປຣສໂຊ ກັບ ນົມຮ້ອນນຸ່ມໆ"), ("Café Latte", "Espresso with silky steamed milk"), ("拿铁", "浓缩咖啡配丝滑热牛奶")),
    (1, 35000, True, ("ມອກຄ່າ", "ເອສເປຣສໂຊ, ຊັອກໂກແລັດ, ນົມຮ້ອນ"), ("Mocha", "Espresso, dark chocolate, steamed milk"), ("摩卡", "浓缩咖啡、黑巧克力、热牛奶")),
    (1, 20000, True, ("ກາເຟລາວ", "ກາເຟໂຣບັສຕ້າ ພູພຽງບໍລະເວນ ກັບ ນົມຂົ້ນ"), ("Lao Coffee", "Bolaven Plateau robusta with condensed milk"), ("老挝咖啡", "波罗芬高原罗布斯塔咖啡配炼乳")),
    (2, 30000, True, ("ອາເມຣິກາໂນ່ເຢັນ", "ເອສເປຣສໂຊ ໃສ່ນ້ຳກ້ອນ"), ("Iced Americano", "Espresso over ice"), ("冰美式", "浓缩咖啡加冰")),
    (2, 35000, True, ("ລາເຕ້ເຢັນ", "ເອສເປຣສໂຊ, ນົມສົດ, ນ້ຳກ້ອນ"), ("Iced Latte", "Espresso, cold milk, ice"), ("冰拿铁", "浓缩咖啡、冰牛奶、冰块")),
    (2, 38000, True, ("ໂຄລບຣູ", "ສະກັດເຢັນ 18 ຊົ່ວໂມງ, ນຸ່ມ ບໍ່ສົ້ມ"), ("Cold Brew", "Steeped 18 hours, smooth and low acid"), ("冷萃咖啡", "冷萃18小时，顺滑低酸")),
    (2, 42000, False, ("ໂຄລບຣູນ້ຳໝາກພ້າວ", "ໂຄລບຣູ ກັບ ນ້ຳໝາກພ້າວສົດ"), ("Coconut Cold Brew", "Cold brew with fresh coconut water"), ("椰子冷萃", "冷萃咖啡配新鲜椰子水")),
    (2, 22000, True, ("ກາເຟລາວເຢັນ", "ກາເຟລາວ, ນົມຂົ້ນ, ນ້ຳກ້ອນ"), ("Iced Lao Coffee", "Lao coffee, condensed milk, ice"), ("冰老挝咖啡", "老挝咖啡、炼乳、冰块")),
    (3, 25000, True, ("ຊາຂຽວມະລິ", "ຊາຂຽວໃບ ກິ່ນຫອມດອກມະລິ"), ("Jasmine Green Tea", "Fragrant loose-leaf green tea"), ("茉莉绿茶", "清香散装绿茶")),
    (3, 25000, True, ("ຊາດຳ", "ຊາດຳ ເສີບພ້ອມນົມ"), ("English Breakfast Tea", "Black tea, served with milk on the side"), ("英式早餐茶", "红茶，另附牛奶")),
    (3, 28000, True, ("ຊາມະນາວເຢັນ", "ຊາດຳ, ມະນາວສົດ, ນ້ຳເຜິ້ງ"), ("Iced Lemon Tea", "Black tea, fresh lime, honey"), ("冰柠檬茶", "红茶、新鲜青柠、蜂蜜")),
    (3, 28000, True, ("ຊານົມໄທ", "ຊາດຳເຂັ້ມ, ນົມຂົ້ນ, ນ້ຳກ້ອນ"), ("Thai Milk Tea", "Strong black tea, condensed milk, ice"), ("泰式奶茶", "浓红茶、炼乳、冰块")),
    (4, 38000, True, ("ມັດຊະລາເຕ້", "ມັດຊະຍີ່ປຸ່ນ, ນົມຮ້ອນ"), ("Matcha Latte", "Japanese matcha, steamed milk"), ("抹茶拿铁", "日本抹茶、热牛奶")),
    (4, 32000, True, ("ໂກໂກ້ຮ້ອນ", "ຊັອກໂກແລັດ 70%, ວິບປິ້ງຄຣີມ"), ("Hot Chocolate", "70% dark chocolate, whipped cream"), ("热巧克力", "70%黑巧克力、鲜奶油")),
    (4, 30000, True, ("ນ້ຳໝາກກ້ຽງຄັ້ນ", "ຄັ້ນສົດໃໝ່ທຸກແກ້ວ"), ("Fresh Orange Juice", "Squeezed to order"), ("鲜榨橙汁", "现点现榨")),
    (4, 25000, True, ("ໂຊດາມະນາວ", "ມະນາວສົດ, ໃບສະລະແໜ່, ໂຊດາ"), ("Lime Soda", "Fresh lime, mint, soda"), ("青柠苏打", "新鲜青柠、薄荷、苏打水")),
    (5, 35000, True, ("ໝາກມ່ວງປັ່ນ", "ໝາກມ່ວງ, ໂຢເກີດ, ນ້ຳເຜິ້ງ"), ("Mango Smoothie", "Mango, yogurt, honey"), ("芒果冰沙", "芒果、酸奶、蜂蜜")),
    (5, 38000, True, ("ເບີຣີ່ລວມປັ່ນ", "ສະຕໍເບີຣີ່, ບລູເບີຣີ່, ກ້ວຍ"), ("Mixed Berry Smoothie", "Strawberry, blueberry, banana"), ("混合莓果冰沙", "草莓、蓝莓、香蕉")),
    (5, 28000, True, ("ໝາກໂມປັ່ນ", "ໝາກໂມສົດ ປັ່ນກັບນ້ຳກ້ອນ"), ("Watermelon Shake", "Fresh watermelon blended with ice"), ("西瓜冰沙", "新鲜西瓜加冰打成")),
    (5, 40000, True, ("ຄາຣາເມວແຟຣັບເປ້", "ກາເຟປັ່ນ, ຄາຣາເມວ, ວິບປິ້ງຄຣີມ"), ("Caramel Frappe", "Blended coffee, caramel, whipped cream"), ("焦糖冰沙咖啡", "冰沙咖啡、焦糖、鲜奶油")),
    (6, 25000, True, ("ຄົວຊອງເນີຍ", "ອົບສົດໃໝ່ທຸກເຊົ້າ"), ("Butter Croissant", "Baked fresh every morning"), ("黄油可颂", "每天早上新鲜出炉")),
    (6, 32000, True, ("ຄົວຊອງອັນມອນ", "ຄຣີມອັນມອນ, ອັນມອນອົບ"), ("Almond Croissant", "Almond cream, toasted almonds"), ("杏仁可颂", "杏仁奶油、烤杏仁片")),
    (6, 30000, True, ("ຊິນນາມອນໂຣລ", "ນ້ຳຕານແດງ, ຄຣີມຊີສ"), ("Cinnamon Roll", "Brown sugar, cream cheese glaze"), ("肉桂卷", "红糖、奶油奶酪糖霜")),
    (6, 25000, False, ("ບານານາເບຣດ", "ປີ້ງ ເສີບກັບເນີຍ"), ("Banana Bread", "Toasted, with butter"), ("香蕉面包", "烤制，配黄油")),
    (7, 40000, True, ("ຊີສເຄັກ", "ອົບ, ເສີບກັບຊອດເບີຣີ່"), ("New York Cheesecake", "Baked, with berry compote"), ("纽约芝士蛋糕", "烘烤芝士蛋糕配莓果酱")),
    (7, 38000, True, ("ເຄັກຊັອກໂກແລັດ", "ຊັອກໂກແລັດເຂັ້ມຂຸ້ນ, ການາຊ"), ("Chocolate Fudge Cake", "Rich chocolate, ganache frosting"), ("巧克力蛋糕", "浓郁巧克力、甘纳许淋面")),
    (7, 42000, True, ("ທີຣາມິສຸ", "ບິສກິດຈຸ່ມເອສເປຣສໂຊ, ມາສຄາໂປເນ"), ("Tiramisu", "Espresso-soaked ladyfingers, mascarpone"), ("提拉米苏", "浓缩咖啡浸手指饼、马斯卡彭")),
    (7, 35000, True, ("ເຂົ້າໜຽວໝາກມ່ວງ", "ເຂົ້າໜຽວມູນ, ກະທິ, ໝາກມ່ວງສຸກ"), ("Mango Sticky Rice", "Sweet sticky rice, coconut cream, ripe mango"), ("芒果糯米饭", "甜糯米、椰浆、熟芒果")),
    (7, 35000, True, ("ອາຟໂຟກາໂຕ", "ໄອສະກຣີມວານິລາ ລາດເອສເປຣສໂຊ"), ("Affogato", "Vanilla gelato drowned in espresso"), ("阿芙佳朵", "香草冰淇淋淋上浓缩咖啡")),
    (8, 30000, True, ("ເຂົ້າຈີ່ປາເຕ", "ບາແກັດ, ປາເຕ, ໝູຍໍ, ຜັກດອງ"), ("Lao Baguette Sandwich", "Baguette, pâté, Lao pork sausage, pickled vegetables"), ("老挝法棍三明治", "法棍、肉酱、老挝猪肉肠、腌菜")),
    (8, 65000, True, ("ຂະໜົມປັງອາໂວກາໂດ", "ເຂົ້າຈີ່ຊາວໂດ, ອາໂວກາໂດ, ໄຂ່ດາວນ້ຳ"), ("Avocado Toast", "Sourdough, smashed avocado, poached egg"), ("牛油果吐司", "酸面包、牛油果泥、水波蛋")),
    (8, 55000, True, ("ກຣາໂນລາໂບລ", "ໂຢເກີດ, ກຣາໂນລາ, ໝາກໄມ້ຕາມລະດູ"), ("Granola Bowl", "Yogurt, granola, seasonal fruit"), ("格兰诺拉碗", "酸奶、燕麦脆、时令水果")),
    (8, 45000, True, ("ຄົວຊອງແຮມຊີສ", "ອຸ່ນຮ້ອນ, ເນີຍມັດສະຕາດ"), ("Ham & Cheese Croissant", "Warm, with mustard butter"), ("火腿芝士可颂", "温热，配芥末黄油")),
    (8, 60000, True, ("ພານີນີໄກ່ເປສໂຕ້", "ໄກ່ຍ່າງ, ຊອດເປສໂຕ້, ມອດຊາເຣລລາ"), ("Chicken Pesto Panini", "Grilled chicken, pesto, mozzarella"), ("青酱鸡肉帕尼尼", "烤鸡肉、青酱、马苏里拉")),
]

base_theme = {"primary": "#6f4e37", "background": "#faf6f1", "surface": "#ffffff", "text": "#2b211b", "headerStyle": "gradient",
              "headerColor2": "#a47551", "headerImageKey": None, "decoration": "none", "font": "sans", "corners": "rounded", "banner": {}}
seasons = [
    ("Pi Mai Lao", "04-13", "04-16", {**base_theme, "primary": "#0e7490", "headerColor2": "#f59e0b", "background": "#f0fbff", "text": "#0c2a33", "decoration": "splash", "font": "rounded",
        "banner": {"lo": "ສະບາຍດີປີໃໝ່ລາວ! 💦", "en": "Happy Lao New Year! 💦", "zh": "老挝新年快乐！💦"}}),
    ("Halloween", "10-25", "10-31", {**base_theme, "primary": "#ea580c", "headerColor2": "#7c2d12", "background": "#1c1917", "surface": "#292524", "text": "#fafaf9", "decoration": "spooky",
        "banner": {"lo": "ສຸກສັນວັນຮາໂລວີນ 🎃 ເຄື່ອງດື່ມຟັກທອງ ລົດ 10%", "en": "Happy Halloween 🎃 Pumpkin drinks 10% off", "zh": "万圣节快乐 🎃 南瓜饮品九折"}}),
    ("That Luang Festival", "11-01", "11-07", {**base_theme, "primary": "#a16207", "headerColor2": "#eab308", "background": "#fffaeb", "text": "#3a2a05", "decoration": "lotus", "font": "serif",
        "banner": {"lo": "ບຸນທາດຫຼວງ 🪷", "en": "That Luang Festival 🪷", "zh": "塔銮节 🪷"}}),
    ("Christmas", "12-15", "12-31", {**base_theme, "primary": "#b91c1c", "headerColor2": "#166534", "background": "#fdf8f6", "text": "#2a1414", "decoration": "snow", "font": "serif",
        "banner": {"lo": "ສຸກສັນວັນຄຣິສມາດ 🎄", "en": "Merry Christmas 🎄", "zh": "圣诞快乐 🎄"}}),
]

out = ["-- Sample Lao café menu (generated by scripts/build-seed.py). Safe to re-run: it clears the menu first.",
       "DELETE FROM items;", "DELETE FROM categories;", "DELETE FROM seasons;", "DELETE FROM settings;", ""]
s = settings
out.append("INSERT INTO settings (id, restaurant_name, tagline, currency, phone, address, opening_hours, default_language, languages, timezone, translations, theme) VALUES "
           f"(1, {q(s['restaurant_name'])}, {q(s['tagline'])}, {q(s['currency'])}, {q(s['phone'])}, {q(s['address'])}, {q(s['opening_hours'])}, "
           f"{q(s['default_language'])}, {q(s['languages'])}, {q(s['timezone'])}, {q(s['translations'])}, {q(base_theme)});")
out.append("")
out.append("INSERT INTO categories (id, name, sort_order, translations) VALUES")
out.append(",\n".join(f"  ({i+1}, {q(lo)}, {i}, {q({'en': {'name': en}, 'zh': {'name': zh}})})" for i, (lo, en, zh) in enumerate(categories)) + ";")
out.append("")
order = {}
rows = []
for cat, price, avail, lo, en, zh in items:
    n = order.get(cat, 0); order[cat] = n + 1
    tr = {"en": {"name": en[0], "description": en[1]}, "zh": {"name": zh[0], "description": zh[1]}}
    rows.append(f"  ({cat}, {q(lo[0])}, {q(lo[1])}, {price}, {q(avail)}, {n}, {q(tr)})")
out.append("INSERT INTO items (category_id, name, description, price, is_available, sort_order, translations) VALUES")
out.append(",\n".join(rows) + ";")
out.append("")
out.append("INSERT INTO seasons (name, start_date, end_date, is_active, theme) VALUES")
out.append(",\n".join(f"  ({q(n)}, {q(a)}, {q(b)}, 1, {q(t)})" for n, a, b, t in seasons) + ";")

pathlib.Path(__file__).resolve().parent.parent.joinpath("seed/seed.sql").write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"wrote {len(items)} items, {len(categories)} categories, {len(seasons)} seasons")
