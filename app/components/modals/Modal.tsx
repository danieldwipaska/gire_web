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
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all duration-200 ${open ? "opacity-100 visible" : "opacity-0 pointer-events-none invisible"}`}
        onClick={onClose}
      >
        <div
          className="p-6 rounded-lg shadow-lg backdrop-blur-xl bg-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="absolute top-1 right-3 text-lg" onClick={onClose}>
            x
          </button>
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          {body}
        </div>
      </div>
    </>
  );
};

export default Modal;
