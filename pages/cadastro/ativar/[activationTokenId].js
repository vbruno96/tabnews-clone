import { Banner } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActivateUserPage() {
  const router = useRouter();
  const [responseData, setResponseData] = useState(null);
  const [activationStatus, setActivationStatus] = useState("loading");

  const { activationTokenId } = router.query;

  useEffect(() => {
    if (!activationTokenId) return;

    sendActivationRequest();

    async function sendActivationRequest() {
      try {
        const response = await fetch(
          `/api/v1/activations/${activationTokenId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const activationResponseBody = await response.json();
        setResponseData(activationResponseBody);

        if (response.status === 200) {
          setActivationStatus("success");
          return;
        }

        if (response.status === 208) {
          setActivationStatus("success");
          return;
        }

        setActivationStatus("failure");
      } catch {
        setResponseData({
          message:
            "Houve um falha de conexão com o servidor. Tente novamente mais tarde.",
        });
        setActivationStatus("failure");
      }
    }
  }, [activationTokenId]);

  return (
    <DefaultLayout
      contentWidth="small"
      metadata={{
        title: "Ativar cadastro",
      }}
    >
      {activationStatus === "loading" && (
        <Banner variant="info">
          <Banner.Title>Verificando token...</Banner.Title>
        </Banner>
      )}

      {activationStatus === "success" && (
        <Banner variant="success">
          <Banner.Title>Cadastro ativado com sucesso!</Banner.Title>
          <Banner.Description>
            Sua conta está ativa e voce já pode{" "}
            <Link href="/login">fazer o login.</Link>
          </Banner.Description>
        </Banner>
      )}

      {activationStatus === "failure" && (
        <Banner variant="critical">
          <Banner.Title>Não foi possível ativar seu cadastro</Banner.Title>
          <Banner.Description>{`${responseData.message} ${responseData.action}`}</Banner.Description>
        </Banner>
      )}
    </DefaultLayout>
  );
}
