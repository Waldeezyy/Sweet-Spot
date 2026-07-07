import { SquareClient, SquareEnvironment } from "square";

export function isSquareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

function getSquareEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

export const square = isSquareConfigured()
  ? new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: getSquareEnvironment(),
    })
  : null;

export function getSquareLocationId(): string {
  return process.env.SQUARE_LOCATION_ID ?? "";
}
