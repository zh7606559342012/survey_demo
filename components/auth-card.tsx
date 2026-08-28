"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCOUNT_RE = /^[a-zA-Z0-9]{6,20}$/;
const REMEMBER_KEY = "auth_remember";
const EMAIL_DOMAIN = "fanqiaeden.com";

type FieldErrors = {
  invite?: string;
  account?: string;
  password?: string;
  agreements?: string;
};

function toEmail(username: string) {
  return `${username.toLowerCase()}@${EMAIL_DOMAIN}`;
}

export function AuthCard() {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [inviteCode, setInviteCode] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [remember, setRemember] = useState(false);
  const [modal, setModal] = useState<"disclaimer" | "privacy" | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { account?: string; password?: string };
      setAccount(saved.account ?? "");
      setPassword(saved.password ?? "");
      setRemember(true);
    } catch {
      // ignore
    }
  }, []);

  function validate() {
    const next: FieldErrors = {};

    if (mode === "signup" && !inviteCode.trim()) {
      next.invite = "联系管理员发放一次性邀请码";
    }
    if (!account.trim() || !ACCOUNT_RE.test(account.trim())) {
      next.account = "6-20位字母数字";
    }
    if (!password || password.length < 6) {
      next.password = "至少6位";
    }
    if (!agreeTerms) {
      next.agreements = "请先同意《免责声明》与《隐私协议》";
    }
    if (mode === "signup" && !agreeAge) {
      next.agreements = "请勾选下方两项后再注册";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;

    setLoading(true);
    const username = account.trim();
    const email = toEmail(username);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        if (remember) {
          localStorage.setItem(
            REMEMBER_KEY,
            JSON.stringify({ account: username, password }),
          );
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      }

      setMessage(error ? error.message : "");
      setLoading(false);
      return;
    }

    const code = inviteCode.trim();
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("code, used")
      .eq("code", code)
      .maybeSingle();

    if (inviteError || !invite || invite.used) {
      setErrors((prev) => ({
        ...prev,
        invite: "联系管理员发放一次性邀请码",
      }));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase
        .from("invite_codes")
        .update({
          used: true,
          used_at: new Date().toISOString(),
          used_by: data.user.id,
        })
        .eq("code", code)
        .eq("used", false);
    }

    setMessage("注册成功，请直接登录");
    setMode("login");
    setInviteCode("");
    setAgreeAge(false);
    setLoading(false);
  }

  const canSubmit =
    !loading &&
    agreeTerms &&
    (mode === "login" || agreeAge);

  const inputClass =
    "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none focus:border-red-700";

  return (
    <>
      <div className="w-full max-w-md rounded-2xl border border-red-800/80 bg-black/75 p-6 text-white shadow-[0_0_40px_rgba(180,0,0,0.25)]">
        <img
          src="/logo.png"
          alt="反差伊甸园"
          className="mx-auto mb-3 h-16 w-16 rounded-lg border border-red-800 object-cover"
        />
        <h1 className="text-center text-2xl font-semibold text-red-500">
          反差伊甸园
        </h1>
        <h3 className="mt-2 text-center text-sm text-zinc-400">
          登录或注册后完善资料，即可填写问卷与留言
        </h3>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrors({});
              setMessage("");
            }}
            className={`rounded-lg py-2 text-sm ${
              mode === "login"
                ? "bg-gradient-to-r from-red-700 to-red-500 text-white shadow"
                : "text-zinc-400"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrors({});
              setMessage("");
            }}
            className={`rounded-lg py-2 text-sm ${
              mode === "signup"
                ? "bg-gradient-to-r from-red-700 to-red-500 text-white shadow"
                : "text-zinc-400"
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {mode === "signup" && (
            <div>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="联系站长(TG：@stella_cox798)领取邀请码"
                className={inputClass}
              />
              {errors.invite && (
                <p className="mt-1 text-sm text-red-400">{errors.invite}</p>
              )}
            </div>
          )}

          <div>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="账号（6-20位字母数字）"
              className={inputClass}
            />
            {errors.account && (
              <p className="mt-1 text-sm text-red-400">{errors.account}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码（至少6位）"
              className={inputClass}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2 text-sm text-zinc-300">
            {mode === "login" && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="mt-1 accent-red-600"
                />
                <span>记住账号和密码</span>
              </label>
            )}

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 accent-red-600"
              />
              <span>
                我已阅读并同意{" "}
                <button
                  type="button"
                  className="text-red-400 underline"
                  onClick={() => setModal("disclaimer")}
                >
                  《免责声明》
                </button>{" "}
                与{" "}
                <button
                  type="button"
                  className="text-red-400 underline"
                  onClick={() => setModal("privacy")}
                >
                  《隐私协议》
                </button>
              </span>
            </label>

            {mode === "signup" && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreeAge}
                  onChange={(e) => setAgreeAge(e.target.checked)}
                  className="mt-1 accent-red-600"
                />
                <span>我确认已年满 18 周岁（未满 18 岁禁止注册与使用）</span>
              </label>
            )}

            {errors.agreements && (
              <p className="text-sm text-red-400">{errors.agreements}</p>
            )}
          </div>

          {message && <p className="text-sm text-red-400">{message}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-500 py-2.5 text-white disabled:opacity-50"
          >
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册并设置资料"}
          </button>

          {mode === "login" ? (
            <p className="text-center text-xs text-zinc-500">
              没有账号？点上方「注册」
            </p>
          ) : (
            <p className="text-center text-xs text-zinc-500">
              注册后需完善姓名、性别、年龄、属性
            </p>
          )}
        </form>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-red-900/60 bg-[#140000] p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-red-400">
                {modal === "disclaimer" ? "《免责声明》" : "《隐私协议》"}
              </h2>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <p className="text-sm leading-6 text-zinc-300">
              {modal === "disclaimer"
                ? "进入、浏览、注册、登录或使用本站，即表示您已阅读并同意本声明。本站仅供内部学习交流，内容可能含成人向角色扮演，请确认已成年并自愿使用。运营方在法律允许范围内不承担责任。若不同意请立即离开。"
                : "我们可能收集账号、资料、问卷、上传与聊天内容，用于站点功能。数据可能存于本地或第三方服务。请勿上传高度敏感信息。继续使用即视为同意。"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}