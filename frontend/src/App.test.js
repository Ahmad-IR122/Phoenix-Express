import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the public home page", () => {
  render(<App />);

  expect(screen.getByRole("img", { name: /phonex/i })).toBeInTheDocument();
});
