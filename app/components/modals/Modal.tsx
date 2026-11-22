import { X } from "lucide-react";

const Modal = ({
  open,
  onClose,
  body,
  title,
}: {
  open: boolean;
  onClose: () => void;
  body: React.ReactNode;
  title: string;
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/35 backdrop-blur-sm transition-all duration-200 ${
        open ? "opacity-100 visible" : "opacity-0 pointer-events-none invisible"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative p-6 rounded-3xl shadow-[0_24px_60px_rgba(28,28,31,0.18)] border border-line bg-card max-w-full transition-all duration-200 ${
          open ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-highlight transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-ink mb-4 pr-8 tracking-tight">{title}</h2>
        {body}
      </div>
    </div>
  );
};

export default Modal;
