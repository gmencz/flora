import { GetServerSideProps } from 'next'

// We will remove this withAuthenticationRequired HOC
// when this page is done.
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/app',
      permanent: false,
    },
  }
}

function IndexPage() {
  // TODO: Marketing page
  return null
}

export default IndexPage
