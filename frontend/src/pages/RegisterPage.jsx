import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  User,
  Mail,
  Lock,
  AtSign,
  Loader2,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";

import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    full_name: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const { register } = useAuthStore();

  const navigate = useNavigate();

  // ==============================
  // Update Input
  // ==============================

  const update =
    (field) => (e) =>
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

  // ==============================
  // Submit Register
  // ==============================

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await register(form);

      toast.success(
        "Account created successfully 🎉"
      );

      navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Registration failed"
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
      {/* Background Glow */}
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

      {/* Main */}
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
          {/* LEFT PANEL */}
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
            {/* Top */}
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
                Build Teams.
                <br />
                Ship Faster.
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
                Join FlowDesk and manage
                projects with realtime
                collaboration, task tracking,
                analytics, and beautiful
                workflows.
              </p>
            </div>

            {/* Bottom Feature Card */}
            <div
              className="
                rounded-3xl
                border border-white/20
                bg-white/10
                p-6
                backdrop-blur-md
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-12 w-12
                    items-center justify-center
                    rounded-2xl
                    bg-white/20
                  "
                >
                  <ShieldCheck size={24} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Secure Collaboration
                  </h3>

                  <p className="text-sm text-white/70">
                    JWT authentication +
                    realtime updates
                  </p>
                </div>
              </div>

              <div
                className="
                  mt-5
                  grid grid-cols-3
                  gap-3
                "
              >
                {[
                  "Realtime",
                  "Analytics",
                  "Kanban",
                ].map((item) => (
                  <div
                    key={item}
                    className="
                      rounded-2xl
                      bg-white/10
                      px-3 py-2
                      text-center
                      text-xs font-medium
                    "
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
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
                Create your account
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
                Create Account
              </h2>

              <p className="mt-3 text-slate-500">
                Start collaborating with your
                team today.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={submit}
              className="space-y-5"
            >
              {/* Full Name */}
              <div>
                <label
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                  "
                >
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={update(
                      "full_name"
                    )}
                    placeholder="John Doe"
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

              {/* Username */}
              <div>
                <label
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                  "
                >
                  Username
                </label>

                <div className="relative">
                  <AtSign
                    size={18}
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={update(
                      "username"
                    )}
                    placeholder="abdulrahman"
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
                    onChange={update(
                      "email"
                    )}
                    placeholder="you@example.com"
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
                    minLength={8}
                    value={form.password}
                    onChange={update(
                      "password"
                    )}
                    placeholder="Minimum 8 characters"
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

                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account

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
              Already have an account?{" "}
              <Link
                to="/login"
                className="
                  font-semibold
                  text-cyan-600
                  hover:underline
                "
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}