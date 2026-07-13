"use client";
import { useState } from "react";

const ArrowOut = ({ className = "" }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4.22904 12.2711L11.7715 4.7286M11.7715 4.7286H5.17185M11.7715 4.7286V11.3283"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="min-h-screen bg-[#0C0C0C] text-white px-6 md:px-12 lg:px-16 pt-20 pb-8 flex flex-col">
      {/* Top: huge brand mark */}
      <div className="flex-1 flex flex-col justify-between gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-10 border-b border-white/10">
          {/* Newsletter */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="text-3xl md:text-4xl leading-tight font-light">
              Sign up to our <br /> newsletter
            </h2>
            <p className="text-sm text-white/60 max-w-sm">
              Get the latest news, drops and stories from the Candor roster
              straight to your inbox.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full max-w-md mt-2"
            >
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youraddress@email.com"
                className="w-full bg-transparent text-white placeholder-white/40 text-base pb-3 pr-10 border-0 border-b border-white/30 focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="absolute right-0 bottom-3 text-white hover:translate-x-0.5 transition-transform"
                aria-label="Submit email"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Sitemap */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <span className="text-xs uppercase tracking-[0.25em] text-white/40">
              Navigate
            </span>
            <ul className="flex flex-col gap-3 text-base">
              {["Home", "Models", "Talent", "Creatives", "About", "Contact"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 hover:text-white/70 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Socials */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <span className="text-xs uppercase tracking-[0.25em] text-white/40">
              Follow
            </span>
            <ul className="flex flex-col gap-3 text-base">
              {["Instagram", "LinkedIn", "Twitter", "TikTok"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1 hover:text-white/70 transition-colors"
                  >
                    {item}
                    <ArrowOut className="opacity-70" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <span className="text-xs uppercase tracking-[0.25em] text-white/40">
              Contact
            </span>
            <div className="flex flex-col gap-3 text-base">
              <a href="mailto:candor@email.com" className="hover:text-white/70">
                candor@email.com
              </a>
              <a href="tel:+2341234587890" className="hover:text-white/70">
                +234 123 458 7890
              </a>
              <button className="mt-2 px-5 py-2.5 w-fit border border-white/40 text-sm rounded-full hover:bg-white hover:text-black transition-colors">
                Get in touch
              </button>
            </div>
          </div>
        </div>

        {/* Massive wordmark */}
        <div className="flex flex-col gap-8">
          <h1 className="text-[24vw] leading-none tracking-tight font-light select-none">
            CANDOR
          </h1>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="pt-8 mt-8 border-t border-white/10 flex flex-col-reverse md:flex-row gap-4 md:items-center md:justify-between text-xs text-white/60">
        <p>© Candor 2025. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="inline-flex items-center gap-1 hover:text-white">
            Privacy Policy <ArrowOut className="opacity-70" />
          </a>
          <a href="#" className="hover:text-white underline-offset-4 hover:underline">
            FAQs
          </a>
        </div>
      </div>
    </footer>
  );
}
