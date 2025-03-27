import React, { useState } from "react";
import useSignup from "../hooks/useSignup";

const Register = () => {
  const { loading, signup } = useSignup();
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    confirmpassword: "",
    gender: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  function ReloadLocation() {
    location.reload();
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    await signup(formData);
    ReloadLocation();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-4xl font-bold text-center text-purple-600 mb-6">
            Create Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullname}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="johndoe123"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmpassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label
                htmlFor="gender"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div className="mt-6">
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-300"
              >
                {loading ? "Creating..." : "Sign Up"}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-purple-50 py-4 px-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="#"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
