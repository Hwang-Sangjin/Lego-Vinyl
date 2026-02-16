import React from "react";
import Banner from "/image/MainBanner.webp";

const Home = () => {
  return (
    <section className="min-h-screen p-0">
      <img
        src={Banner}
        alt="Main Banner"
        className="w-full h-full object-cover"
      />
    </section>
  );
};

export default Home;
