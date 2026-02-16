// App.jsx
import { useState } from "react";
import Header from "./components/Header";
import TransitionOverlay from "./components/TransitionOverlay";

export default function App() {
  const [currentSection, setCurrentSection] = useState("home");
  const [transitioning, setTransitioning] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const changeSection = (nextSection) => {
    if (transitioning || nextSection === currentSection) return;

    setTransitioning(true);
    setTrigger((prev) => prev + 1); // trigger 증가

    // 트랜지션 중간(완전히 검정화면)에 섹션 변경
    setTimeout(() => {
      setCurrentSection(nextSection);
    }, 1250); // 2500ms의 절반 = 중간 지점

    // 트랜지션 완료 후 상태 리셋
    setTimeout(() => {
      setTransitioning(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen">
      <Header currentSection={currentSection} onSectionChange={changeSection} />

      <main>
        {currentSection === "home" && (
          <section className="min-h-screen p-8">
            <h1 className="text-4xl font-bold">Home Section</h1>
            {/* Home 콘텐츠 */}
          </section>
        )}

        {currentSection === "custom" && (
          <section className="min-h-screen p-8 bg-gray-100">
            <h1 className="text-4xl font-bold">Custom Section</h1>
            {/* Custom 콘텐츠 */}
          </section>
        )}

        {currentSection === "about" && (
          <section className="min-h-screen p-8">
            <h1 className="text-4xl font-bold">About Section</h1>
            {/* About 콘텐츠 */}
          </section>
        )}
      </main>

      {/* Transition Shader Overlay */}
      <TransitionOverlay trigger={trigger} />
    </div>
  );
}
