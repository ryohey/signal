declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(numChannels: number, sampleRate: number, bitRate: number);
    encodeBuffer(buffer: Int16Array): Iterable<number>;
    flush(): Iterable<number>;
  }
}
