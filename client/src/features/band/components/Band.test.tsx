import { App } from "../../../App";
import { render, screen } from "../../../test-utils";

test("band page displays name for correct band", async () => {
  render(<App />, { routeHistory: ["/bands/0"] });
  const heading = await screen.findByRole("heading", {
    name: /Avalanche of cheese/i,
  });
  expect(heading).toBeInTheDocument();
});
