"use client";

import { Sparkles, Construction, AlertCircle, CheckCircle2 } from "lucide-react";

export type WaitlistStatus = "idle" | "sending" | "done" | "error";

export default function AiWaitlistTab({
  label,
  email,
  setEmail,
  note,
  setNote,
  status,
  error,
  onSubmit,
}: {
  label: string;
  email: string;
  setEmail: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  status: WaitlistStatus;
  error: string;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-accent-tint bg-gradient-to-br from-accent-tint/40 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
              AIで独自フォーマットを変換
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                <Construction size={10} />
                近日公開予定
              </span>
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Excel・Googleスプレッドシート・他社管理ソフトからの書き出しなど、
              独自の{label}リストをAIが自動でRoomlyの形式に変換してインポートします。
              ヘッダー名・列順・表記ゆれが違っていても、そのままアップロードできるようになります。
            </p>
          </div>
        </div>
      </div>

      {status === "done" ? (
        <div className="rounded-lg bg-accent-tint p-5 text-center">
          <CheckCircle2 size={32} className="mx-auto text-accent-deep mb-2" />
          <p className="text-sm font-medium text-ink mb-1">事前登録ありがとうございます</p>
          <p className="text-xs text-ink-2">
            公開時に <strong>{email}</strong> 宛にご連絡します。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-2">
            公開時に通知を受け取りたい方はこちらからご登録ください。
            現在お使いのフォーマット例を添えていただくと、優先的に対応します。
          </p>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              通知先メールアドレス <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input w-full text-sm"
              disabled={status === "sending"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              現在お使いのフォーマット・ご要望（任意）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`例: 自社のExcel台帳をそのまま${label}リストとして使っています。列構成は…`}
              rows={4}
              className="input w-full text-sm resize-none"
              disabled={status === "sending"}
            />
          </div>
          {error && (
            <p className="text-xs text-danger flex items-center gap-1">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
          <button onClick={onSubmit} disabled={status === "sending"} className="btn btn-primary w-full">
            {status === "sending" ? (
              <>
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                送信中...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                公開時に通知を受け取る
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
