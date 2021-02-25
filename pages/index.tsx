import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "react-query";
import { SubscriptionClient } from "subscriptions-transport-ws";

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
      variables: null,
    }),
  });

  const data = await res.json();
  return data;
}

const IndexPage = () => {
  const countriesQuery = useQuery("countries", fetchCountries);
  const isInitialDataRef = useRef(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = new SubscriptionClient("ws://localhost:8080/v1/graphql", {
      reconnect: true,
    });

    client
      .request({
        operationName: "Countries",
        query: `
          subscription Countries {
            countries {
              id
              name
            }
          }
      `,
      })
      .subscribe({
        next: (data) => {
          if (!isInitialDataRef.current) {
            queryClient.setQueryData<CountriesQuery>(
              "countries",
              (existingCountries) => {
                const { data: countries } = data as CountriesQuery;
                if (!existingCountries) {
                  return { data: countries };
                }

                const uniqueCountries = Array.from(
                  new Set(countries.countries.map((country) => country.id))
                ).map(
                  (id) =>
                    countries.countries.find((country) => country.id === id)!
                );

                return {
                  data: {
                    countries: uniqueCountries,
                  },
                };
              }
            );
          }

          isInitialDataRef.current = false;
        },
      });
  }, []);

  if (countriesQuery.isLoading) {
    return (
      <div style={{ padding: "1rem 2rem" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (countriesQuery.isError) {
    return (
      <div style={{ padding: "1rem 2rem" }}>
        <p>Oops! Something went wrong</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 2rem" }}>
      <h1>Countries:</h1>
      <pre>{JSON.stringify(countriesQuery.data?.data.countries, null, 2)}</pre>
    </div>
  );
};

export default IndexPage;
