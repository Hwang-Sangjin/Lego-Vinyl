import { useEffect, useState } from "react";

export function useScrollRatio(ref) {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const sectionTop = scrollTop + r.top;
      const sectionHeight = el.offsetHeight;
      const viewH = window.innerHeight;

      // 섹션 시작부터 끝까지의 순수 진행도
      const scrolled = scrollTop - sectionTop;
      const scrollable = sectionHeight - viewH;

      setRatio(Math.min(1, Math.max(0, scrolled / scrollable)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return ratio;
}
