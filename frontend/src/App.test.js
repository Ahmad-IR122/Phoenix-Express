import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./routes/AppRoutes", () => () => (
  <img alt="Phonex" src="/mock-logo.png" />
));

test("renders the public home page", () => {
  render(<App />);

  expect(screen.getByRole("img", { name: /phonex/i })).toBeInTheDocument();
});
