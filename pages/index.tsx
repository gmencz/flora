import { useQueryClient } from "react-query";
import useSubscription from "../utils/useSubscription";

interface CountriesQuery {
  data: {
    countries: {
      id: string;
      name: string;
    }[];
  };
}

async function fetchCountries(): Promise<CountriesQuery> {
  const res = await fetch("http://localhost:8080/v1/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      operationName: "Countries",
      query: `
        query Countries {
          countries {
            id
            name
          }
        }
      `,
    }),
  });

  const data = await res.json();
  return data;
}

const OPERATION_NAME = "Countries";
const COUNTRIES = `
  subscription Countries {
    countries {
      id
      name
    }
  }
`;

const IndexPage = () => {
  const queryClient = useQueryClient();
  const { isLoading, isError, data } = useSubscription(
    OPERATION_NAME,
    fetchCountries,
    {
      wsUrl: "ws://localhost:8080/v1/graphql",
      subscription: {
        operationName: OPERATION_NAME,
        query: COUNTRIES,
      },
      onData: (data) => {
        queryClient.setQueryData<CountriesQuery>(OPERATION_NAME, data);
      },
    }
  );

  if (isLoading) {
    return (
      <div style={{ padding: "1rem 2rem" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: "1rem 2rem" }}>
        <p>Oops! Something went wrong</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 2rem" }}>
      <h1>Countries:</h1>
      <pre>{JSON.stringify(data?.data.countries, null, 2)}</pre>
    </div>
  );
};

export default IndexPage;
