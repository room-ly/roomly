"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";

interface MfaSetup {
  factorId: string;
  qrCode: string;
  secret: string;
}

export default function MfaCard({
  enrolled,
  factorId,
  setup,
  code,
  setCode,
  loading,
  error,
  msg,
  onStartEnroll,
  onVerify,
  onUnenroll,
  onCancelSetup,
}: {
  enrolled: boolean;
  factorId: string | null;
  setup: MfaSetup | null;
  code: string;
  setCode: (v: string) => void;
  loading: boolean;
  error: string;
  msg: string;
  onStartEnroll: () => void;
  onVerify: () => void;
  onUnenroll: () => void;
  onCancelSetup: () => void;
}) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-4">二要素認証（MFA）</h2>

      {enrolled && !setup ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-accent-deep" />
            <span className="text-[13px] font-medium text-accent-deep">有効</span>
          </div>
          <p className="text-[12px] text-ink-3 mb-3">
            認証アプリによる二要素認証が設定されています。
          </p>
          {msg && <p className="text-[13px] text-accent-deep mb-3">{msg}</p>}
          {error && <p className="text-[13px] text-danger mb-3">{error}</p>}
          <button
            type="button"
            disabled={loading || !factorId}
            onClick={onUnenroll}
            className="flex items-center gap-1.5 text-[13px] text-danger hover:text-danger/80 transition-colors"
          >
            <ShieldOff size={14} />
            {loading ? "処理中..." : "二要素認証を無効にする"}
          </button>
        </div>
      ) : setup ? (
        <div>
          <p className="text-[13px] text-ink-2 mb-3">
            認証アプリ（Google Authenticator等）で以下のQRコードを読み取り、表示された6桁のコードを入力してください。
          </p>
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrCode} alt="MFA QRコード" className="w-48 h-48" />
          </div>
          <div className="mb-4">
            <p className="text-[11px] text-ink-3 mb-1">
              QRコードを読み取れない場合、このキーを手動入力してください:
            </p>
            <code className="block text-[12px] bg-bg-2 rounded px-3 py-2 font-mono break-all select-all">
              {setup.secret}
            </code>
          </div>
          <div className="mb-3">
            <label className="block text-[13px] font-medium text-ink-2 mb-1">認証コード</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="input w-40 text-center text-lg tracking-[0.3em]"
            />
          </div>
          {error && <p className="text-[13px] text-danger mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || code.length !== 6}
              onClick={onVerify}
              className="btn btn-primary text-[13px] disabled:opacity-50"
            >
              {loading ? "確認中..." : "有効にする"}
            </button>
            <button
              type="button"
              onClick={onCancelSetup}
              className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-[13px] hover:bg-bg-2/80 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[12px] text-ink-3 mb-3">
            二要素認証を有効にすると、ログイン時にパスワードに加えて認証アプリのコードが必要になります。
          </p>
          {msg && <p className="text-[13px] text-accent-deep mb-3">{msg}</p>}
          {error && <p className="text-[13px] text-danger mb-3">{error}</p>}
          <button
            type="button"
            disabled={loading}
            onClick={onStartEnroll}
            className="flex items-center gap-1.5 btn btn-primary text-[13px]"
          >
            <ShieldCheck size={14} />
            {loading ? "準備中..." : "二要素認証を設定する"}
          </button>
        </div>
      )}
    </div>
  );
}
