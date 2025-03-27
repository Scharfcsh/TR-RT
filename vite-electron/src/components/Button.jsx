import React from "react";
import useLogout from "../hooks/useLogout";
import { LogOut } from "lucide-react";

const Button = () => {
  const { loading, logout } = useLogout();
  return (
    <button
      onClick={logout}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
    >
      <LogOut className="mr-2" size={18} />
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
};

export default Button;
