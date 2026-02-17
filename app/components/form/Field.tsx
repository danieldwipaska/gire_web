// ── FIELD COMPONENT (defined outside to prevent re-mount on every keystroke) ──
const Field = ({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  right,
  hint,
  value,
  onChange,
  error,
}: any) => (
  <div>
    <label className="block text-sm text-white mb-1.5 font-semibold">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white/10 border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-400 outline-none transition-all
          ${error ? "border-red-500/60 focus:border-red-500" : "border-white/20 focus:border-purple-400"}`}
      />
      {right && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
    {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export default Field;
