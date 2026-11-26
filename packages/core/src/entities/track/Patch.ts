/**
 * The sound a channel plays: a program change together with the bank select
 * (CC#0 and CC#32) values in effect when it is sent.
 */
export interface Patch {
  programNumber: number
  bankMSB: number
  bankLSB: number
}
