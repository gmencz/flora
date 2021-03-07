export default function ifThruthy<TValue, TOutput>(
  value: TValue,
  output: TOutput,
) {
  if (value) {
    return output
  }

  return undefined
}
