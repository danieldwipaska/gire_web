const Button = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <>
      <button
        className={`px-4 py-2 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    </>
  );
};

export default Button;
