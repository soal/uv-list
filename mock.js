export function createMockData(numberOfElements = 100) {
  const elements = [];
  for (let i = 0; i < numberOfElements; i++) {
    elements.push({
      id: i,
      content:
        // `Content of good old item number ${i} `,
        `Content of good old item number ${i} ` +
        `${Array(Math.floor(Math.random() * 10)).fill(
          " some additonal words"
        )}`,
    });
  }
  return elements
}
