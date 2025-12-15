import styled from "@emotion/styled"

import { FC } from "react"
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  TwitterShareButton,
  VKIcon,
  VKShareButton,
  WeiboIcon,
  WeiboShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from "react-share"
import { CopyTextForm } from "./CopyTextForm.js"

export interface LinkShareProps {
  url: string
  text: string
}

const Buttons = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  grid-gap: 0.5rem;

  & > button:hover {
    opacity: 0.8;
  }
`

export const LinkShare: FC<LinkShareProps> = ({ url, text }) => {
  return (
    <>
      <CopyTextForm text={url} />
      <Buttons>
        <TwitterShareButton url={url} title={text}>
          <XIcon size={32} round />
        </TwitterShareButton>
        <FacebookShareButton url={url}>
          <FacebookIcon size={32} round />
        </FacebookShareButton>
        <WhatsappShareButton url={url} title={text}>
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>
        <VKShareButton url={url} title={text}>
          <VKIcon size={32} round />
        </VKShareButton>
        <WeiboShareButton url={url} title={text}>
          <WeiboIcon size={32} round />
        </WeiboShareButton>
        <EmailShareButton url={url} subject="Check out this song on signal">
          <EmailIcon size={32} round />
        </EmailShareButton>
      </Buttons>
    </>
  )
}
