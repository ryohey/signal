import styled from "@emotion/styled"
import CloseIcon from "mdi-react/CloseIcon"
import { FC, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "../Dialog/Dialog"

export interface ChangelogDialogProps {
  open: boolean
  onClose: () => void
}

interface GitHubRelease {
  name: string
  tag_name: string
  body: string
  published_at: string
  html_url: string
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  border-radius: 0.25rem;

  &:hover {
    background: var(--color-hover);
  }
`

const ReleaseSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const ReleaseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-divider);
`

const ReleaseTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
`

const ReleaseDate = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
`

const ReleaseBody = styled.div`
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  white-space: pre-wrap;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-text);
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0.5rem 0;
  }

  ul,
  ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.25rem 0;
  }

  code {
    background: var(--color-background-secondary);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: "Courier New", monospace;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
`

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
`

const ViewOnGitHub = styled.a`
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

export const ChangelogDialog: FC<ChangelogDialogProps> = ({
  open,
  onClose,
}) => {
  const [releases, setReleases] = useState<GitHubRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const fetchReleases = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          "https://api.github.com/repos/ryohey/signal/releases?per_page=5",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch releases")
        }

        const data: GitHubRelease[] = await response.json()
        setReleases(data)
      } catch (err) {
        console.error("Error fetching releases:", err)
        setError("変更履歴の取得に失敗しました。GitHubで直接確認してください。")
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [open])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <Header>
        <DialogTitle>変更履歴</DialogTitle>
        <CloseButton onClick={onClose}>
          <CloseIcon size={20} />
        </CloseButton>
      </Header>
      <DialogContent>
        {loading && <LoadingMessage>読み込み中...</LoadingMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && !error && releases.length === 0 && (
          <ErrorMessage>変更履歴がありません。</ErrorMessage>
        )}
        {!loading && !error && releases.length > 0 && (
          <>
            {releases.map((release) => (
              <ReleaseSection key={release.tag_name}>
                <ReleaseHeader>
                  <ReleaseTitle>
                    {release.name || release.tag_name}
                  </ReleaseTitle>
                  <ReleaseDate>{formatDate(release.published_at)}</ReleaseDate>
                </ReleaseHeader>
                <ReleaseBody>
                  {release.body || "詳細はありません。"}
                </ReleaseBody>
                <ViewOnGitHub
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHubで見る →
                </ViewOnGitHub>
              </ReleaseSection>
            ))}
          </>
        )}
        {!loading && !error && (
          <ViewOnGitHub
            href="https://github.com/ryohey/signal/releases"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: "1rem" }}
          >
            すべてのリリースを見る →
          </ViewOnGitHub>
        )}
      </DialogContent>
    </Dialog>
  )
}
