import { Collection, Ref } from 'faunadb'
import * as z from 'zod'

const paginationSchema = z.object({
  size: z
    .number()
    .max(100, "The size of a page can't be larger than 100")
    .optional(),
  before: z.string().optional(),
  after: z.string().optional(),
})

export default function getPaginationOptions(
  options: z.infer<typeof paginationSchema>,
  collection: string,
) {
  const { size, before, after } = paginationSchema.parse(options)

  return {
    size,
    before: before ? Ref(Collection(collection), before) : undefined,
    after: after ? Ref(Collection(collection), after) : undefined,
  }
}
