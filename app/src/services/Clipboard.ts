export async function readClipboardData(): Promise<object | null> {
  try {
    const data = await navigator.clipboard.readText()
    if (!data) {
      return null
    }
    const parsedData = JSON.parse(data)
    return parsedData
  } catch {
    return null
  }
}

export async function writeClipboardData<T extends object>(
  data: T
): Promise<void> {
  try {
    const jsonData = JSON.stringify(data)
    await navigator.clipboard.writeText(jsonData)
  } catch (error) {
    console.error("Failed to write to clipboard:", error)
  }
}

export function readJSONFromClipboard(e: ClipboardEvent) {
  const jsonString = e.clipboardData?.getData("text/plain")
  if (jsonString) {
    const obj = JSON.parse(jsonString)
    return obj
  }
  return null
}
