"use client";

import Image from "next/image";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { logoUrl } from "@/lib/assets";
import { useStore } from "@/store/use-store";

export function AdminLogin() {
  const login = useStore((state) => state.loginAdmin);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!login(password)) setError("رمز عبور صحیح نیست.");
  }

  return (
    <div className="grid min-h-screen bg-[#f4f4f1] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-ink lg:block">
        <img src="https://elevenstyle.ir/wp-content/uploads/2026/09/پیراهن-کتان-مستر-2.webp" alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-14 text-white xl:p-20">
          <p className="text-xs font-bold text-white/60">ELEVEN COMMERCE</p>
          <h1 className="mt-3 max-w-xl text-5xl leading-tight font-black">همه‌چیز برای مدیریت یک فروشگاه حرفه‌ای.</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">فروش، موجودی، سفارش‌ها و مشتریان را از یک مرکز یکپارچه مدیریت کنید.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,.07)] sm:p-10">
          <span className="relative mx-auto block h-15 w-42"><Image src={logoUrl} alt="ELEVEN" fill sizes="168px" className="object-contain" /></span>
          <div className="mt-8 text-center"><span className="mx-auto grid size-13 place-items-center rounded-2xl bg-stone-100"><LockKeyhole className="size-5" /></span><h2 className="mt-4 text-2xl font-black">ورود به پنل مدیریت</h2><p className="mt-2 text-xs text-muted">برای ادامه رمز مدیریت فروشگاه را وارد کنید.</p></div>
          <form onSubmit={submit} className="mt-7">
            <label className="text-[11px] font-bold">رمز عبور</label>
            <div className="relative mt-2"><Input type={show ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} className="pl-11" dir="ltr" autoFocus /><button type="button" onClick={() => setShow((value) => !value)} className="absolute left-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted" aria-label="نمایش رمز">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
            {error && <p className="mt-2 text-[10px] font-bold text-rose-600">{error}</p>}
            <Button type="submit" size="lg" className="mt-4 w-full">ورود به مدیریت</Button>
          </form>
          <div className="mt-5 rounded-xl bg-stone-50 p-3 text-center text-[10px] text-muted"><p>رمز پیش‌فرض نسخه دمو:</p><code className="mt-1 block font-bold text-ink" dir="ltr">eleven1405</code></div>
          <p className="mt-6 flex items-center justify-center gap-2 text-[9px] text-muted"><ShieldCheck className="size-4" />ورود امن و دسترسی محدود به مدیر</p>
        </div>
      </section>
    </div>
  );
}
