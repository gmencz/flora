export default function uniquify<TData>(
  data: TData[],
  key: keyof TData
): TData[] {
  return Array.from(new Set(data.map((item) => item[key]))).map(
    (keyValue) => data.find((item) => item[key] === keyValue)!
  );
}
