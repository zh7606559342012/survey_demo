"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
      <main className="flex min-h-screen items-center justify-center">
        加载中…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <AuthCard />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <button type="button" onClick={() => setPanel("home")}>
          我的应用
        </button>
        <div className="flex gap-2">
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