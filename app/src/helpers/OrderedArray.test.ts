import { OrderedArray } from "./OrderedArray"

describe("OrderedArray", () => {
  interface TestItem {
    id: number
    rowIndex: number
    name: string
  }

  let items: TestItem[]
  let orderedArray: OrderedArray<TestItem>

  beforeEach(() => {
    // Reset items before each test
    items = [
      { id: 3, rowIndex: 30, name: "Charlie" },
      { id: 1, rowIndex: 10, name: "Alice" },
      { id: 2, rowIndex: 20, name: "Bob" }
    ]
    orderedArray = new OrderedArray(items, (item) => item.rowIndex)
  })

  test("should sort the array on initialization", () => {
    const sorted = orderedArray.getArray()
    expect(sorted[0].rowIndex).toBe(10)
    expect(sorted[1].rowIndex).toBe(20)
    expect(sorted[2].rowIndex).toBe(30)
  })

  test("should sort in descending order when specified", () => {
    const descendingArray = new OrderedArray(
      [...items],
      (item) => item.rowIndex,
      true
    )
    const sorted = descendingArray.getArray()
    expect(sorted[0].rowIndex).toBe(30)
    expect(sorted[1].rowIndex).toBe(20)
    expect(sorted[2].rowIndex).toBe(10)
  })

  test("should add an element in the correct position", () => {
    orderedArray.add({ id: 4, rowIndex: 15, name: "Dave" })
    const array = orderedArray.getArray()
    
    expect(array.length).toBe(4)
    expect(array[0].rowIndex).toBe(10)
    expect(array[1].rowIndex).toBe(15)
    expect(array[2].rowIndex).toBe(20)
    expect(array[3].rowIndex).toBe(30)
  })

  test("should add an element in the correct position in descending order", () => {
    const descendingArray = new OrderedArray(
      [...items],
      (item) => item.rowIndex,
      true
    )
    
    descendingArray.add({ id: 4, rowIndex: 15, name: "Dave" })
    const array = descendingArray.getArray()
    
    expect(array.length).toBe(4)
    expect(array[0].rowIndex).toBe(30)
    expect(array[1].rowIndex).toBe(20)
    expect(array[2].rowIndex).toBe(15)
    expect(array[3].rowIndex).toBe(10)
  })

  test("should remove an element by id", () => {
    orderedArray.remove(2) // remove Bob
    const array = orderedArray.getArray()
    
    expect(array.length).toBe(2)
    expect(array[0].name).toBe("Alice")
    expect(array[1].name).toBe("Charlie")
  })

  test("should update an element and maintain correct order", () => {
    // Update Bob's rowIndex to 5
    orderedArray.update(2, { rowIndex: 5 })
    const array = orderedArray.getArray()
    
    expect(array.length).toBe(3)
    expect(array[0].name).toBe("Bob") // Bob should now be first
    expect(array[1].name).toBe("Alice")
    expect(array[2].name).toBe("Charlie")
  })

  test("should update an element and maintain correct descending order", () => {
    const descendingArray = new OrderedArray(
      [...items],
      (item) => item.rowIndex,
      true
    )
    
    // Update Bob's rowIndex to 5
    descendingArray.update(2, { rowIndex: 5 })
    const array = descendingArray.getArray()
    
    expect(array.length).toBe(3)
    expect(array[0].name).toBe("Charlie")
    expect(array[1].name).toBe("Alice")
    expect(array[2].name).toBe("Bob") // Bob should now be last
  })

  test("should handle elements with same key by using id for stable ordering", () => {
    // Add element with same rowIndex but different id
    orderedArray.add({ id: 4, rowIndex: 20, name: "David" })
    const array = orderedArray.getArray()
    
    // Check that elements with same rowIndex are ordered by id
    const indexOfBob = array.findIndex(item => item.name === "Bob")
    const indexOfDavid = array.findIndex(item => item.name === "David")
    
    expect(array.length).toBe(4)
    // Bob (id: 2) should come before David (id: 4) since both have rowIndex 20
    expect(indexOfBob).toBeLessThan(indexOfDavid)
  })

  test("should handle empty array", () => {
    const emptyArray = new OrderedArray<TestItem>([], (item) => item.rowIndex)
    expect(emptyArray.getArray().length).toBe(0)
    
    // Add an element to empty array
    emptyArray.add({ id: 1, rowIndex: 10, name: "Alice" })
    expect(emptyArray.getArray().length).toBe(1)
    expect(emptyArray.getArray()[0].name).toBe("Alice")
  })

  test("should handle edge cases: add at beginning, middle, and end", () => {
    // Add at beginning
    orderedArray.add({ id: 4, rowIndex: 5, name: "First" })
    // Add at end
    orderedArray.add({ id: 5, rowIndex: 40, name: "Last" })
    // Add in middle
    orderedArray.add({ id: 6, rowIndex: 25, name: "Middle" })
    
    const array = orderedArray.getArray()
    
    expect(array.length).toBe(6)
    expect(array[0].name).toBe("First")
    expect(array[1].name).toBe("Alice")
    expect(array[2].name).toBe("Bob")
    expect(array[3].name).toBe("Middle")
    expect(array[4].name).toBe("Charlie")
    expect(array[5].name).toBe("Last")
  })

  test("should retrieve elements by id in O(1) time", () => {
    const alice = orderedArray.get(1)
    const bob = orderedArray.get(2)
    const charlie = orderedArray.get(3)
    const nonExistent = orderedArray.get(999)
    
    expect(alice).toBeDefined()
    expect(alice?.name).toBe("Alice")
    expect(bob?.name).toBe("Bob")
    expect(charlie?.name).toBe("Charlie")
    expect(nonExistent).toBeUndefined()
    
    // Test that the map is updated after add/remove/update operations
    orderedArray.add({ id: 4, rowIndex: 15, name: "Dave" })
    const dave = orderedArray.get(4)
    expect(dave?.name).toBe("Dave")
    
    orderedArray.update(2, { name: "Bobby" })
    const bobby = orderedArray.get(2)
    expect(bobby?.name).toBe("Bobby")
    
    orderedArray.remove(1) // Remove Alice
    const aliceAfterRemove = orderedArray.get(1)
    expect(aliceAfterRemove).toBeUndefined()
  })
})