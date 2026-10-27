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
  { search: string; soldOut: string; noMatch: string; empty: string; loadError: string; retry: string; next: string; prev: string; keepScrolling: string; endOfMenu: string }
> = {
  lo: { search: "ຄົ້ນຫາເມນູ", soldOut: "ໝົດແລ້ວ", noMatch: "ບໍ່ພົບລາຍການທີ່ກົງກັບ “{q}”", empty: "ຕອນນີ້ຍັງບໍ່ມີເມນູ", loadError: "ບໍ່ສາມາດໂຫຼດເມນູໄດ້", retry: "ລອງໃໝ່", next: "ຖັດໄປ", prev: "ກ່ອນໜ້າ", keepScrolling: "ເລື່ອນຕໍ່ເພື່ອໄປຕໍ່", endOfMenu: "ໝົດເມນູແລ້ວ" },
  en: { search: "Search the menu", soldOut: "Sold out", noMatch: "Nothing matches “{q}”.", empty: "The menu is empty for now.", loadError: "The menu couldn't be loaded.", retry: "Try again", next: "Next", prev: "Previous", keepScrolling: "Keep scrolling", endOfMenu: "That’s the whole menu" },
  zh: { search: "搜索菜单", soldOut: "已售罄", noMatch: "没有找到与“{q}”相关的内容", empty: "菜单暂时为空", loadError: "菜单加载失败", retry: "重试", next: "下一个", prev: "上一个", keepScrolling: "继续滑动", endOfMenu: "已经到底了" },
  th: { search: "ค้นหาเมนู", soldOut: "หมดแล้ว", noMatch: "ไม่พบรายการที่ตรงกับ “{q}”", empty: "ยังไม่มีเมนูในขณะนี้", loadError: "โหลดเมนูไม่สำเร็จ", retry: "ลองอีกครั้ง", next: "ถัดไป", prev: "ก่อนหน้า", keepScrolling: "เลื่อนต่อ", endOfMenu: "สุดเมนูแล้ว" },
  vi: { search: "Tìm món", soldOut: "Hết hàng", noMatch: "Không tìm thấy “{q}”", empty: "Thực đơn hiện đang trống", loadError: "Không tải được thực đơn", retry: "Thử lại", next: "Tiếp theo", prev: "Trước", keepScrolling: "Tiếp tục cuộn", endOfMenu: "Đã hết thực đơn" },
  ko: { search: "메뉴 검색", soldOut: "품절", noMatch: "“{q}”에 해당하는 항목이 없습니다", empty: "아직 메뉴가 없습니다", loadError: "메뉴를 불러오지 못했습니다", retry: "다시 시도", next: "다음", prev: "이전", keepScrolling: "계속 스크롤하세요", endOfMenu: "메뉴의 끝입니다" },
  ja: { search: "メニューを検索", soldOut: "売り切れ", noMatch: "「{q}」に一致する項目はありません", empty: "現在メニューはありません", loadError: "メニューを読み込めませんでした", retry: "再試行", next: "次へ", prev: "前へ", keepScrolling: "スクロールを続ける", endOfMenu: "メニューは以上です" },
  fr: { search: "Rechercher", soldOut: "Épuisé", noMatch: "Aucun résultat pour « {q} »", empty: "Le menu est vide pour le moment.", loadError: "Impossible de charger le menu.", retry: "Réessayer", next: "Suivant", prev: "Précédent", keepScrolling: "Continuez à faire défiler", endOfMenu: "Fin du menu" },
};
