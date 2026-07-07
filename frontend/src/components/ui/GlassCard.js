const GlassCard = ({ children, className = '', onClick }) => (
  <div
    className={`glass p-6 transition-all hover:bg-white/10 cursor-pointer ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);
export default GlassCard;