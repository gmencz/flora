type SerializedData = string | Buffer | ArrayBuffer
type Serializer<TRawData> = (data: TRawData) => SerializedData
type Deserializer<TDeserializedData> = (
  data: SerializedData,
) => TDeserializedData

export function serialize<TRawData>(
  data: TRawData,
  serializer: Serializer<TRawData> = data => JSON.stringify(data),
) {
  return serializer(data)
}

export function deserialize<TDeserializedData>(
  data: SerializedData,
  deserializer: Deserializer<TDeserializedData> = data =>
    JSON.parse(data as string),
) {
  return deserializer(data)
}
