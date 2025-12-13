export function basename(path: string) {
  return path.split("/").pop() ?? ""
}
