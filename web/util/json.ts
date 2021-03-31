import { CustomError } from 'ts-custom-error'
import { ApiError } from './handler'

interface RequestOptions<TBody> {
  body?: TBody | null | undefined
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

const defaultOptions: RequestOptions<any> = {
  method: 'GET',
}

export class HttpError extends CustomError {
  public constructor(public statusCode: number, message?: string) {
    super(message)
  }
}

export async function json<TData, TBody = Record<string, unknown>>(
  endpoint: string,
  options: RequestOptions<TBody> = defaultOptions,
) {
  const headers: Record<string, string> = {}

  if (options.body) {
    headers['content-type'] = 'application/json'
  }

  const response = await fetch(endpoint, {
    method: options.method,
    body: JSON.stringify(options.body),
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const { msg } = (await response.json()) as ApiError
    throw new HttpError(response.status, msg)
  }

  const data = await response.json()
  return data as TData
}
