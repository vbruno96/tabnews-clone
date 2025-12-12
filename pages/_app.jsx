import "./index.css";
import buildImg from "../src/assets/build.svg";
import Image from "next/image";

export default function Home() {
  return (
    <main style={{ height: "100dvh", fontFamily: "sans-serif" }}>
      <h1>🪚 Em construção 🛠️</h1>
      <Image src={buildImg} width={280} height={320} alt="" />
      <p>
        Isso aqui ainda é só uma ideia maluca que talvez no futuro vire hub de
        notícias ou outra coisa qualquer. 😄
      </p>
    </main>
  );
}
