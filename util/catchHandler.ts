import { NextApiRequest, NextApiResponse } from 'next'

/**
  Wrapper for API handlers, if there's an error caused by a fauna query, it will
  return it with the appropiate status code based on fauna's response, if it's
  any other error it will return a 500.
*/
const catchHandler = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>,
) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error(error)
    return res.status(error.requestResult?.statusCode ?? 500).json({
      message: error.message ?? 'Oops! Something went wrong',
    })
  }
}

export default catchHandler
