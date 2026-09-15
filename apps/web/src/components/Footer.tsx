import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-3 text-center text-sm text-ink-400 bg-[#FDFBF7]/80 border-t border-paper-200">
      <a
        href="https://beian.miit.gov.cn"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-ink-600 transition-colors"
      >
        沪ICP备2026026205号-1
      </a>
    </footer>
  );
};

export default Footer;
