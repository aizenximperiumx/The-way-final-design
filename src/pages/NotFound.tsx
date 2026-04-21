import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="text-center">
        <div className="text-7xl font-black text-amber-500 mb-4">404</div>
        <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
        <Link 
          to="/"
          className="bg-amber-500 text-black px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-white transition-all group mx-auto w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;