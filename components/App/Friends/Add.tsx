import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import DirectMesssagesSidebar from '../DirectMessages/Sidebar'
import ServersSidebar from '../Servers/Sidebar'
import FriendsHeader from './Header'
import 'twin.macro'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'react-query'
import { useFauna } from '@/lib/useFauna'
import addFriendMutation from '@/fauna/mutations/addFriend'

interface Inputs {
  email: string
}

const schema = z.object({
  email: z.string().email('Please enter a valid email.'),
})

function AddFriend() {
  const { client, accessToken } = useFauna()
  const { register, handleSubmit, errors, watch, reset } = useForm<Inputs>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation<Inputs & { added: boolean }, Error, Inputs>(
    async variables => {
      const res = await client.query<(Inputs & { added: boolean }) | string>(
        addFriendMutation(variables.email),
        { secret: accessToken },
      )

      if (typeof res === 'string') {
        throw new Error(res)
      }

      return res
    },
    {
      onSuccess: () => {
        reset()
      },
    },
  )

  const email = watch('email')

  const onSubmit = (data: Inputs) => {
    mutation.mutate({
      email: data.email,
    })
  }

  return (
    <div tw="flex">
      <ServersSidebar />

      <DirectMesssagesSidebar />

      <div tw="flex-1 flex flex-col">
        <FriendsHeader />

        <div tw="p-6">
          <h2 tw="uppercase font-semibold text-gray-600 text-sm">Add friend</h2>
          <p tw="mt-2 text-sm font-medium">
            You can add a friend with their Chatskee Email.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            tw="bg-gray-200 py-2 px-4 mt-4 ring ring-gray-300 rounded-md flex"
          >
            <input
              placeholder="Enter an email"
              tw="mr-6 bg-transparent focus:outline-none flex-1"
              name="email"
              ref={register}
            />

            <button
              disabled={!email || mutation.isLoading}
              tw="py-2 px-4 text-white bg-brand-500 rounded text-sm ml-auto disabled:opacity-40"
              type="submit"
            >
              Send Friend Request
            </button>
          </form>
          <p tw="mt-4 text-red-600 text-sm">{errors.email?.message}</p>

          {mutation.isSuccess && (
            <p tw="mt-4 text-sm text-green-600">
              {mutation.data?.added
                ? `Added ${mutation.data.email} as a friend!`
                : `A friend request was sent to ${mutation.data?.email}!`}
            </p>
          )}

          {mutation.isError && (
            <p tw="mt-4 text-red-600 text-sm">{mutation.error?.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(AddFriend)
