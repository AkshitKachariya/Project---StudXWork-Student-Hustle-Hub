import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ArrowRight, Star, Zap, BookOpen, MessageCircle, Wallet, Shield } from 'lucide-react';
import Logo from '../components/shared/Logo';

const features = [
  { icon: Zap,          title: 'Mini Tasks',       desc: 'Quick gigs to earn fast. Browse hundreds of micro-tasks posted by companies.',     color: 'bg-brand-accent' },
  { icon: Star,         title: 'Jobs & Internships',desc: 'Part-time, full-time & internship opportunities tailored for students.',           color: 'bg-brand-primary text-white' },
  { icon: BookOpen,     title: 'Notes Marketplace', desc: 'Buy & sell academic notes. Earn from your knowledge.',                            color: 'bg-brand-secondary text-white' },
  { icon: MessageCircle,title: 'Real-time Chat',    desc: 'Direct messaging with recruiters and peers. Stay connected.',                     color: 'bg-brand-success text-white' },
  { icon: Wallet,       title: 'Wallet & Earnings', desc: 'Track your earnings, withdraw to UPI/bank, get paid instantly.',                  color: 'bg-brand-warning text-white' },
  { icon: Shield,       title: 'Verified Platform', desc: 'OTP verified accounts, secure payments, and admin moderation for safety.',        color: 'bg-brand-dark text-white' },
];

const ticker = ['Mini Tasks', 'Internships', 'Part-Time Jobs', 'Notes Marketplace', 'Real-time Chat', 'Wallet & Earnings', 'Ratings & Reviews'];

export default function Home() {
  const heroRef = useRef(null);

  useEffect(() => {
    document.title = 'StudXWork';
    gsap.fromTo('.hero-text', { opacity: 0, y: 60 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' });
    gsap.fromTo('.hero-badge', { opacity: 0, scale: 0.8, rotation: -10 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.6, delay: 0.4, ease: 'back.out(1.7)' });
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-bg border-b-3 border-brand-dark flex items-center justify-between px-6 py-4">
        <Logo showTagline />
        <div className="hidden md:flex items-center gap-8 font-semibold">
          <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
          <a href="#how" className="hover:text-brand-primary transition-colors">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="neo-btn-white px-4 py-2 text-sm">Login</Link>
          <Link to="/register" className="neo-btn-primary px-4 py-2 text-sm">Get Started <ArrowRight size={14} /></Link>
        </div>
      </nav>

      {/* Ticker */}
      <div className="bg-brand-dark text-white py-2 overflow-hidden border-b-3 border-brand-dark">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="mx-8 font-bold uppercase tracking-widest text-sm">★ {t}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="container mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <div className="hero-badge inline-block bg-brand-accent border-3 border-brand-dark px-4 py-2 font-bold text-sm mb-6 shadow-neo -rotate-3">
            🚀 The #1 Platform for Students
          </div>
          <h1 className="hero-text text-5xl md:text-7xl font-black uppercase leading-none mb-4">
            Earn While<br />You Learn
          </h1>
          <p className="hero-text text-xl md:text-2xl font-semibold mb-4 text-brand-muted">
            Mini Tasks • Internships • Notes • Chat
          </p>
          <p className="hero-text text-base text-brand-muted mb-8 max-w-md">
            StudXWork connects students with real earning opportunities. Complete tasks, get hired for internships, sell notes, and grow your career.
          </p>
          <div className="hero-text flex flex-wrap gap-4">
            <Link to="/register" className="neo-btn-primary text-lg px-7 py-3">
              Join as Student <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=recruiter" className="neo-btn-white text-lg px-7 py-3">
              Hire Students
            </Link>
          </div>
          <div className="hero-text flex items-center gap-6 mt-8 text-sm font-semibold">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brand-success inline-block" /> 1000+ Active Students</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brand-secondary inline-block" /> 500+ Companies</span>
          </div>
        </div>

        <motion.div className="flex-1 grid grid-cols-2 gap-4 max-w-md" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          {[
            { label: 'Mini Tasks Posted', value: '2,400+', color: 'bg-brand-primary text-white' },
            { label: 'Students Earning', value: '1,200+', color: 'bg-brand-accent' },
            { label: 'Notes Shared', value: '5,000+', color: 'bg-brand-secondary text-white' },
            { label: 'Total Paid Out', value: '₹48L+', color: 'bg-brand-dark text-white' },
          ].map((s) => (
            <div key={s.label} className={`neo-card p-6 ${s.color}`}>
              <div className="text-3xl font-black">{s.value}</div>
              <div className="text-sm font-semibold mt-1 opacity-80">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-y-3 border-brand-dark py-20">
        <div className="container mx-auto px-6">
          <h2 className="page-title text-center mb-4">Everything You Need</h2>
          <p className="text-center text-brand-muted font-medium mb-12">One platform. Infinite opportunities.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <motion.div key={title} whileHover={{ y: -4 }} className={`neo-card p-6 ${color}`}>
                <div className="w-12 h-12 bg-white/20 border-3 border-current flex items-center justify-center mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="opacity-80 font-medium text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="container mx-auto px-6 py-20">
        <h2 className="page-title text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Sign Up & Verify', desc: 'Create account, verify email with OTP. Secure from day one.' },
            { step: '02', title: 'Apply or Post', desc: 'Students apply to tasks/jobs. Recruiters post opportunities in minutes.' },
            { step: '03', title: 'Earn & Grow', desc: 'Complete work, get paid to wallet. Withdraw anytime via UPI or bank.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="neo-card p-8 text-center">
              <div className="text-6xl font-black text-brand-primary/20 mb-4">{step}</div>
              <h3 className="text-2xl font-bold mb-3">{title}</h3>
              <p className="text-brand-muted font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark text-white border-t-3 border-brand-dark py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-6">Ready to Start?</h2>
          <p className="text-white/70 text-xl mb-8">Join thousands of students earning while they learn.</p>
          <Link to="/register" className="neo-btn bg-brand-accent text-brand-dark text-xl px-10 py-4">
            Create Free Account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-bg border-t-3 border-brand-dark px-6 py-8 text-center font-medium text-brand-muted">
        © 2024 StudXWork. Built for students, by students. All rights reserved.
      </footer>
    </div>
  );
}
