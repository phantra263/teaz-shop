import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Download, Menu, X } from "lucide-react";
import { site } from "../data/site";
import { FacebookIcon, TikTokIcon } from "../components/icons";

const stats = [
  { num: 3, text: "Years of experience" },
  { num: 20, text: "Projects completed" },
  { num: 10, text: "Technologies used" },
  { num: 100, text: "Code commits" },
];

const socials = [
  { name: "Facebook", href: site.facebookPageUrl, icon: <FacebookIcon className="h-4 w-4" /> },
  { name: "GitHub", href: "https://github.com/phantra263", icon: <GithubIcon /> },
  { name: "TikTok", href: site.tiktokProfileUrl, icon: <TikTokIcon className="h-4 w-4" /> },
];

function GithubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"
      />
    </svg>
  );
}

export function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "TeaZ Portfolio | Trà Phan";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="profile-shell relative min-h-screen overflow-x-hidden text-white">
      <div className="profile-stars" aria-hidden="true" />
      <header className="relative z-20 px-4 py-8 xl:py-12">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <Link to="/profile" className="text-4xl font-semibold">
            Trà Phan<span className="text-[#00e187]">.</span>
          </Link>
          <nav className="hidden items-center gap-8 xl:flex" aria-label="Portfolio">
            <Link to="/profile" className="border-b-2 border-[#00ff99] font-medium text-[#00ff99]">
              Home
            </Link>
            <Link to="/" className="font-medium transition hover:text-[#00e187]">
              TeaZ Shop
            </Link>
          </nav>
          <button
            type="button"
            className="xl:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-8 w-8 text-[#00ff99]" /> : <Menu className="h-8 w-8 text-[#00ff99]" />}
          </button>
        </div>
        {menuOpen ? (
          <nav className="mt-10 flex flex-col items-center gap-6 xl:hidden" aria-label="Portfolio">
            <Link to="/profile" className="text-xl text-[#00ff99]" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/" className="text-xl" onClick={() => setMenuOpen(false)}>
              TeaZ Shop
            </Link>
          </nav>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto max-w-[1400px] px-4 pb-16">
        <section className="flex flex-col items-center justify-between xl:flex-row xl:pt-8 xl:pb-24">
          <div className="order-2 text-center xl:order-none xl:text-left">
            <span className="text-xl">Software Developer</span>
            <h1 className="mt-2 text-5xl leading-[1.1] font-semibold xl:text-[80px]">
              Hi, I&apos;m <span className="text-[#00ff99]">TeaZ</span>
            </h1>
            <p className="mx-auto mt-4 mb-9 max-w-[500px] text-[#8193b2] xl:mx-0">
              I&apos;m a frontend developer with a passion for building web applications.
            </p>
            <div className="flex flex-col items-center gap-4 xl:flex-row">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-[#00ff99] px-8 py-3 text-sm font-medium tracking-wide text-[#00ff99] uppercase transition duration-300 hover:bg-[#00ff99] hover:text-black"
              >
                <span>Download CV</span>
                <Download className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="mb-8 flex gap-6 xl:mb-0">
                {socials.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label={item.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#00ff99] text-[#00ff99] transition duration-300 hover:bg-[#00ff99] hover:text-black"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 order-1 mb-8 h-[305px] w-[305px] xl:order-none xl:mb-0 xl:h-[506px] xl:w-[506px]">
            <motion.img
              src="/profile/avatar.png"
              alt="Ảnh TeaZ"
              className="absolute inset-0 m-auto h-[298px] w-[298px] rounded-full object-contain mix-blend-lighten xl:h-[498px] xl:w-[498px]"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            />
            <motion.svg
              className="h-full w-full"
              viewBox="0 0 506 506"
              fill="transparent"
              aria-hidden="true"
            >
              <motion.circle
                cx="253"
                cy="253"
                r="250"
                stroke="#00ff99"
                strokeWidth="4"
                strokeLinecap="round"
                initial={reduceMotion ? false : { strokeDasharray: "24 10 0 0" }}
                animate={
                  reduceMotion
                    ? { strokeDasharray: "16 25 92 72" }
                    : {
                        strokeDasharray: ["15 120 25 25", "16 25 92 72", "4 250 22 22"],
                        rotate: [120, 360],
                      }
                }
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              />
            </motion.svg>
          </div>
        </section>

        <section className="pt-4 pb-12 xl:pt-0" aria-label="Thống kê">
          <div className="mx-auto flex max-w-[80vw] flex-wrap gap-6 xl:max-w-none">
            {stats.map((stat) => (
              <div key={stat.text} className="flex flex-1 items-center justify-center gap-4 xl:justify-start">
                {reduceMotion ? (
                  <span className="text-4xl font-extrabold xl:text-6xl">{stat.num}</span>
                ) : (
                  <CountUp
                    end={stat.num}
                    duration={3}
                    delay={0.4}
                    className="text-4xl font-extrabold xl:text-6xl"
                  />
                )}
                <p className={`leading-snug text-white/60 ${stat.text.length < 15 ? "max-w-[100px]" : "max-w-[150px]"}`}>
                  {stat.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
