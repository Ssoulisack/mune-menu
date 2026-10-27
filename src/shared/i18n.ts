// Languages the owner can enable for the public menu.
export const LANGUAGES = {
  lo: { label: "ລາວ", locale: "lo-LA" },
  en: { label: "English", locale: "en" },
  zh: { label: "中文", locale: "zh-CN" },
  th: { label: "ไทย", locale: "th-TH" },
  vi: { label: "Tiếng Việt", locale: "vi-VN" },
  ko: { label: "한국어", locale: "ko-KR" },
  ja: { label: "日本語", locale: "ja-JP" },
  fr: { label: "Français", locale: "fr-FR" },
} as const;

export type LangCode = keyof typeof LANGUAGES;
export const LANG_CODES = Object.keys(LANGUAGES) as LangCode[];
export const isLangCode = (v: string): v is LangCode => v in LANGUAGES;

/**
 * Text typed into the main fields is in the restaurant's default language;
 * other languages live in a `translations` map. Missing translations fall back to the main text.
 */
export type Translations<F extends string> = Partial<Record<string, Partial<Record<F, string>>>>;

export function translate<F extends string>(base: string | null, translations: Translations<F> | undefined, lang: string, field: F) {
  return translations?.[lang]?.[field] || base;
}

// Fixed labels on the public menu.
export const UI_STRINGS: Record<
  LangCode,
  { search: string; soldOut: string; noMatch: string; empty: string; loadError: string; retry: string; next: string; prev: string; keepScrolling: string; endOfMenu: string; layout: string; language: string; all: string; errorTitle: string; errorBody: string; notFound: string; backToMenu: string; rows: string; grid: string; column: string }
