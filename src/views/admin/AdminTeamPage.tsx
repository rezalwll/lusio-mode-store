"use client";

import { Edit3, KeyRound, Plus, Search, ShieldCheck, UserCheck, UserRoundCog, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { createAdminMemberAction, resetAdminMemberPasswordAction, revokeAdminMemberSessionsAction, updateAdminMemberAction } from "@/server/actions/admin-team";
import type { AdminTeamMember } from "@/server/admin-team/queries";
import type { AdminRole, AdminSessionUser } from "@/server/auth/admin-session";

const roleLabels: Record<AdminRole, string> = { owner: "مالک", admin: "مدیر", staff: "کارمند", editor: "ویرایشگر" };
const allRoles = Object.entries(roleLabels) as [AdminRole, string][];
const emptyForm = { name: "", email: "", role: "staff" as AdminRole, active: true, password: "" };

export function AdminTeamPage({ members, currentUser }: { members: AdminTeamMember[]; currentUser: AdminSessionUser }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminTeamMember | "new" | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminTeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newPassword, setNewPassword] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return members.filter((member) => !term || `${member.name} ${member.email} ${roleLabels[member.role]}`.toLowerCase().includes(term));
  }, [members, query]);

  function openCreate() { setEditing("new"); setForm(emptyForm); }
  function openEdit(member: AdminTeamMember) { setEditing(member); setForm({ name: member.name, email: member.email, role: member.role, active: member.active, password: "" }); }

  async function save(event: FormEvent) {
    event.preventDefault();
    const result = editing === "new"
      ? await createAdminMemberAction({ name: form.name, email: form.email, role: form.role, password: form.password })
      : editing ? await updateAdminMemberAction({ id: editing.id, name: form.name, email: form.email, role: form.role, active: form.active }) : null;
    if (!result) return;
    if (!result.ok) return toast.error(result.message);
    setEditing(null);
    toast.success(editing === "new" ? "عضو جدید تیم ساخته شد" : "اطلاعات عضو تیم ذخیره شد");
    router.refresh();
  }

  async function toggle(member: AdminTeamMember) {
    if (member.id === currentUser.id) return toast.error("وضعیت حساب فعلی از این صفحه قابل تغییر نیست");
    if (!window.confirm(member.active ? "این حساب غیرفعال و همه نشست‌هایش لغو شود؟" : "این حساب دوباره فعال شود؟")) return;
    const result = await updateAdminMemberAction({ ...member, active: !member.active });
    if (!result.ok) return toast.error(result.message);
    toast.success(member.active ? "حساب غیرفعال شد" : "حساب فعال شد");
    router.refresh();
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (!passwordTarget) return;
    const result = await resetAdminMemberPasswordAction({ id: passwordTarget.id, password: newPassword });
    if (!result.ok) return toast.error(result.message);
    setPasswordTarget(null); setNewPassword("");
    toast.success(`رمز عبور تغییر کرد و ${result.revoked ?? 0} نشست لغو شد`);
    router.refresh();
  }

  async function revoke(member: AdminTeamMember) {
    if (!window.confirm("همه نشست‌های فعال این مدیر لغو شوند؟")) return;
    const result = await revokeAdminMemberSessionsAction({ id: member.id });
    if (!result.ok) return toast.error(result.message);
    toast.success(`${result.revoked ?? 0} نشست لغو شد`);
    router.refresh();
  }

  const canEdit = (member: AdminTeamMember) => currentUser.role === "owner" || (member.role !== "owner" && member.role !== "admin");
  const allowedRoles = currentUser.role === "owner" ? allRoles : allRoles.filter(([role]) => role === "staff" || role === "editor");

  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold text-brand">امنیت و دسترسی</p><h1 className="mt-1 text-2xl font-black">مدیریت تیم</h1><p className="mt-1.5 text-[10px] text-muted">حساب‌های مدیریتی، نقش‌ها، رمز عبور و نشست‌های فعال را کنترل کنید.</p></div><Button onClick={openCreate}><Plus className="size-4" />عضو جدید</Button></div>
    <section className="grid gap-3 sm:grid-cols-3">{[[UserRoundCog, "اعضای تیم", members.length, "bg-blue-50 text-blue-700"], [UserCheck, "حساب فعال", members.filter((item) => item.active).length, "bg-emerald-50 text-emerald-700"], [ShieldCheck, "نشست فعال", members.reduce((sum, item) => sum + item.activeSessions, 0), "bg-violet-50 text-violet-700"]].map(([Icon, label, value, tone]) => { const I = Icon as typeof UserRoundCog; return <article key={String(label)} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><I className="size-5" /></span><div><strong className="text-sm font-black">{String(value)}</strong><p className="mt-1 text-[9px] text-muted">{String(label)}</p></div></article>; })}</section>
    <section className="overflow-hidden rounded-2xl border border-black/5 bg-white"><div className="border-b border-border p-4"><div className="relative max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، ایمیل یا نقش..." className="bg-stone-50 pr-10" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3">عضو تیم</th><th className="px-3 py-3">نقش</th><th className="px-3 py-3">آخرین ورود</th><th className="px-3 py-3">تاریخ ساخت</th><th className="px-3 py-3">نشست‌ها</th><th className="px-3 py-3">وضعیت</th><th className="px-5 py-3">عملیات</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((member) => <tr key={member.id} className="hover:bg-stone-50/70"><td className="px-5 py-3"><strong className="block text-[10px]">{member.name}{member.id === currentUser.id && <span className="mr-2 text-brand">(شما)</span>}</strong><span className="mt-1 block text-[8px] text-muted" dir="ltr">{member.email}</span></td><td className="px-3 py-3 font-bold">{roleLabels[member.role]}</td><td className="px-3 py-3">{member.lastLoginAt ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(member.lastLoginAt)) : "—"}</td><td className="px-3 py-3">{new Intl.DateTimeFormat("fa-IR").format(new Date(member.createdAt))}</td><td className="px-3 py-3 font-bold">{member.activeSessions}</td><td className="px-3 py-3"><button type="button" onClick={() => toggle(member)} disabled={!canEdit(member) || member.id === currentUser.id} className={`rounded-full px-2.5 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-50 ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{member.active ? "فعال" : "غیرفعال"}</button></td><td className="px-5 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" disabled={!canEdit(member)} onClick={() => openEdit(member)} aria-label="ویرایش"><Edit3 className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8" disabled={!canEdit(member) || member.id === currentUser.id} onClick={() => { setPasswordTarget(member); setNewPassword(""); }} aria-label="بازنشانی رمز"><KeyRound className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8" disabled={!canEdit(member) || member.id === currentUser.id || member.activeSessions === 0} onClick={() => revoke(member)} aria-label="لغو نشست‌ها"><WifiOff className="size-3.5" /></Button></div></td></tr>)}</tbody></table></div>{!filtered.length && <p className="py-14 text-center text-[10px] text-muted">عضوی پیدا نشد.</p>}</section>

    <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "ساخت عضو جدید" : "ویرایش عضو تیم"}><form onSubmit={save}><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><Field label="نام"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="ایمیل"><Input type="email" dir="ltr" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="نقش"><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })} disabled={editing !== "new" && editing?.id === currentUser.id} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-xs disabled:opacity-50">{allowedRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>{editing === "new" && <Field label="رمز عبور اولیه" hint="حداقل ۱۲ کاراکتر و غیرآزمایشی"><Input type="password" dir="ltr" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /></Field>}{editing !== "new" && editing && <label className="flex items-center gap-2 self-end rounded-xl border border-border px-3 py-3 text-[10px]"><input type="checkbox" checked={form.active} disabled={editing.id === currentUser.id} onChange={(event) => setForm({ ...form, active: event.target.checked })} />حساب فعال باشد</label>}</div><div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" onClick={() => setEditing(null)}>انصراف</Button><Button type="submit">ذخیره</Button></div></form></Modal>
    <Modal open={Boolean(passwordTarget)} onClose={() => setPasswordTarget(null)} title={`بازنشانی رمز ${passwordTarget?.name ?? "مدیر"}`} description="با ذخیره رمز جدید، همه نشست‌های این حساب لغو می‌شوند."><form onSubmit={resetPassword}><div className="p-5 sm:p-6"><Field label="رمز عبور جدید" hint="حداقل ۱۲ کاراکتر؛ رمزهای آزمایشی پذیرفته نمی‌شوند"><Input type="password" dir="ltr" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></Field></div><div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" onClick={() => setPasswordTarget(null)}>انصراف</Button><Button type="submit"><KeyRound className="size-4" />تغییر رمز و لغو نشست‌ها</Button></div></form></Modal>
  </div>;
}
