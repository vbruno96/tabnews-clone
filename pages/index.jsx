import DefaultLayout from "interface/DefaultLayout";
import buildImg from "src/assets/build.svg";
import Image from "next/image";

export default function Home() {
  return (
    <DefaultLayout>
      <main style={{ height: "100dvh", fontFamily: "sans-serif" }}>
        <h1>🪚 Em construção 🛠️</h1>
        <Image src={buildImg} width={280} height={320} alt="" loading="eager" />
        <p>
          Isso aqui ainda é só uma ideia maluca que talvez no futuro vire hub de
          notícias ou outra coisa qualquer. 😄
        </p>
      </main>
    </DefaultLayout>
  );
}
