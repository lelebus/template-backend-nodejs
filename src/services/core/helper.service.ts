export function generateRandomNumericToken(digits: number): string {
  let token = "";
  for (let i = 0; i < digits; i++) {
    token += Math.floor(Math.random() * 10);
  }

  return token;
}
