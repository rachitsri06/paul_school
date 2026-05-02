import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, Target, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_school-hub-495/artifacts/ud1nrved_17104.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src={SCHOOL_LOGO} alt="St. Paul's School" className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
              <div>
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>St. Paul's School</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">MAHARAJGANJ</p>
              </div>
            </div>
            <div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-900/20"
              >
                Portal Login
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 -z-10" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-50/50 rounded-l-full blur-3xl -z-10 transform translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-900 text-sm font-semibold mb-6 tracking-wide uppercase">
              Welcome to Excellence
            </span>
            <h2 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8" style={{ fontFamily: 'Manrope' }}>
              Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600">&middot; Play &middot;</span> Serve
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              Empowering the next generation through holistic education, character building, and academic excellence in the heart of Maharajganj.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex justify-center items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-blue-900/20"
              >
                Access School Portal
              </Link>
              <a
                href="#about"
                className="inline-flex justify-center items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-full text-lg font-semibold transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, title: "Modern Curriculum", desc: "Updated educational standards focusing on practical knowledge." },
              { icon: Users, title: "Expert Faculty", desc: "Dedicated and experienced teachers committed to student success." },
              { icon: Trophy, title: "Sports & Arts", desc: "Comprehensive extracurricular programs for holistic growth." },
              { icon: Target, title: "Future Ready", desc: "Equipping students with skills needed for tomorrow's challenges." }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ fontFamily: 'Manrope' }}>A Legacy of Learning</h2>
              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                St. Paul's School is more than just an educational institution; it's a community dedicated to nurturing young minds. Our comprehensive approach ensures that every student receives the attention and resources they need to thrive.
              </p>
              <ul className="space-y-4">
                {[
                  "State-of-the-art facilities and smart classrooms",
                  "Focus on moral values and character development",
                  "Regular parent-teacher interaction",
                  "Safe and secure campus environment"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <ArrowRight size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden border-8 border-slate-800 relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000&auto=format&fit=crop"
                  alt="School Campus"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={SCHOOL_LOGO} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>St. Paul's School</h3>
              </div>
              <p className="text-slate-500 text-sm">Study &middot; Play &middot; Serve</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-600 text-sm">
                  <MapPin size={16} className="text-slate-400" />
                  Maharajganj, Uttar Pradesh
                </li>
                <li className="flex items-center gap-2 text-slate-600 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-2 text-slate-600 text-sm">
                  <Mail size={16} className="text-slate-400" />
                  info@stpauls.edu
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-blue-600 hover:underline">Portal Login</Link></li>
                <li><a href="#about" className="text-slate-600 hover:text-slate-900">About Us</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Admissions</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} St. Paul's School. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
