import { App } from "../../../App";
import { fireEvent, render, screen } from "../../../test-utils";

test("ticket page displays band data for showId", async () => {
  render(<App />, {
    preLoadedState: { user: { userDetails: { email: "test@test.com" } } },
    routeHistory: ["/tickets/0"],
  });
  const heading = await screen.findByRole("heading", {
    name: "Avalanche of Cheese",
  });
  expect(heading).toBeInTheDocument();
});

test("'purchase' button pushes the correct URL", async () => {
  const { history } = render(<App />, {
    preLoadedState: { user: { userDetails: { email: "test@test.com" } } },
    routeHistory: ["/tickets/0"],
  });

  const purchaseButton = await screen.findByRole("button", {
    name: /purchase/i,
  });
  fireEvent.click(purchaseButton);
  expect(history.location.pathname).toBe("/confirm/0");
  const searchRegEx = expect.stringMatching(/holdId=\d+&seatCount=2/);
  expect(history.location.search).toEqual(searchRegEx);
});
