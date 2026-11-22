import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  links?: Action[];
  headerRight?: React.ReactNode;
}

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

const ListContainer = ({ children, title, links, headerRight }: Props) => {
  return (
    <div className="flex-1 bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-5 shadow-[0_2px_12px_rgba(28,28,31,0.03)] transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(28,28,31,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EEEEEE]">
        <h2 className="text-base font-bold text-[#1C1C1F] tracking-tight">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {headerRight}
          {links && links.length > 0 && (
            <div className="flex items-center gap-2">
              {links.map((link, index) =>
                link.href ? (
                  <Link
                    key={index}
                    href={link.href}
                    className="px-3.5 py-1.5 bg-[#F9F9F9] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-[#1C1C1F] text-xs font-semibold transition-all"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={index}
                    onClick={link.onClick}
                    className="px-3.5 py-1.5 bg-[#F9F9F9] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-[#1C1C1F] text-xs font-semibold transition-all cursor-pointer"
                  >
                    {link.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default ListContainer;