> = {
  lo: { search: "ຄົ້ນຫາເມນູ", soldOut: "ໝົດແລ້ວ", noMatch: "ບໍ່ພົບລາຍການທີ່ກົງກັບ “{q}”", empty: "ຕອນນີ້ຍັງບໍ່ມີເມນູ", loadError: "ບໍ່ສາມາດໂຫຼດເມນູໄດ້", retry: "ລອງໃໝ່", next: "ຖັດໄປ", prev: "ກ່ອນໜ້າ", keepScrolling: "ເລື່ອນຕໍ່ເພື່ອໄປຕໍ່", endOfMenu: "ໝົດເມນູແລ້ວ", layout: "ຮູບແບບ", language: "ພາສາ", all: "ທັງໝົດ", errorTitle: "ຂໍອະໄພ, ມີບາງຢ່າງຜິດພາດ", errorBody: "ກະລຸນາລອງໃໝ່ອີກຄັ້ງ. ຖ້າຍັງເປັນຢູ່, ກະລຸນາແຈ້ງພະນັກງານຂອງພວກເຮົາ.", notFound: "ບໍ່ພົບໜ້ານີ້", backToMenu: "ກັບໄປທີ່ເມນູ", rows: "ແຖວ", grid: "ຕາຕະລາງ", column: "ຄໍລຳ" },
  en: { search: "Search the menu", soldOut: "Sold out", noMatch: "Nothing matches “{q}”.", empty: "The menu is empty for now.", loadError: "The menu couldn't be loaded.", retry: "Try again", next: "Next", prev: "Previous", keepScrolling: "Keep scrolling", endOfMenu: "That’s the whole menu", layout: "Layout", language: "Language", all: "All", errorTitle: "Sorry, something went wrong", errorBody: "Please try again. If it keeps happening, let our staff know.", notFound: "This page doesn’t exist", backToMenu: "Back to the menu", rows: "Rows", grid: "Grid", column: "Column" },
  zh: { search: "搜索菜单", soldOut: "已售罄", noMatch: "没有找到与“{q}”相关的内容", empty: "菜单暂时为空", loadError: "菜单加载失败", retry: "重试", next: "下一个", prev: "上一个", keepScrolling: "继续滑动", endOfMenu: "已经到底了", layout: "布局", language: "语言", all: "全部", errorTitle: "抱歉，出了点问题", errorBody: "请重试。如果问题仍然存在，请告诉我们的工作人员。", notFound: "找不到此页面", backToMenu: "返回菜单", rows: "列表", grid: "网格", column: "大图" },
  th: { search: "ค้นหาเมนู", soldOut: "หมดแล้ว", noMatch: "ไม่พบรายการที่ตรงกับ “{q}”", empty: "ยังไม่มีเมนูในขณะนี้", loadError: "โหลดเมนูไม่สำเร็จ", retry: "ลองอีกครั้ง", next: "ถัดไป", prev: "ก่อนหน้า", keepScrolling: "เลื่อนต่อ", endOfMenu: "สุดเมนูแล้ว", layout: "รูปแบบ", language: "ภาษา", all: "ทั้งหมด", errorTitle: "ขออภัย เกิดข้อผิดพลาด", errorBody: "กรุณาลองอีกครั้ง หากยังเกิดขึ้นอยู่ โปรดแจ้งพนักงานของเรา", notFound: "ไม่พบหน้านี้", backToMenu: "กลับไปที่เมนู", rows: "แถว", grid: "ตาราง", column: "คอลัมน์" },
  vi: { search: "Tìm món", soldOut: "Hết hàng", noMatch: "Không tìm thấy “{q}”", empty: "Thực đơn hiện đang trống", loadError: "Không tải được thực đơn", retry: "Thử lại", next: "Tiếp theo", prev: "Trước", keepScrolling: "Tiếp tục cuộn", endOfMenu: "Đã hết thực đơn", layout: "Bố cục", language: "Ngôn ngữ", all: "Tất cả", errorTitle: "Xin lỗi, đã có lỗi xảy ra", errorBody: "Vui lòng thử lại. Nếu vẫn bị, hãy báo cho nhân viên của chúng tôi.", notFound: "Không tìm thấy trang này", backToMenu: "Quay lại thực đơn", rows: "Hàng", grid: "Lưới", column: "Cột" },
  ko: { search: "메뉴 검색", soldOut: "품절", noMatch: "“{q}”에 해당하는 항목이 없습니다", empty: "아직 메뉴가 없습니다", loadError: "메뉴를 불러오지 못했습니다", retry: "다시 시도", next: "다음", prev: "이전", keepScrolling: "계속 스크롤하세요", endOfMenu: "메뉴의 끝입니다", layout: "보기", language: "언어", all: "전체", errorTitle: "죄송합니다. 문제가 발생했습니다", errorBody: "다시 시도해 주세요. 계속 발생하면 직원에게 알려 주세요.", notFound: "페이지를 찾을 수 없습니다", backToMenu: "메뉴로 돌아가기", rows: "목록", grid: "격자", column: "큰 사진" },
  ja: { search: "メニューを検索", soldOut: "売り切れ", noMatch: "「{q}」に一致する項目はありません", empty: "現在メニューはありません", loadError: "メニューを読み込めませんでした", retry: "再試行", next: "次へ", prev: "前へ", keepScrolling: "スクロールを続ける", endOfMenu: "メニューは以上です", layout: "表示", language: "言語", all: "すべて", errorTitle: "申し訳ありません。問題が発生しました", errorBody: "もう一度お試しください。解決しない場合はスタッフにお知らせください。", notFound: "このページは存在しません", backToMenu: "メニューに戻る", rows: "リスト", grid: "グリッド", column: "大きな写真" },
  fr: { search: "Rechercher", soldOut: "Épuisé", noMatch: "Aucun résultat pour « {q} »", empty: "Le menu est vide pour le moment.", loadError: "Impossible de charger le menu.", retry: "Réessayer", next: "Suivant", prev: "Précédent", keepScrolling: "Continuez à faire défiler", endOfMenu: "Fin du menu", layout: "Affichage", language: "Langue", all: "Tout", errorTitle: "Désolé, un problème est survenu", errorBody: "Veuillez réessayer. Si cela continue, prévenez notre équipe.", notFound: "Cette page n’existe pas", backToMenu: "Retour au menu", rows: "Lignes", grid: "Grille", column: "Colonne" },
};
