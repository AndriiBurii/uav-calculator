/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "bg-blue-50",
    "text-blue-700",
    "border-blue-100",
    "bg-emerald-50",
    "text-emerald-700",
    "border-emerald-100",
    "bg-amber-50",
    "text-amber-700",
    "border-amber-100",
    "bg-purple-50",
    "text-purple-700",
    "border-purple-100",
    "bg-pink-50",
    "text-pink-700",
    "border-pink-100",
    "bg-indigo-50",
    "text-indigo-700",
    "border-indigo-100",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
