import axios from "axios"
import * as dns from "dns"
import * as http from "http"
import * as https from "https"
import * as net from "net"

const MAX_REDIRECTS = 5
const TIMEOUT_MS = 10_000
// Firestore documents are limited to 1 MiB including field names and the url
const MAX_MIDI_SIZE = 1_000_000

export class InvalidUrlError extends Error {}

// Addresses that must never be reachable from the function: loopback, private
// networks, link-local (including the metadata server), and other special-use ranges.
// IPv4-mapped IPv6 addresses are matched against the IPv4 rules by BlockList.
const blockList = new net.BlockList()
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockList.addSubnet(address, prefix, "ipv4")
}
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96], // NAT64
  ["100::", 64],
  ["2001:db8::", 32],
  ["2002::", 16], // 6to4
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockList.addSubnet(address, prefix, "ipv6")
}

const isPublicAddress = (address: string): boolean => {
  const family = net.isIP(address)
  if (family === 0) {
    return false
  }
  return !blockList.check(address, family === 4 ? "ipv4" : "ipv6")
}

// Validates the address actually used for the connection, so DNS rebinding
// between a check and the connect cannot bypass it.
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      callback(err, "", 0)
      return
    }
    if (
      addresses.length === 0 ||
      !addresses.every((a) => isPublicAddress(a.address))
    ) {
      callback(new InvalidUrlError(`Blocked address for ${hostname}`), "", 0)
      return
    }
    if ((options as dns.LookupOptions).all) {
      ;(
        callback as unknown as (
          err: null,
          addresses: dns.LookupAddress[],
        ) => void
      )(null, addresses)
    } else {
      callback(null, addresses[0].address, addresses[0].family)
    }
  })
}

const httpAgent = new http.Agent({ lookup: safeLookup })
const httpsAgent = new https.Agent({ lookup: safeLookup })

const parseUrl = (value: string, base?: URL): URL => {
  let url: URL
  try {
    url = new URL(value, base)
  } catch {
    throw new InvalidUrlError("Invalid URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError("Unsupported protocol")
  }
  if (url.username !== "" || url.password !== "") {
    throw new InvalidUrlError("Credentials in URL are not allowed")
  }
  // IP literals skip DNS lookup, so check them here
  const hostname = url.hostname.replace(/^\[(.*)\]$/, "$1")
  if (net.isIP(hostname) !== 0 && !isPublicAddress(hostname)) {
    throw new InvalidUrlError("Blocked address")
  }
  return url
}

export const validateExternalUrl = (value: unknown): URL => {
  if (typeof value !== "string") {
    throw new InvalidUrlError("URL must be a string")
  }
  return parseUrl(value)
}

export const fetchExternalFile = async (initialUrl: URL): Promise<Buffer> => {
  let url = initialUrl
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await axios.get<ArrayBuffer>(url.toString(), {
      responseType: "arraybuffer",
      httpAgent,
      httpsAgent,
      proxy: false,
      maxRedirects: 0,
      timeout: TIMEOUT_MS,
      maxContentLength: MAX_MIDI_SIZE,
      validateStatus: (status) => status >= 200 && status < 400,
    })
    if (res.status < 300) {
      return Buffer.from(res.data)
    }
    const location = res.headers["location"]
    if (typeof location !== "string") {
      throw new Error(`Redirect without location (status ${res.status})`)
    }
    url = parseUrl(location, url)
  }
  throw new Error("Too many redirects")
}

// Drops anything after the chunks declared by the MIDI header, so arbitrary
// data appended to a valid MIDI file is not stored.
export const trimToDeclaredChunks = (data: Buffer): Buffer => {
  if (data.length < 14 || data.toString("latin1", 0, 4) !== "MThd") {
    throw new Error("Not a MIDI file")
  }
  const headerLength = data.readUInt32BE(4)
  const numTracks = data.readUInt16BE(10)
  let offset = 8 + headerLength
  for (let i = 0; i < numTracks; i++) {
    if (offset + 8 > data.length) {
      throw new Error("Truncated MIDI file")
    }
    offset += 8 + data.readUInt32BE(offset + 4)
  }
  if (offset > data.length) {
    throw new Error("Truncated MIDI file")
  }
  return data.subarray(0, offset)
}
