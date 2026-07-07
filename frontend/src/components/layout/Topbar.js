import { useAuth } from "../../context/AuthContext";

const Topbar = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur border-b border-white/5 px-8 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Welcome, {user?.name}
        </h1>

        <div className="flex items-center space-x-4">
          <img
            src="logo2.png"
            alt="ContextOS"
            className="w-10 h-15 object-contain"
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;