import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Settings, FileText, Link2, Linkedin, Info } from "lucide-react";

const Navbar = () => (
  <nav className="w-full flex items-center justify-between py-4 px-8 bg-white/80 backdrop-blur shadow-sm">
    {/* Logo o nombre del sitio */}
    <div className="flex items-center gap-2">
      <Link to="/" className="flex items-center gap-2 group">
        <img
          src="/logo.png"
          alt="Logo AInvirion"
          className="h-8 w-8 mr-1 transition-transform group-hover:scale-105"
          style={{ objectFit: "contain" }}
        />
        <span className="text-2xl font-extrabold text-gray-800 tracking-tight">AInvirion</span>
      </Link>
    </div>
    {/* Menú central */}
    <ul className="flex-1 flex justify-center gap-8 text-gray-500 font-medium text-base">
      <li>
        <Link to="/" className="flex items-center gap-2 hover:text-black transition">
          <Sparkles className="w-5 h-5" />
          Novedades
        </Link>
      </li>
      <li className="relative group">
        <button
          className="flex items-center gap-2 hover:text-black transition focus:outline-none"
        >
          <Settings className="w-5 h-5" />
          Servicios
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <ul className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-20">
          <li>
            <Link
              to="/dashboard/servicios/asistente-personal"
              className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              Asistente Personal
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/servicios/cv-comparator"
              className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              CV Comparator
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/servicios/sbom-analyzer"
              className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              SBOM Analyzer
            </Link>
          </li>
        </ul>
      </li>
      <li>
        <Link to="/quienes-somos" className="flex items-center gap-2 hover:text-black transition">
          <Info className="w-5 h-5" />
          Quiénes somos
        </Link>
      </li>
      <li>
        <Link to="/dashboard/integraciones" className="flex items-center gap-2 hover:text-black transition">
          <Link2 className="w-5 h-5" />
          Integraciones
        </Link>
      </li>
      <li>
        <a
          href="https://www.linkedin.com/company/ainvirion/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-blue-700 transition"
        >
          <Linkedin className="w-5 h-5" />
          Linkedin
        </a>
      </li>
    </ul>
    {/* Acciones a la derecha */}
    <div className="flex items-center gap-4">
      <Link to="/auth" className="text-gray-500 hover:text-black transition">Iniciar sesión</Link>
      <Link
        to="/auth/signup"
        className="text-white px-5 py-2 rounded-full font-semibold shadow transition"
        style={{ backgroundColor: "rgb(83, 218, 202)" }}
      >
        Regístrate
      </Link>
    </div>
  </nav>
);

export default Navbar;