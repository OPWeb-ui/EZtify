
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#FAF9F6] font-sans custom-scrollbar" id="eztify-public-scroller">
      <div className="w-full flex flex-col min-h-full relative">
        <div className="flex-1">
          <Outlet />
        </div>
        <div className="w-full px-6 md:px-12 pb-12">
            <div className="max-w-7xl mx-auto flex flex-col">
                <Footer />
            </div>
        </div>
      </div>
    </div>
  );
};
