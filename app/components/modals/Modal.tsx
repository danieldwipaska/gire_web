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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-all duration-200 ${
        open ? "opacity-100 visible" : "opacity-0 pointer-events-none invisible"
      }`}
      onClick={onClose}
    >
      <div
        className="relative p-6 rounded-2xl shadow-2xl border border-slate-800 bg-[#131924] max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-bold text-slate-100 mb-4 pr-8">{title}</h2>
        {body}
      </div>
    </div>
  );
};

export default Modal;
