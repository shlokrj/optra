import {
  STATUS_SHORT_LABELS,
  STATUS_STYLES,
  type Status,
} from "@/lib/constants";

export default function StatusBadge({ status }: { status: Status }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {STATUS_SHORT_LABELS[status]}
    </span>
  );
}
