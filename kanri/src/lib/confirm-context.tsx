"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import PromptDialog from "@/components/PromptDialog";

// window.confirm / window.alert / window.prompt をアプリ標準の中央モーダルに統一するための仕組み。
// useConfirm() … Promise<boolean> を返す確認ダイアログ
// useNotify()  … OKのみの通知ダイアログ（旧 window.alert）
// usePrompt()  … Promise<string|null> を返す入力ダイアログ（旧 window.prompt）

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  // danger: 削除など破壊的操作 / neutral: 設定変更など穏当な操作
  variant?: "danger" | "neutral";
}

interface PromptOptions {
  title: string;
  message?: string;
  inputType?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
type NotifyFn = (options: { title: string; message?: string }) => void;
type PromptFn = (options: PromptOptions) => Promise<string | null>;

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "neutral";
  // 通知（OKのみ）の場合は true。キャンセルボタンを隠す。
  notifyOnly: boolean;
}

interface PromptState {
  isOpen: boolean;
  title: string;
  message: string;
  inputType: string;
  placeholder: string;
  defaultValue: string;
  confirmLabel: string;
}

const ConfirmContext = createContext<{ confirm: ConfirmFn; notify: NotifyFn; prompt: PromptFn }>({
  confirm: async () => false,
  notify: () => {},
  prompt: async () => null,
});

const CLOSED: DialogState = {
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "OK",
  variant: "danger",
  notifyOnly: false,
};

const PROMPT_CLOSED: PromptState = {
  isOpen: false,
  title: "",
  message: "",
  inputType: "text",
  placeholder: "",
  defaultValue: "",
  confirmLabel: "OK",
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(CLOSED);
  const [promptState, setPromptState] = useState<PromptState>(PROMPT_CLOSED);
  // 解決待ちの resolve を保持する
  const resolveRef = useRef<((result: boolean) => void) | null>(null);
  const promptResolveRef = useRef<((result: string | null) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    console.log("[CONFIRM-DEBUG] settle called", { result, hasResolve: !!resolveRef.current, stack: new Error().stack });
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setState(CLOSED);
    resolve?.(result);
  }, []);

  const settlePrompt = useCallback((result: string | null) => {
    const resolve = promptResolveRef.current;
    promptResolveRef.current = null;
    setPromptState(PROMPT_CLOSED);
    resolve?.(result);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    console.log("[CONFIRM-DEBUG] confirm called", { title: options.title, stack: new Error().stack });
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
    console.log("[CONFIRM-DEBUG] notify called", { title: options.title, hadPendingResolve: !!resolveRef.current, stack: new Error().stack });
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

  const prompt = useCallback<PromptFn>((options) => {
    return new Promise<string | null>((resolve) => {
      promptResolveRef.current = resolve;
      setPromptState({
        isOpen: true,
        title: options.title,
        message: options.message ?? "",
        inputType: options.inputType ?? "text",
        placeholder: options.placeholder ?? "",
        defaultValue: options.defaultValue ?? "",
        confirmLabel: options.confirmLabel ?? "OK",
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, notify, prompt }}>
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
      <PromptDialog
        isOpen={promptState.isOpen}
        title={promptState.title}
        message={promptState.message}
        inputType={promptState.inputType}
        placeholder={promptState.placeholder}
        defaultValue={promptState.defaultValue}
        confirmLabel={promptState.confirmLabel}
        onConfirm={(value) => settlePrompt(value)}
        onCancel={() => settlePrompt(null)}
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

export function usePrompt() {
  return useContext(ConfirmContext).prompt;
}
