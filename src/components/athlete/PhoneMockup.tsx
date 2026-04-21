import { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="hidden lg:flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* iPhone 15 Pro mockup frame */}
      <div className="relative">
        {/* Phone outer frame */}
        <div className="relative w-[375px] h-[812px] bg-[#1a1a1a] rounded-[55px] p-[12px] shadow-2xl shadow-black/50">
          {/* Side buttons - left */}
          <div className="absolute -left-[3px] top-[120px] w-[3px] h-[35px] bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute -left-[3px] top-[175px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute -left-[3px] top-[245px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
          
          {/* Side button - right (power) */}
          <div className="absolute -right-[3px] top-[180px] w-[3px] h-[80px] bg-[#2a2a2a] rounded-r-sm" />
          
          {/* Screen bezel */}
          <div className="relative w-full h-full bg-black rounded-[43px] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a1a] mr-[50px]" />
            </div>
            
            {/* Screen content */}
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          </div>
        </div>
        
        {/* Reflection effect */}
        <div className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export function ResponsivePhoneWrapper({ children }: PhoneMockupProps) {
  return (
    <>
      {/* Mobile: app fills the viewport */}
      <div className="lg:hidden" style={{ height: "100dvh", width: "100%" }}>
        {children}
      </div>

      {/* Desktop: app rendered inside iPhone mockup */}
      <div className="hidden lg:block">
        <PhoneMockup>{children}</PhoneMockup>
      </div>
    </>
  );
}
