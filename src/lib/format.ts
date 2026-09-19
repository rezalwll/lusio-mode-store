export const toFa = (value: number | string) =>
  String(value).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);

export const formatNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export const formatToman = (value: number) => `${formatNumber(value)} تومان`;

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(value),
  );
