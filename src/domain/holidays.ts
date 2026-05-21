export type HolidayCountry = "JP" | "KR";

export interface HolidayBadge {
  country: HolidayCountry;
  name: string;
}

export interface CalendarCell {
  date?: string;
  day?: number;
  isWeekend: boolean;
  badges: HolidayBadge[];
}

const jpHolidays: Record<string, string> = {
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "国民の休日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
};

const krHolidays: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
};

export function getHolidayBadges(date: string, showKoreanHolidays: boolean): HolidayBadge[] {
  const badges: HolidayBadge[] = [];
  if (jpHolidays[date]) {
    badges.push({ country: "JP", name: jpHolidays[date] });
  }
  if (showKoreanHolidays && krHolidays[date]) {
    badges.push({ country: "KR", name: krHolidays[date] });
  }
  return badges;
}

function toDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthCells(year: number, monthIndex: number, showKoreanHolidays: boolean): CalendarCell[] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const cells: CalendarCell[] = [];

  for (let i = 0; i < first.getUTCDay(); i += 1) {
    cells.push({ isWeekend: i === 0 || i === 6, badges: [] });
  }

  for (let day = 1; day <= last.getUTCDate(); day += 1) {
    const date = toDateKey(year, monthIndex, day);
    const weekDay = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
    cells.push({
      date,
      day,
      isWeekend: weekDay === 0 || weekDay === 6,
      badges: getHolidayBadges(date, showKoreanHolidays),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ isWeekend: false, badges: [] });
  }

  return cells;
}
