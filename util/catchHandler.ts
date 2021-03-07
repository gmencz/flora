import { NextApiRequest, NextApiResponse } from 'next'

const catchHandler = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>,
) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Oops! Something went wrong',
    })
  }
}

export default catchHandler
