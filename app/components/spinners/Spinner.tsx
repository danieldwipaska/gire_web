const Spinner = ({ size }: { size?: string | number }) => {
  const sizeClasses: Record<string, string> = {
    "1": "h-4 w-4",
    "2": "h-6 w-6",
    "3": "h-8 w-8",
    "4": "h-12 w-12",
    "5": "h-16 w-16",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
    "2xl": "h-16 w-16",
  };

  const sizeClass = sizeClasses[String(size)] || "h-8 w-8";

  return (
    <div
      className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClass}`}
      role="status"
    >
      <span className="absolute! -m-px! h-px! w-px! overflow-hidden! whitespace-nowrap! border-0! p-0! [clip:rect(0,0,0,0)]!">
        Loading...
      </span>
    </div>
  );
};

export default Spinner;
