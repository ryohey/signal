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
      { id: 2, rowIndex: 20, name: "Bob" },
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
      true,
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
      true,
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

  test("should handle removing a non-existent id gracefully", () => {
    const arrayBefore = orderedArray.getArray()
    orderedArray.remove(999) // non-existent id
    const arrayAfter = orderedArray.getArray()

    expect(arrayAfter.length).toBe(arrayBefore.length)
    expect(arrayAfter).toEqual(arrayBefore)
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

  test("should handle updating a non-existent id gracefully", () => {
    const arrayBefore = orderedArray.getArray()
    orderedArray.update(999, { name: "NonExistent" })
    const arrayAfter = orderedArray.getArray()

    expect(arrayAfter.length).toBe(arrayBefore.length)
    expect(arrayAfter).toEqual(arrayBefore)
  })

  test("should update an element and maintain correct descending order", () => {
    const descendingArray = new OrderedArray(
      [...items],
      (item) => item.rowIndex,
      true,
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
    const indexOfBob = array.findIndex((item) => item.name === "Bob")
    const indexOfDavid = array.findIndex((item) => item.name === "David")

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

  test("should maintain lookupMap consistency with array after multiple operations", () => {
    // Perform a series of operations
    orderedArray.add({ id: 4, rowIndex: 15, name: "Dave" })
    orderedArray.add({ id: 5, rowIndex: 25, name: "Eve" })
    orderedArray.remove(1) // Remove Alice
    orderedArray.update(3, { rowIndex: 5 }) // Move Charlie to front
    orderedArray.update(4, { name: "David" }) // Rename Dave without changing position

    // Check lookupMap integrity
    const array = orderedArray.getArray()

    // Verify every element in the array is retrievable by ID
    for (const item of array) {
      const retrieved = orderedArray.get(item.id)
      expect(retrieved).toBe(item) // Should be the exact same object reference
    }

    // Verify removed elements are not in the lookupMap
    expect(orderedArray.get(1)).toBeUndefined()
  })

  test("should handle duplicate IDs correctly", () => {
    // This test is important because in a real application, accidental duplicate IDs could happen
    const dubItems = [
      { id: 1, rowIndex: 10, name: "Alice" },
      { id: 2, rowIndex: 20, name: "Bob" },
      { id: 2, rowIndex: 30, name: "Duplicate Bob" }, // Duplicate ID
    ]

    // The class should use the last item with a given ID in the lookupMap
    const dubArray = new OrderedArray(dubItems, (item) => item.rowIndex)

    // Verify the lookupMap has the last item with ID 2
    expect(dubArray.get(2)?.name).toBe("Duplicate Bob")
    expect(dubArray.getArray().length).toBe(3) // All items should still be in the array

    // When removing by ID, it should remove the item referenced in the lookupMap
    const beforeRemoveArray = [...dubArray.getArray()]
    dubArray.remove(2)

    // The array after removal should have one less item
    expect(dubArray.getArray().length).toBe(2)

    // Count how many items with id=2 are left (should be 0 or 1 depending on implementation)
    const remainingItemsWithId2 = dubArray
      .getArray()
      .filter((item) => item.id === 2).length
    // We expect at most one item with id=2 to remain
    expect(remainingItemsWithId2).toBeLessThanOrEqual(1)

    // Check that lookupMap no longer has id=2
    expect(dubArray.get(2)).toBeUndefined()
  })

  test("should handle string keys correctly", () => {
    interface StringKeyItem {
      id: number
      category: string
      name: string
    }

    const stringItems: StringKeyItem[] = [
      { id: 1, category: "C", name: "First" },
      { id: 2, category: "A", name: "Second" },
      { id: 3, category: "B", name: "Third" },
    ]

    const stringKeyArray = new OrderedArray<StringKeyItem, string>(
      stringItems,
      (item) => item.category,
    )

    const sorted = stringKeyArray.getArray()
    expect(sorted[0].category).toBe("A")
    expect(sorted[1].category).toBe("B")
    expect(sorted[2].category).toBe("C")
  })

  test("should update the lookupMap correctly when updating ID", () => {
    // Edge case: what if we update the ID itself?
    // First add an item
    orderedArray.add({ id: 4, rowIndex: 15, name: "Dave" })

    // Then update its ID (this is a bit of an edge case since IDs are usually immutable)
    // We're creating a new object with a different ID but same content otherwise
    const updatedDave = { id: 5, rowIndex: 15, name: "Dave" }
    orderedArray.remove(4) // Remove by old ID
    orderedArray.add(updatedDave) // Add with new ID

    // Should be able to find by new ID
    expect(orderedArray.get(5)?.name).toBe("Dave")
    // Old ID should be gone
    expect(orderedArray.get(4)).toBeUndefined()
  })

  test("should handle updates that don't change order", () => {
    // Update that doesn't affect sort order
    orderedArray.update(2, { name: "Bobby" })
    const array = orderedArray.getArray()

    expect(array.length).toBe(3)
    expect(array[0].name).toBe("Alice")
    expect(array[1].name).toBe("Bobby") // Name changed but position same
    expect(array[2].name).toBe("Charlie")

    // Lookup should work
    expect(orderedArray.get(2)?.name).toBe("Bobby")
  })
})
