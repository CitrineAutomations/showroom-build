export const GET_ACTIVE_PULL = `
  query GetActivePull($clientId: ID!) {
    pulls(
      filter: {
        client: { id: { eq: $clientId } }
        stage: { in: [OUT, DUE_SOON, OVERDUE] }
      }
      first: 1
    ) {
      edges {
        node {
          id
          name
          stage
          returnDate
          contractSent
          contractSigned
          client {
            id
            name { firstName lastName }
            emails { primaryEmail }
            phones { primaryPhoneNumber }
          }
          items {
            edges {
              node {
                id
                itemId
                designer
                color
                season
                photo {
                  fileId
                  label
                  extension
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_CLOSED_PULLS = `
  query GetClosedPulls($clientId: ID!, $after: String) {
    pulls(
      filter: {
        client: { id: { eq: $clientId } }
        stage: { eq: CLOSED }
      }
      first: 10
      after: $after
      orderBy: { createdAt: DescNullsLast }
    ) {
      edges {
        node {
          id
          name
          createdAt
          coverageEvent
          coveragePlatform
          creditGiven
          items { totalCount }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`
