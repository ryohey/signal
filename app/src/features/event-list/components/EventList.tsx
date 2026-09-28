import styled from "@emotion/styled"
import type { EventListItem as EventListItemData } from "@signal-app/event-list-editor"
import type { FC } from "react"
import { List, type RowComponentProps } from "react-window"
import { Localized } from "../../../localize/useLocalization"
import { EventListProvider } from "../context/EventListProvider"
import { useEventListItems } from "../hooks/useEventListItems"
import { EventListItem } from "./EventListItem"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`

const Header = styled.div`
  height: var(--size-ruler-height);
  border-bottom: 1px solid var(--color-divider);
  /* scroll bar width */
  padding-right: 14px;
`

export const Row = styled.div`
  display: grid;
  outline: none;
  grid-template-columns: 5em 1fr 5em 5em;

  &:focus {
    background: var(--color-highlight);
  }
`

export const Cell = styled.div`
  padding: 0.5rem;

  &:focus-within {
    background: var(--color-highlight);
  }
`

const EventList: FC = () => {
  return (
    <EventListProvider>
      <EventListContent />
    </EventListProvider>
  )
}

const EventListContent: FC = () => {
  const items = useEventListItems()

  return (
    <Container>
      <Header>
        <Row>
          <Cell>
            <Localized name="tick" />
          </Cell>
          <Cell>
            <Localized name="event" />
          </Cell>
          <Cell>
            <Localized name="duration" />
          </Cell>
          <Cell>
            <Localized name="value" />
          </Cell>
        </Row>
      </Header>
      <List
        rowComponent={ItemRenderer}
        rowCount={items.length}
        rowHeight={35}
        rowProps={{ items }}
      />
    </Container>
  )
}

const ItemRenderer = ({
  index,
  style,
  items,
}: RowComponentProps<{ items: readonly EventListItemData[] }>) => {
  const item = items[index]
  return <EventListItem style={style} item={item} key={item.id} />
}

export default EventList
