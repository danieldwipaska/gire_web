const Button = ({
  children,
  className,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <>
      <button
        className={`px-4 py-2 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </>
  );
};

export default Button;
