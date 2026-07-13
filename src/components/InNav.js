"use client";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import Link from "next/link";
import "./InNav.css";
import gsap from "gsap";
import CustomEase from "gsap/CustomEase";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import WhiteLogo from "./white-logo";

gsap.registerPlugin(MorphSVGPlugin);

const NAV_GROUPS = [
  {
    title: "Models",
    items: ["New Faces", "Development", "Established", "Mainboard"],
  },
  {
    title: "Talents",
    items: ["Actor", "Dancer", "Make Up Artist", "Hair Stylist"],
  },
  {
    title: "Creatives",
    items: ["Fashion Stylist", "Artist", "Photographer", "Creative Director"],
  },
];

const InNav = ({ searchOpen = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const isInitializedRef = useRef(false);
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(CustomEase);
    CustomEase.create(
      "hop",
      "M0,0 C0.354,0 0.464,0.133 0.498,0.502 0.532,0.872 0.651,1 1,1"
    );
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const groups = menu.querySelectorAll(".nav-group");
      const items = menu.querySelectorAll(".nav-item");
      const meta = menu.querySelectorAll(".meta-line");

      gsap.set(menu, {
        clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
      });
      gsap.set(groups, { y: 30, opacity: 0 });
      gsap.set(items, { y: 20, opacity: 0 });
      gsap.set(meta, { y: 20, opacity: 0 });
      gsap.set(".nav-wordmark span", { y: 200, rotateX: 60, opacity: 0 });

      gsap.set("#dbear2, #bbear2, #mbear2", { visibility: "hidden" });

      isInitializedRef.current = true;
    }
  }, []);

  const animateMenu = useCallback((open) => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const groups = menu.querySelectorAll(".nav-group");
    const items = menu.querySelectorAll(".nav-item");
    const meta = menu.querySelectorAll(".meta-line");

    setIsAnimating(true);

    if (open) {
      gsap.to(menu, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        ease: "power4.inOut",
        duration: 0.9,
        onStart: () => {
          menu.style.pointerEvents = "all";
        },
        onComplete: () => setIsAnimating(false),
      });

      gsap.to(groups, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        delay: 0.5,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.to(items, {
        y: 0,
        opacity: 1,
        stagger: 0.03,
        delay: 0.55,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.to(meta, {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        delay: 0.7,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.to(".nav-wordmark span", {
        y: 0,
        rotateX: 0,
        opacity: 1,
        stagger: 0.04,
        delay: 0.6,
        duration: 1.1,
        ease: "power4.out",
      });
    } else {
      gsap.to(menu, {
        clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
        ease: "power4.inOut",
        duration: 0.7,
        onComplete: () => {
          menu.style.pointerEvents = "none";
          gsap.set(menu, {
            clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
          });
          gsap.set(groups, { y: 30, opacity: 0 });
          gsap.set(items, { y: 20, opacity: 0 });
          gsap.set(meta, { y: 20, opacity: 0 });
          gsap.set(".nav-wordmark span", { y: 200, rotateX: 60, opacity: 0 });
          setIsAnimating(false);
        },
      });
    }
  }, []);

  useEffect(() => {
    if (isInitializedRef.current) {
      animateMenu(isOpen);
    }
  }, [isOpen, animateMenu]);

  const toggleMenu = useCallback(() => {
    if (!isAnimating) {
      setIsOpen((prev) => {
        const next = !prev;
        if (next) {
          gsap.to("#dbear", {
            duration: 0.4,
            morphSVG: "#dbear2",
            ease: "power2.inOut",
          });
          gsap.to("#bbear", {
            duration: 0.4,
            morphSVG: "#bbear2",
            ease: "power2.inOut",
          });
        } else {
          gsap.to("#dbear", { duration: 0.4, morphSVG: 0, ease: "power2.inOut" });
          gsap.to("#bbear", { duration: 0.4, morphSVG: 0, ease: "power2.inOut" });
        }
        return next;
      });
    }
  }, [isAnimating]);

  const splitWord = (text) =>
    text
      .split("")
      .map((char, i) =>
        char === " " ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span key={i}>{char}</span>
        )
      );

  return (
    <div>
      <div
        className="menu-icon"
        onClick={toggleMenu}
        ref={svgRef}
        style={{
          transform: searchOpen ? "translateX(-64px)" : "translateX(0px)",
          pointerEvents: searchOpen ? "none" : "auto",
          // Slides out with the panel immediately; slides back in starting
          // ~2/3 into the close morph (~0.46s total), on a longer, softer run.
          transition: searchOpen
            ? "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)"
            : "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1) 0.3s",
        }}
      >
        {/* viewBox cropped to the lines' bounding box so the glyph sits
            dead-center in the 46×46 wrapper */}
        <svg
          id="menu-svg"
          width="28.79"
          height="14.5"
          viewBox="5 10.5 28.79 14.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="Group 177">
            <g id="Group 168">
              <g id="Frame 168">
                <line id="dbear" x1="6.25" y1="11.75" x2="32.5357" y2="11.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line id="mbear" x1="10.4286" y1="17.75" x2="28.3572" y2="17.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line id="bbear" x1="14.1428" y1="23.75" x2="24.6428" y2="23.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <g id="Frame 190">
                <line id="dbear2" x1="14.1428" y1="11.75" x2="24.6428" y2="11.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line id="mbear2" x1="10.4286" y1="17.75" x2="28.3572" y2="17.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line id="bbear2" x1="6.2478" y1="23.75" x2="32.5378" y2="23.75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
      </div>

      <div className="menu" ref={menuRef}>
        <div className="menu-inner">
          {/* Top bar */}
          <div className="menu-topbar">
            <span className="menu-eyebrow">Index — Candor 2025</span>
          </div>

          {/* Categories */}
          <div className="menu-grid">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="nav-group">
                <h3 className="nav-group-title">{group.title}</h3>
                <ul className="nav-list">
                  {group.items.map((item) => (
                    <li key={item} className="nav-item">
                      <Link href="/">
                        <span className="nav-item-arrow">→</span>
                        <span className="nav-item-label">{item}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Meta — contact + socials */}
          <div className="menu-meta">
            <div className="meta-col">
              <span className="meta-line meta-eyebrow">Contact</span>
              <span className="meta-line">contact@candor.com</span>
              <span className="meta-line">modelboard@candor.com</span>
              <span className="meta-line">+234 814 350 8163</span>
            </div>
            <div className="meta-col">
              <span className="meta-line meta-eyebrow">Studios</span>
              <span className="meta-line">Lagos, Nigeria</span>
              <span className="meta-line">Manchester, UK</span>
              <span className="meta-line">Dallas, USA</span>
            </div>
            <div className="meta-col">
              <span className="meta-line meta-eyebrow">Follow</span>
              <span className="meta-line">Instagram</span>
              <span className="meta-line">LinkedIn</span>
              <span className="meta-line">Twitter</span>
            </div>
          </div>

          {/* Wordmark */}
          <div className="nav-wordmark">{splitWord("CANDOR")}</div>
        </div>
      </div>
    </div>
  );
};

export default InNav;
