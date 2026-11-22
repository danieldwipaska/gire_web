const Button = ({
  children,
  className = "",
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) => {
  return (
    <button
      className={`px-4 py-2 bg-[#1C1C1F] hover:bg-[#2C2C32] active:scale-[0.98] disabled:opacity-50 text-white rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-[0_4px_14px_rgba(28,28,31,0.14)] hover:shadow-[0_6px_20px_rgba(28,28,31,0.2)] flex items-center justify-center gap-2 ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
