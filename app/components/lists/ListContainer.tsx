import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  links?: Action[];
}

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

const ListContainer = ({ children, title, links }: Props) => {
  return (
    <div className="flex-1 bg-[#131924] border border-slate-800/80 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {links && links.length > 0 && (
          <div className="flex items-center gap-2">
            {links.map((link, index) =>
              link.href ? (
                <Link
                  key={index}
                  href={link.href}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-slate-200 text-xs font-semibold transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={link.onClick}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  {link.label}
                </button>
              ),
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default ListContainer;
