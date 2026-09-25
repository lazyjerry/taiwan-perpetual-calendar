declare module 'lunar-javascript' {
  const calendar: {
    Solar: {
      fromYmd(year: number, month: number, day: number): {
        getLunar(): LunarDate;
      };
    };
  };

  interface LunarDate {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getYearShengXiao(): string;
    getJieQi(): string;
    getDayYi(): string[];
    getDayJi(): string[];
  }

  export default calendar;
}
