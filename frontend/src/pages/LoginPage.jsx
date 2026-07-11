import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";

import toast from "react-hot-toast";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const { login } = useAuthStore();

  const navigate = useNavigate();

  // ==============================
  // Handle Login
  // ==============================

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await login(
        form.email,
        form.password
      );

      toast.success(
        "Welcome back 👋"
      );

      navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-gradient-to-br
        from-slate-100
        via-cyan-50
        to-blue-100
      "
    >
      {/* Background Blur Effects */}
      <div
        className="
          absolute top-0 left-0
          h-72 w-72
          rounded-full
          bg-cyan-300/30
          blur-3xl
        "
      />

      <div
        className="
          absolute bottom-0 right-0
          h-80 w-80
          rounded-full
          bg-blue-300/30
          blur-3xl
        "
      />

      {/* Main Container */}
      <div
        className="
          relative z-10
          flex min-h-screen
          items-center justify-center
          px-4
        "
      >
        <div
          className="
            grid
            w-full
            max-w-6xl
            overflow-hidden
            rounded-[36px]
            border border-white/30
            bg-white/70
            shadow-2xl
            backdrop-blur-2xl
            lg:grid-cols-2
          "
        >
          {/* Left Side */}
          <div
            className="
              hidden lg:flex
              flex-col
              justify-between
              bg-gradient-to-br
              from-cyan-500
              to-blue-700
              p-10
              text-white
            "
          >
            {/* Logo */}
            <div>
              <div
                className="
                  flex h-16 w-16
                  items-center justify-center
                  rounded-3xl
                  bg-white/20
                  backdrop-blur-md
                "
              >
                <LayoutDashboard size={32} />
              </div>

              <h1
                className="
                  mt-8
                  text-4xl
                  font-bold
                  leading-tight
                "
              >
                Manage Work.
                <br />
                Collaborate Faster.
              </h1>

              <p
                className="
                  mt-5
                  max-w-md
                  text-sm
                  leading-relaxed
                  text-white/80
                "
              >
                FlowDesk helps teams manage
                projects, track tasks, and
                collaborate in realtime with
                a beautiful modern workflow.
              </p>
            </div>

            {/* Footer */}
            <div
              className="
                rounded-3xl
                border border-white/20
                bg-white/10
                p-5
                backdrop-blur-md
              "
            >
              <p className="text-sm text-white/90">
                “FlowDesk transformed the way
                our team collaborates and
                ships products.”
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-2xl
                    bg-white/20
                    font-semibold
                  "
                >
                  AR
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Abdul Rahman
                  </p>

                  <p className="text-xs text-white/70">
                    Software Engineer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div
            className="
              flex flex-col justify-center
              px-6 py-10
              sm:px-10
            "
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div
                className="
                  mx-auto
                  flex h-16 w-16
                  items-center justify-center
                  rounded-3xl
                  bg-gradient-to-br
                  from-cyan-500
                  to-blue-600
                  text-white
                  shadow-xl
                "
              >
                <LayoutDashboard size={30} />
              </div>

              <h1
                className="
                  mt-5
                  text-3xl
                  font-bold
                  text-slate-800
                "
              >
                FlowDesk
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue
              </p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-10">
              <h2
                className="
                  text-4xl
                  font-bold
                  text-slate-800
                "
              >
                Welcome Back
              </h2>

              <p className="mt-3 text-slate-500">
                Login to access your
                workspace dashboard.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={submit}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                  "
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        email:
                          e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                    className="
                      w-full
                      rounded-2xl
                      border border-slate-200
                      bg-white
                      py-4 pl-12 pr-4
                      text-sm
                      outline-none
                      transition
                      focus:border-cyan-400
                      focus:ring-4
                      focus:ring-cyan-100
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                  "
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        password:
                          e.target.value,
                      }))
                    }
                    placeholder="Enter password"
                    className="
                      w-full
                      rounded-2xl
                      border border-slate-200
                      bg-white
                      py-4 pl-12 pr-4
                      text-sm
                      outline-none
                      transition
                      focus:border-cyan-400
                      focus:ring-4
                      focus:ring-cyan-100
                    "
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="
                    text-sm font-medium
                    text-cyan-600
                    hover:underline
                  "
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-2xl
                  bg-gradient-to-r
                  from-cyan-500
                  to-blue-600
                  px-5 py-4
                  text-sm font-semibold
                  text-white
                  shadow-xl
                  transition
                  hover:opacity-90
                  disabled:opacity-70
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In

                    <ArrowRight
                      size={18}
                    />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p
              className="
                mt-8
                text-center
                text-sm
                text-slate-500
              "
            >
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="
                  font-semibold
                  text-cyan-600
                  hover:underline
                "
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}