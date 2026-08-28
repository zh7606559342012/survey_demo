"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AuthCard } from "@/components/auth-card";

type Panel = "home" | "profile" | "chat" | "form";

export function AppShell() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<Panel>("home");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0000] text-zinc-200">
        加载中…
      </main>
    );
  }

  if (!user) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-4 text-zinc-200"
        style={{
          background:
            "radial-gradient(ellipse at center, #4a0000 0%, #140000 42%, #050000 100%)",
        }}
      >
        <AuthCard />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen text-zinc-200"
      style={{
        background:
          "radial-gradient(ellipse at center, #4a0000 0%, #140000 42%, #050000 100%)",
      }}
    >
      <header className="flex items-center justify-between border-b border-red-900/50 px-4 py-3">
        <button type="button" onClick={() => setPanel("home")} className="text-red-400">
          反差伊甸园
        </button>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => setPanel("form")}>问卷</button>
          <button type="button" onClick={() => setPanel("chat")}>聊天</button>
          <button type="button" onClick={() => setPanel("profile")}>资料</button>
        </div>
      </header>

      <section className="p-4">
        {panel === "home" && <HomePanel user={user} />}
        {panel === "form" && <FormPanel />}
        {panel === "chat" && <ChatPanel />}
        {panel === "profile" && <ProfilePanel user={user} />}
      </section>
    </main>
  );
}

function HomePanel({ user }: { user: User }) {
  const name =
    (user.user_metadata?.username as string | undefined) ||
    user.email?.split("@")[0] ||
    "用户";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl text-red-400">欢迎，{name}</h2>
      <p className="text-sm text-zinc-400">登录成功。这里之后放问卷宫格和功能入口。</p>
    </div>
  );
}

function FormPanel() {
  return <p className="text-zinc-400">问卷功能稍后放这里。</p>;
}

function ChatPanel() {
  return <p className="text-zinc-400">聊天室稍后放这里。</p>;
}

function ProfilePanel({ user }: { user: User }) {
  const supabase = createClient();
  const name =
    (user.user_metadata?.username as string | undefined) ||
    user.email?.split("@")[0] ||
    "";

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="space-y-3">
      <p>账号：{name}</p>
      <button
        type="button"
        onClick={logout}
        className="rounded-lg bg-gradient-to-r from-red-700 to-red-500 px-4 py-2 text-white"
      >
        退出登录
      </button>
    </div>
  );
}