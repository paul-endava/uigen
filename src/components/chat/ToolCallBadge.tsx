import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  isDone: boolean;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const path = typeof args.path === "string" ? args.path : null;
  const filename = path ? path.split("/").filter(Boolean).pop() ?? path : null;

  if (toolName === "str_replace_editor" && typeof args.command === "string") {
    switch (args.command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace":
      case "insert":
        return filename ? `Editing ${filename}` : "Editing file";
      case "view":
        return filename ? `Reading ${filename}` : "Reading file";
      case "undo_edit":
        return filename ? `Undoing edit in ${filename}` : "Undoing edit";
    }
  }

  if (toolName === "file_manager" && typeof args.command === "string") {
    switch (args.command) {
      case "rename": {
        const newPath = typeof args.new_path === "string" ? args.new_path : null;
        const newFilename = newPath
          ? newPath.split("/").filter(Boolean).pop() ?? newPath
          : null;
        return filename && newFilename
          ? `Renaming ${filename} → ${newFilename}`
          : "Renaming file";
      }
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting file";
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, isDone }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
