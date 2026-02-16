// header.jsx
export default function Header({ currentSection, onSectionChange }) {
  const sections = [
    { id: "home", label: "Home" },
    { id: "custom", label: "Custom" },
    { id: "about", label: "About" },
  ];

  return (
    <header className="bg-black text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <div
            className="text-xl font-bold cursor-pointer"
            onClick={() => onSectionChange("home")}
          >
            Logo
          </div>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`hover:text-gray-300 transition-colors ${
                  currentSection === section.id
                    ? "text-white font-semibold"
                    : "text-gray-400"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <button className="md:hidden">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
