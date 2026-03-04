import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';
import ProfileAvatar from './ProfileAvatar';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logoUrl = "/images/cloud369.png";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation and mount
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${scrolled ? 'bg-[#050505]/90 backdrop-blur-md border-white/10 py-3' : 'bg-transparent border-transparent py-5'
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
          </motion.div>
          <span className="text-2xl font-bold tracking-widest text-white">CLUB369</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors tracking-wide relative group">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors tracking-wide relative group">
            About US
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/manifesto" className="text-sm font-medium hover:text-primary transition-colors tracking-wide relative group">
            Why 369?
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <button onClick={() => handleAnchorClick('ventures')} className="text-sm font-medium hover:text-primary transition-colors tracking-wide relative group">
            Ventures
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </button>
          <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors tracking-wide relative group">
            Contact
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          {!isAuthenticated ? (
            <Link to="/login" className="text-sm font-bold tracking-wide hover:text-primary transition-colors">
              Login
            </Link>
          ) : (
            <ProfileAvatar />
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="material-symbols-outlined text-3xl">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050505] border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              <Link to="/" className="text-lg font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link to="/about" className="text-lg font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>About Us</Link>
              <Link to="/manifesto" className="text-lg font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Why 369?</Link>
              <button onClick={() => handleAnchorClick('ventures')} className="text-lg font-medium hover:text-primary text-left">Ventures</button>
              <Link to="/contact" className="text-lg font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Contact</Link>
              <hr className="border-white/10 my-2" />
              {!isAuthenticated ? (
                <Link to="/login" className="text-lg font-bold hover:text-primary" onClick={() => setMobileOpen(false)}>Login</Link>
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      const user = AuthService.getCurrentUser();
                      if (user?.role?.toLowerCase() === 'user' && user?.status === 'PENDING') {
                        alert("Don't have access Until you complete payment");
                        navigate('/payment');
                      } else {
                        navigate(user?.role?.toLowerCase() === 'admin' ? '/admin/profile' : '/dashboard/profile');
                      }
                      setMobileOpen(false);
                    }}
                    className="text-lg font-bold hover:text-primary text-left"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={async () => {
                      setMobileOpen(false);
                      const confirmLogout = window.confirm('Are you sure you want to logout?');
                      if (confirmLogout) {
                        await logout();
                        navigate('/login');
                      }
                    }}
                    className="text-lg font-bold text-red-400 text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;