"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

// window.confirm / window.alert をアプリ標準の中央モーダルに統一するための仕組み。
// useConfirm() … Promise<boolean> を返す確認ダイアログ
// useNotify()  … OKのみの通知ダイアログ（旧 window.alert）

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  // danger: 削除など破壊的操作 / neutral: 設定変更など穏当な操作
  variant?: "danger" | "neutral";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
type NotifyFn = (options: { title: string; message?: string }) => void;

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "neutral";
  // 通知（OKのみ）の場合は true。キャンセルボタンを隠す。
  notifyOnly: boolean;
}

const ConfirmContext = createContext<{ confirm: ConfirmFn; notify: NotifyFn }>({
  confirm: async () => false,
  notify: () => {},
});

const CLOSED: DialogState = {
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "OK",
  variant: "danger",
  notifyOnly: false,
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(CLOSED);
  // 解決待ちの resolve を保持する
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setState(CLOSED);
    resolve?.(result);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        title: options.title,
        message: options.message ?? "",
        confirmLabel: options.confirmLabel ?? "OK",
        variant: options.variant ?? "danger",
        notifyOnly: false,
      });
    });
  }, []);

  const notify = useCallback<NotifyFn>((options) => {
    resolveRef.current = null;
    setState({
      isOpen: true,
      title: options.title,
      message: options.message ?? "",
      confirmLabel: "OK",
      variant: "neutral",
      notifyOnly: true,
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}
      <ConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        variant={state.variant}
        hideCancel={state.notifyOnly}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}

export function useNotify() {
  return useContext(ConfirmContext).notify;
}
