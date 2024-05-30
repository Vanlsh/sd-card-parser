export function reverseBuffer(buffer) {
  const length = buffer.length;
  const halfLength = Math.floor(length / 2);

  for (let i = 0; i < halfLength; i++) {
    const temp = buffer[i];
    buffer[i] = buffer[length - 1 - i];
    buffer[length - 1 - i] = temp;
  }

  return buffer;
}
