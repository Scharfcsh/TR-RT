import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  let navigate = useNavigate();
  const routeChangeLogin = () => {
    let path = `/login`;
    navigate(path);
  };
  const routeChangeSignUp = () => {
    let path = `/register`;
    navigate(path);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
      <div className="text-center">
        <div className="mb-8 ">
          <h1 className="text-6xl font-bold text-white mb-2">Welcome to WebRTC Room</h1>
          <p className="text-xl text-purple-200">Your journey begins here</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={routeChangeLogin}
            className="bg-white text-purple-600 font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-purple-100 transform hover:-translate-y-1 transition-all duration-300"
          >
            Login
          </button>
          <button
            onClick={routeChangeSignUp}
            className="bg-purple-800 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-purple-700 transform hover:-translate-y-1 transition-all duration-300"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
