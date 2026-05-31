"use client";

export function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-ink-2 block mb-1">
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}

export function FieldError({
  errors,
  field,
}: {
  errors: Record<string, string[]>;
  field: string;
}) {
  if (!errors[field]) return null;
  return <p className="text-danger text-sm mt-1">{errors[field][0]}</p>;
}

export type FormErrors = Record<string, string[]>;
export type EditData = Record<string, any> | null | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
