import type { OrderStatus, PaymentStatus } from "@/types/store";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغوشده",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "پرداخت‌شده",
  pending: "در انتظار پرداخت",
  refunded: "بازگشت وجه",
};

export const orderStatusClass: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
  processing: "bg-blue-50 text-blue-700 ring-blue-600/15",
  shipped: "bg-violet-50 text-violet-700 ring-violet-600/15",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/15",
};
