import { yupResolver } from '@hookform/resolvers/yup'
import { nanoid } from 'nanoid'
import { Dispatch, SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

interface FormInputs {
  nickname: string
}

interface GuestFormProps {
  setGuest: Dispatch<SetStateAction<{ id: string; name: string } | null>>
}

const schema = yup.object().shape({
  nickname: yup
    .string()
    .required('You must enter your nickname.')
    .max(20, "Nicknames can't be longer than 20 characters."),
})

function GuestForm({ setGuest }: GuestFormProps) {
  const { register, handleSubmit, errors } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  })

  const onSubmit = (data: FormInputs) => {
    setGuest({ id: nanoid(), name: data.nickname })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Enter your nickname
          </h2>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" name="remember" value="true" />
          <div>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="text"
                  name="nickname"
                  ref={register}
                  autoComplete="name"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <p className="mt-2 text-sm text-red-600">
              {errors.nickname?.message}
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-green-500 group-hover:text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              Start chatting
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GuestForm
