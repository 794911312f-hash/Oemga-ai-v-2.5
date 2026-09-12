import React, { useRef } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, FileCode } from "lucide-react";
import type { ChatAttachment } from "../../lib/omega/types";

interface AttachmentPickerProps {
  attachments: ChatAttachment[];
  onAddAttachment: (attachment: ChatAttachment) => void;
  onRemoveAttachment: (id: string) => void;
  disabled?: boolean;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const isText =
        file.type.startsWith("text/") ||
        /\.(txt|md|csv|json|js|ts|tsx|jsx|py|java|c|cpp|h|css|html|xml|log|yaml|yml)$/i.test(file.name);
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (isText) {
        const reader = new FileReader();
        reader.onload = () => {
          const textContent = reader.result as string;
          onAddAttachment({
            id,
            name: file.name,
            size: file.size,
            type: "document",
            mimeType: file.type || "text/plain",
            textContent,
          });
        };
        reader.readAsText(file);
      } else if (isImage || isPdf) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          onAddAttachment({
            id,
            name: file.name,
            size: file.size,
            type: isImage ? "image" : "document",
            mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
            base64Data,
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Generic file
        onAddAttachment({
          id,
          name: file.name,
          size: file.size,
          type: "other",
          mimeType: file.type || "application/octet-stream",
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
        accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,.js,.ts,.tsx,.py,.html,.css,.xml,.log,image/*"
      />

      {/* Attachment Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title="إرفاق ملفات أو مستندات أو صور"
        className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-40"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 px-1">
          {attachments.map((att) => {
            const isImg = att.type === "image";
            const isDoc = att.type === "document";
            const sizeKb = Math.round(att.size / 1024);

            return (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 shadow-sm"
              >
                {isImg ? (
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                ) : isDoc ? (
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                )}
                <span className="max-w-[140px] truncate font-medium">{att.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({sizeKb}KB)</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  disabled={disabled}
                  className="p-0.5 hover:text-rose-400 rounded transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
