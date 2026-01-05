import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <br />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = isLoading
    ? "Carregando..."
    : new Date(data.updated_at).toLocaleString("pt-BR");

  return <div>Ultima atualização {updatedAtText}</div>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  return (
    <>
      <h2>Banco de dados</h2>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <ul>
          <li>
            Máximo de conexões: {data.dependencies.database.max_connections}
          </li>
          <li>
            Conexões abertas: {data.dependencies.database.opened_connections}
          </li>
          <li>Versão: {data.dependencies.database.version}</li>
        </ul>
      )}
    </>
  );
}
