export type UserRole = {
  id: string;
  user: string;
  organization: string;
  role: "manager" | "subscriber";
}