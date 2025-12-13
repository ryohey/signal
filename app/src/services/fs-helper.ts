/**
 * Writes the contents to disk.
 *
 * @param {FileSystemFileHandle} fileHandle File handle to write to.
 * @param contents Contents to write.
 */
export async function writeFile(
  fileHandle: FileSystemFileHandle,
  contents: FileSystemWriteChunkType
) {
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable()
  // Write the contents of the file to the stream.
  await writable.write(contents)
  // Close the file and write the contents to disk.
  await writable.close()
}

/**
 * Verify the user has granted permission to read or write to the file, if
 * permission hasn't been granted, request permission.
 *
 * @param {FileSystemFileHandle} fileHandle File handle to check.
 * @param {boolean} withWrite True if write permission should be checked.
 * @return {boolean} True if the user has granted read/write permission.
 */
export async function verifyPermission(
  fileHandle: FileSystemFileHandle,
  withWrite: boolean
) {
  const opts: FileSystemHandlePermissionDescriptor = {}
  if (withWrite) {
    opts.mode = "readwrite"
  }
  // Check if we already have permission, if so, return true.
  if ((await fileHandle.queryPermission(opts)) === "granted") {
    return true
  }
  // Request permission to the file, if the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === "granted") {
    return true
  }
  // The user did nt grant permission, return false.
  return false
}
