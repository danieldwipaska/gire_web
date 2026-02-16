import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  links?: Action[];
}

interface Action {
  label: string;
  href: string;
}

const ListContainer = ({ children, title, links }: Props) => {
  return (
    <div className="flex-1 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {links && links.length > 0 && (
          <div className="flex items-center gap-3">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="px-4 py-2 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default ListContainer;
