module.exports = {
  client: {
    includes: ['./gql/**/*.graphql'],
    service: {
      name: 'chatskee',
      url: 'http://localhost:8080/v1/graphql',
      headers: {
        'x-hasura-admin-secret': 'myadminsecretkey',
      },
    },
  },
}
